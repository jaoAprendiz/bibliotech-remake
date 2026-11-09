import type { Book, BookCopy, Library, Reservation, User, UserStatus } from '../types/library.ts';
import { seedLibrary } from '../data/library.ts';

export const isLoan = (item: Reservation) => item.status === 'APPROVED' || item.status === 'OVERDUE';
export const isOpen = (item: Reservation) => item.status === 'PENDING' || isLoan(item);
export const availableCopies = (data: Library, bookId: string) =>
  data.copies.filter(copy => copy.bookId === bookId && copy.status === 'AVAILABLE');
export const activeCount = (data: Library, userId: string) =>
  data.reservations.filter(item => item.userId === userId && isLoan(item)).length;
export const formatDate = (date?: string) => date ? new Intl.DateTimeFormat('pt-BR').format(new Date(date)) : '—';

export function refreshOverdue(data: Library, now = new Date()): Library {
  const overdue = data.reservations.filter(item => item.status === 'APPROVED' && item.dueAt && new Date(item.dueAt) < now);
  if (!overdue.length) return data;
  return {
    ...data,
    reservations: data.reservations.map(item => overdue.includes(item) ? { ...item, status: 'OVERDUE' } : item),
    users: data.users.map(user => user.status === 'ACTIVE' && overdue.some(item => item.userId === user.id)
      ? { ...user, status: 'BLOCKED', reason: 'Empréstimo com devolução em atraso' } : user),
  };
}

export type Action =
  | { type: 'request'; bookId: string }
  | { type: 'approve'; id: string; copyId: string }
  | { type: 'return' | 'cancel'; id: string }
  | { type: 'book'; book: Book }
  | { type: 'copy'; copy: BookCopy }
  | { type: 'user'; id: string; status: UserStatus; reason?: string }
  | { type: 'profile'; name: string }
  | { type: 'password'; current: string; password: string }
  | { type: 'reset' };

export function applyAction(input: Library, actorId: string, action: Action, now = new Date()): Library {
  const data = refreshOverdue(input, now);
  const actor = data.users.find(user => user.id === actorId);
  if (!actor || actor.status === 'INACTIVE') throw new Error('Sessão indisponível. Entre novamente.');
  const admin = actor.role === 'admin' && actor.status === 'ACTIVE';
  const saveUser = (updated: User) => ({ ...data, users: data.users.map(user => user.id === updated.id ? updated : user) });
  const requireAdmin = () => { if (!admin) throw new Error('Esta ação exige acesso administrativo.'); };
  const timestamp = now.toISOString();

  switch (action.type) {
    case 'profile':
      return saveUser({ ...actor, name: action.name.trim() });
    case 'password':
      if (actor.password !== action.current) throw new Error('A senha atual está incorreta.');
      return saveUser({ ...actor, password: action.password });
    case 'reset':
      requireAdmin();
      return seedLibrary(now);
    case 'request': {
      if (actor.role !== 'student' || actor.status !== 'ACTIVE') throw new Error(actor.reason || 'Sua conta não pode solicitar reservas.');
      if (!availableCopies(data, action.bookId).length) throw new Error('Nenhum exemplar disponível neste momento.');
      const open = data.reservations.filter(item => item.userId === actorId && isOpen(item));
      if (open.some(item => item.bookId === action.bookId)) throw new Error('Você já tem uma reserva em andamento para este título.');
      if (open.length >= 3) throw new Error('O limite é de três reservas em andamento.');
      return { ...data, reservations: [{ id: crypto.randomUUID(), userId: actorId, bookId: action.bookId, status: 'PENDING', requestedAt: timestamp }, ...data.reservations] };
    }
    case 'approve':
    case 'return':
    case 'cancel': {
      const reservation = data.reservations.find(item => item.id === action.id);
      if (!reservation) throw new Error('Reserva não encontrada.');
      if (!admin && !(action.type === 'cancel' && actorId === reservation.userId && reservation.status === 'PENDING')) requireAdmin();
      const update = (updated: Reservation, copyId?: string, status?: BookCopy['status']): Library => ({
        ...data, reservations: data.reservations.map(item => item.id === updated.id ? updated : item),
        copies: status ? data.copies.map(copy => copy.id === copyId ? { ...copy, status } : copy) : data.copies,
      });
      if (action.type === 'approve') {
        if (reservation.status !== 'PENDING') throw new Error('Apenas reservas pendentes podem ser aprovadas.');
        if (data.users.find(user => user.id === reservation.userId)?.status !== 'ACTIVE') throw new Error('A conta precisa estar ativa.');
        if (activeCount(data, reservation.userId) >= 3) throw new Error('O usuário já atingiu o limite de empréstimos.');
        if (!availableCopies(data, reservation.bookId).some(copy => copy.id === action.copyId)) throw new Error('Selecione um exemplar disponível.');
        const dueAt = new Date(now.getTime() + 14 * 86_400_000).toISOString();
        return update({ ...reservation, copyId: action.copyId, status: 'APPROVED', pickedUpAt: timestamp, dueAt }, action.copyId, 'ON_LOAN');
      }
      if (action.type === 'return' && !isLoan(reservation)) throw new Error('A devolução exige um empréstimo ativo.');
      if (action.type === 'cancel' && reservation.status !== 'PENDING') throw new Error('Apenas solicitações pendentes podem ser canceladas.');
      return update({ ...reservation, status: action.type === 'return' ? 'RETURNED' : 'CANCELLED', closedAt: timestamp },
        reservation.copyId, action.type === 'return' ? 'AVAILABLE' : undefined);
    }
    case 'book':
      requireAdmin();
      if (data.books.some(book => book.isbn === action.book.isbn && book.id !== action.book.id)) throw new Error('Já existe um título com este ISBN.');
      return { ...data, books: [...data.books.filter(book => book.id !== action.book.id), action.book] };
    case 'copy': {
      requireAdmin();
      const old = data.copies.find(copy => copy.id === action.copy.id);
      if (!data.books.some(book => book.id === action.copy.bookId) || (old && old.bookId !== action.copy.bookId)) throw new Error('Título do exemplar inválido.');
      if ((old?.status === 'ON_LOAN') !== (action.copy.status === 'ON_LOAN')) throw new Error('Altere a disponibilidade pelo fluxo de empréstimo.');
      if (data.copies.some(copy => copy.accession.toLowerCase() === action.copy.accession.toLowerCase() && copy.id !== action.copy.id)) throw new Error('Número de tombo já cadastrado.');
      return { ...data, copies: [...data.copies.filter(copy => copy.id !== action.copy.id), action.copy] };
    }
    case 'user': {
      requireAdmin();
      const target = data.users.find(user => user.id === action.id);
      if (!target || target.role === 'admin' || target.status === 'INACTIVE') throw new Error('A conta não pode ser alterada.');
      if (action.status === 'INACTIVE' && data.reservations.some(item => item.userId === target.id && isOpen(item))) throw new Error('Finalize as reservas em andamento antes de desativar a conta.');
      return saveUser({ ...target, status: action.status, reason: action.status === 'ACTIVE' ? undefined : action.reason });
    }
  }
}
