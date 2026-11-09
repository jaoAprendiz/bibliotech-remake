import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Search, X } from 'lucide-react';
import { useLibrary } from '../contexts/LibraryContext';

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={'button ' + className} {...props} />;
}
export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}
export function SearchBar({ value, onChange, placeholder = 'Buscar…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search"><Search size={18} /><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>;
}
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{error && <small role="alert">{error}</small>}</label>;
}
export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty"><BookOpen size={28} /><h3>{title}</h3><p>{text}</p></div>;
}
const labels: Record<string, string> = {
  PENDING: 'Pendente', APPROVED: 'Empréstimo ativo', OVERDUE: 'Em atraso', RETURNED: 'Devolvida', CANCELLED: 'Cancelada',
  ACTIVE: 'Ativo', BLOCKED: 'Bloqueado', INACTIVE: 'Desativado', AVAILABLE: 'Disponível', ON_LOAN: 'Emprestado',
  MAINTENANCE: 'Em manutenção', UNAVAILABLE: 'Indisponível',
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={'badge ' + status.toLowerCase()}><span aria-hidden="true" />{labels[status] ?? status}</span>;
}
export function Tabs<T extends string>({ items, value, onChange }: { items: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <div className="tabs" role="group" aria-label="Filtrar por situação">{items.map(item =>
    <button key={item.value} type="button" aria-pressed={item.value === value} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}
export function Dialog({ title, children, onClose, drawer = false }: { title: string; children: ReactNode; onClose: () => void; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={drawer ? 'drawer' : ''} aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="dialog-head"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={21} /></button></header>{children}
  </dialog>;
}
export function ConfirmDialog({ title, text, onClose, onConfirm }: { title: string; text: string; onClose: () => void; onConfirm: () => void }) {
  const [error, setError] = useState('');
  return <Dialog title={title} onClose={onClose}><p>{text}</p><ErrorText message={error} />
    <div className="actions end"><Button className="secondary" onClick={onClose}>Voltar</Button>
      <Button onClick={() => { try { onConfirm(); onClose(); } catch (cause) { setError(errorMessage(cause)); } }}>Confirmar</Button></div>
  </Dialog>;
}
export const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : 'Não foi possível concluir. Tente novamente.';
export function ErrorText({ message }: { message: string }) {
  return message ? <p role="alert" className="error">{message}</p> : null;
}
export function DataTable({ columns, children, label }: { columns: string[]; children: ReactNode; label: string }) {
  return <div className="table-scroll" tabIndex={0} role="region" aria-label={label}><table aria-label={label}><thead><tr>
    {columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  return <nav className="pagination" aria-label="Paginação"><span>Página {page} de {total}</span>
    <Button className="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior"><ArrowLeft size={16} /></Button>
    <Button className="secondary" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label="Próxima página"><ArrowRight size={16} /></Button>
  </nav>;
}
export function Toast() {
  const { notice } = useLibrary();
  return <div className="toast-region" role="status">{notice && <div className="toast"><CheckCircle2 size={19} />{notice}</div>}</div>;
}
export function Skeleton() {
  return <div className="skeleton-wrap" role="status"><span>Carregando página…</span><div /><div /><div /></div>;
}
