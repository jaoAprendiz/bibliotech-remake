import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, DataTable, Dialog, EmptyState, ErrorText, Field, PageHeader, SearchBar, StatusBadge, errorMessage } from '../../components/ui';
import { useLibrary } from '../../contexts/LibraryContext';
import { activeCount, formatDate } from '../../services/library';
import type { User, UserStatus } from '../../types/library';
import { normalize } from '../student/Catalog';

const verbs = { ACTIVE: 'Desbloquear', BLOCKED: 'Bloquear', INACTIVE: 'Desativar' };
function UserDetails({ id, close }: { id: string; close: () => void }) {
  const { data, act, notify } = useLibrary();
  const user = data.users.find(item => item.id === id);
  const [intent, setIntent] = useState<UserStatus>();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  if (!user) return null;
  return <Dialog drawer title={user.name} onClose={close}>
    <dl className="facts"><div><dt>E-mail</dt><dd>{user.email}</dd></div><div><dt>Perfil</dt><dd>{user.role === 'admin' ? 'Administrador' : 'Leitor'}</dd></div>
      <div><dt>Cadastro</dt><dd>{formatDate(user.createdAt)}</dd></div><div><dt>Empréstimos ativos</dt><dd>{activeCount(data, user.id)}</dd></div>
      <div><dt>Situação</dt><dd><StatusBadge status={user.status} /></dd></div>{user.reason && <div><dt>Motivo</dt><dd>{user.reason}</dd></div>}</dl>
    {intent ? <form onSubmit={event => {
      event.preventDefault(); setError('');
      try { act({ type: 'user', id, status: intent, reason: reason.trim() || undefined }); notify('Situação da conta atualizada.'); setIntent(undefined); }
      catch (cause) { setError(errorMessage(cause)); }
    }}>
      <h3>{verbs[intent]} conta?</h3>
      <p>{intent === 'ACTIVE' ? 'A conta voltará a poder solicitar reservas.' : intent === 'BLOCKED' ? 'A conta poderá consultar o acervo, mas ficará impedida de solicitar reservas.' : 'O acesso será encerrado e o histórico será preservado.'}</p>
      {intent !== 'ACTIVE' && <Field label="Motivo (opcional)"><input value={reason} onChange={event => setReason(event.target.value)} /></Field>}
      <ErrorText message={error} /><div className="actions end"><Button className="secondary" onClick={() => setIntent(undefined)}>Voltar</Button><Button type="submit">{verbs[intent]} conta</Button></div>
    </form> : user.role === 'student' && user.status !== 'INACTIVE' && <div className="actions">
      {(user.status === 'BLOCKED' ? ['ACTIVE', 'INACTIVE'] as const : ['BLOCKED', 'INACTIVE'] as const).map(status =>
        <Button key={status} className="secondary" onClick={() => { setReason(''); setError(''); setIntent(status); }}>{verbs[status]}</Button>)}
    </div>}
    <h3 className="section">Histórico e solicitações</h3>
    {data.reservations.some(item => item.userId === id) ? <ul className="plain-list">
      {data.reservations.filter(item => item.userId === id).map(item => <li key={item.id}><span>{data.books.find(book => book.id === item.bookId)?.title}<small>{formatDate(item.requestedAt)}</small></span><StatusBadge status={item.status} /></li>)}
    </ul> : <p>Esta conta ainda não tem reservas.</p>}
  </Dialog>;
}
export function Users() {
  const { data } = useLibrary();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<User>();
  const status = params.get('status') ?? '';
  const users = data.users.filter(user => normalize(user.name + ' ' + user.email).includes(normalize(query)) && (!status || user.status === status));
  return <>
    <PageHeader title="Usuários" description="Consulte leitores e gerencie o acesso à biblioteca." />
    <div className="filter-bar"><SearchBar value={query} onChange={setQuery} placeholder="Buscar por nome ou e-mail" />
      <Field label="Status"><select value={status} onChange={event => setParams(event.target.value ? { status: event.target.value } : {}, { replace: true })}>
        <option value="">Todos os status</option><option value="ACTIVE">Ativo</option><option value="BLOCKED">Bloqueado</option><option value="INACTIVE">Desativado</option>
      </select></Field>
    </div>
    <p className="result-line" role="status">{users.length} {users.length === 1 ? 'usuário' : 'usuários'}</p>
    {users.length ? <DataTable label="Usuários" columns={['Nome', 'E-mail', 'Status', 'Empréstimos ativos', 'Cadastro', 'Ações']}>
      {users.map(user => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.role === 'admin' ? 'Administrador' : 'Leitor'}</small></td><td>{user.email}</td>
        <td><StatusBadge status={user.status} />{user.reason && <small>{user.reason}</small>}</td><td>{activeCount(data, user.id)}</td><td>{formatDate(user.createdAt)}</td>
        <td><Button className="secondary" aria-label={'Detalhes de ' + user.name} onClick={() => setSelected(user)}>Detalhes</Button></td></tr>)}
    </DataTable> : <EmptyState title="Nenhum usuário encontrado" text="Revise o termo de busca ou o filtro de status." />}
    {selected && <UserDetails id={selected.id} close={() => setSelected(undefined)} />}
  </>;
}
