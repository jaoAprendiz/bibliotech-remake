import { ArrowRight, BookOpen, CalendarDays, Clock3, Layers3, LibraryBig, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable, EmptyState, PageHeader, StatusBadge } from '../../components/ui';
import { useLibrary } from '../../contexts/LibraryContext';
import { availableCopies, formatDate, isLoan } from '../../services/library';

export function AdminDashboard() {
  const { data } = useLibrary();
  const pending = data.reservations.filter(item => item.status === 'PENDING');
  const loans = data.reservations.filter(isLoan);
  const deadlines = loans.filter(item => item.status === 'APPROVED' && item.dueAt && new Date(item.dueAt).getTime() <= Date.now() + 7 * 86_400_000)
    .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));
  const metrics = [
    ['Títulos cadastrados', data.books.length, BookOpen, '/admin/acervo'],
    ['Exemplares físicos', data.copies.length, Layers3, '/admin/acervo'],
    ['Reservas pendentes', pending.length, CalendarDays, '/admin/reservas'],
    ['Empréstimos ativos', loans.length, Clock3, '/admin/reservas?aba=ativas'],
    ['Títulos indisponíveis', data.books.filter(book => !availableCopies(data, book.id).length).length, LibraryBig, '/admin/acervo?status=unavailable'],
    ['Usuários bloqueados', data.users.filter(user => user.status === 'BLOCKED').length, LockKeyhole, '/admin/usuarios?status=BLOCKED'],
  ] as const;
  const recent = [...data.reservations].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)).slice(0, 5);
  return <>
    <PageHeader title="Dashboard" description="Visão geral da operação da biblioteca." action={<Link className="button" to="/admin/acervo?novo=1">Cadastrar título <ArrowRight size={16} /></Link>} />
    <div className="metrics">{metrics.map(([label, value, Icon, to]) => <Link to={to} key={label}><Icon size={20} /><span><strong>{value}</strong><small>{label}</small></span><ArrowRight size={16} /></Link>)}</div>
    <section className="section"><header className="section-heading"><div><h2>Reservas recentes</h2><p>Últimas solicitações recebidas pela biblioteca.</p></div><Link className="text-link" to="/admin/reservas">Gerenciar reservas <ArrowRight size={16} /></Link></header>
      {recent.length ? <DataTable columns={['Leitor', 'Título', 'Solicitação', 'Status']} label="Reservas recentes">{recent.map(item => <tr key={item.id}>
        <td>{data.users.find(user => user.id === item.userId)?.name}</td><td>{data.books.find(book => book.id === item.bookId)?.title}</td><td>{formatDate(item.requestedAt)}</td><td><StatusBadge status={item.status} /></td>
      </tr>)}</DataTable> : <EmptyState title="Sem reservas recentes" text="As solicitações do acervo aparecerão aqui." />}
    </section>
    <div className="admin-columns section">
      <section className="panel"><h2>Aguardando aprovação</h2>{pending.length ? <ul className="plain-list">{pending.slice(0, 5).map(item => <li key={item.id}><strong>{data.books.find(book => book.id === item.bookId)?.title}</strong><span>{data.users.find(user => user.id === item.userId)?.name}</span></li>)}</ul> : <p>Nenhuma solicitação aguardando análise.</p>}
        <Link className="text-link" to="/admin/reservas">Abrir fila <ArrowRight size={16} /></Link></section>
      <section className="panel"><h2>Devoluções nos próximos 7 dias</h2>{deadlines.length ? <ul className="plain-list">{deadlines.map(item => <li key={item.id}><strong>{data.books.find(book => book.id === item.bookId)?.title}</strong><span>{formatDate(item.dueAt)}</span></li>)}</ul> : <p>Nenhuma devolução prevista para este período.</p>}
        <Link className="text-link" to="/admin/reservas?aba=ativas">Ver empréstimos <ArrowRight size={16} /></Link></section>
    </div>
  </>;
}
