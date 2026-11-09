import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, ConfirmDialog, DataTable, Dialog, EmptyState, ErrorText, Field, PageHeader, StatusBadge, Tabs, errorMessage } from '../components/ui';
import { useLibrary } from '../contexts/LibraryContext';
import { availableCopies, formatDate, isLoan } from '../services/library';
import type { Reservation } from '../types/library';

const tabs = [{ value: 'pendentes', label: 'Pendentes' }, { value: 'ativas', label: 'Ativas' }, { value: 'historico', label: 'Histórico' }] as const;
const empty = {
  pendentes: ['Nenhuma solicitação pendente', 'As novas solicitações aparecem aqui até serem analisadas.'],
  ativas: ['Nenhum empréstimo ativo', 'Os livros emprestados e seus prazos aparecem aqui.'],
  historico: ['Histórico vazio', 'Devoluções e cancelamentos ficam registrados aqui.'],
};

function Approve({ reservation, close }: { reservation: Reservation; close: () => void }) {
  const { data, act, notify } = useLibrary();
  const copies = availableCopies(data, reservation.bookId);
  const [copyId, setCopyId] = useState(copies[0]?.id ?? '');
  const [error, setError] = useState('');
  return <Dialog title="Aprovar empréstimo" onClose={close}>
    <p>Selecione o exemplar entregue. A aprovação registra a retirada e define a devolução em 14 dias.</p>
    <form onSubmit={event => {
      event.preventDefault();
      try { act({ type: 'approve', id: reservation.id, copyId }); notify('Empréstimo aprovado.'); close(); }
      catch (cause) { setError(errorMessage(cause)); }
    }}><Field label="Exemplar"><select value={copyId} onChange={event => setCopyId(event.target.value)}>
      {!copies.length && <option value="">Nenhum exemplar disponível</option>}
      {copies.map(copy => <option key={copy.id} value={copy.id}>{copy.accession} · {copy.condition}</option>)}</select></Field>
      <ErrorText message={error} /><div className="actions end"><Button className="secondary" onClick={close}>Voltar</Button><Button type="submit" disabled={!copies.some(copy => copy.id === copyId)}>Aprovar</Button></div>
    </form>
  </Dialog>;
}
export function Reservations({ admin = false }: { admin?: boolean }) {
  const { data, user, act, notify } = useLibrary();
  const [params, setParams] = useSearchParams();
  const tab = tabs.find(item => item.value === params.get('aba'))?.value ?? 'pendentes';
  const [selected, setSelected] = useState<{ reservation: Reservation; action: 'approve' | 'return' | 'cancel' }>();
  const close = () => setSelected(undefined);
  const list = data.reservations.filter(item => (admin || item.userId === user?.id) &&
    (tab === 'pendentes' ? item.status === 'PENDING' : tab === 'ativas' ? isLoan(item) : ['RETURNED', 'CANCELLED'].includes(item.status)))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  return <>
    <PageHeader title={admin ? 'Reservas' : 'Minhas reservas'} description={admin ? 'Gerencie solicitações, empréstimos e devoluções do acervo.' : 'Acompanhe suas solicitações, prazos e devoluções.'} />
    {!admin && user?.status === 'BLOCKED' && <p className="error" role="status">Reservas bloqueadas. {user.reason}</p>}
    <Tabs items={[...tabs]} value={tab} onChange={value => setParams({ aba: value })} />
    {list.length ? <DataTable label="Reservas" columns={[
      ...(admin ? ['Leitor'] : []), 'Livro', 'Tombo', 'Solicitada em', ...(tab === 'ativas' ? ['Retirada'] : []), 'Devolução prevista', ...(tab === 'historico' ? ['Encerrada em'] : []), 'Status', 'Ações',
    ]}>{list.map(reservation => {
      const book = data.books.find(item => item.id === reservation.bookId);
      return <tr key={reservation.id}>
        {admin && <td>{data.users.find(item => item.id === reservation.userId)?.name}</td>}
        <td>{admin ? <strong>{book?.title}</strong> : <Link className="text-link" to={'/aluno/catalogo/' + reservation.bookId}>{book?.title}</Link>}</td>
        <td>{data.copies.find(copy => copy.id === reservation.copyId)?.accession ?? '—'}</td>
        <td>{formatDate(reservation.requestedAt)}</td>{tab === 'ativas' && <td>{formatDate(reservation.pickedUpAt)}</td>}
        <td className={reservation.status === 'OVERDUE' ? 'late' : ''}>{formatDate(reservation.dueAt)}</td>
        {tab === 'historico' && <td>{formatDate(reservation.closedAt)}</td>}
        <td><StatusBadge status={reservation.status} /></td>
        <td><div className="actions compact">
          {admin && tab === 'pendentes' && <Button onClick={() => setSelected({ reservation, action: 'approve' })}>Aprovar</Button>}
          {tab === 'pendentes' && <Button className="secondary" onClick={() => setSelected({ reservation, action: 'cancel' })}>Cancelar</Button>}
          {admin && tab === 'ativas' && <Button className="secondary" onClick={() => setSelected({ reservation, action: 'return' })}>Registrar devolução</Button>}
          {(tab === 'historico' || (!admin && tab === 'ativas')) && '—'}
        </div></td>
      </tr>;
    })}</DataTable> : <EmptyState title={empty[tab][0]} text={empty[tab][1]} />}
    {selected?.action === 'approve' && <Approve reservation={selected.reservation} close={close} />}
    {selected && selected.action !== 'approve' && <ConfirmDialog onClose={close}
      title={selected.action === 'return' ? 'Registrar devolução' : 'Cancelar reserva'}
      text={selected.action === 'return' ? 'O exemplar voltará a ficar disponível e a reserva será movida para o histórico.' : 'A solicitação será encerrada e continuará visível no histórico.'}
      onConfirm={() => { act({ type: selected.action === 'return' ? 'return' : 'cancel', id: selected.reservation.id }); notify(selected.action === 'return' ? 'Devolução registrada.' : 'Reserva cancelada.'); }} />}
  </>;
}
