import { useState } from 'react';
import { Edit3, Layers3, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookCover } from '../../components/Books';
import { Button, DataTable, Dialog, EmptyState, ErrorText, Field, PageHeader, Pagination, SearchBar, StatusBadge, errorMessage } from '../../components/ui';
import { useLibrary } from '../../contexts/LibraryContext';
import { categories } from '../../data/library';
import { availableCopies } from '../../services/library';
import type { Book, BookCopy } from '../../types/library';
import { normalize } from '../student/Catalog';

const required = z.string().trim().min(1, 'Preencha este campo.');
const bookSchema = z.object({
  title: required, author: required, publisher: required, isbn: z.string().trim().regex(/^(\d{9}[\dXx]|\d{13})$/, 'Informe o ISBN-10 ou ISBN-13 sem hífens.'),
  year: z.number().int().min(1, 'Informe um ano válido.').max(new Date().getFullYear() + 1, 'Informe um ano válido.'),
  edition: required, category: z.enum(categories), cover: z.string().trim().refine(value => !value || /^https:\/\/[^\s]+$|^\/covers\/\d+\.svg$/.test(value), 'Informe uma URL HTTPS válida.'),
});
const bookFields = [
  ['title', 'Título', 'text'], ['author', 'Autor(es)', 'text'], ['publisher', 'Editora', 'text'], ['isbn', 'ISBN', 'text'],
  ['year', 'Ano de publicação', 'number'], ['edition', 'Edição', 'text'], ['cover', 'URL da capa (opcional)', 'text'],
] as const;

function EditBook({ book, close }: { book?: Book; close: () => void }) {
  const { act, notify } = useLibrary();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: book ?? { title: '', author: '', publisher: '', isbn: '', year: new Date().getFullYear(), edition: '', category: categories[0], cover: '' },
  });
  return <Dialog drawer title={book ? 'Editar título' : 'Cadastrar título'} onClose={close}>
    <p>Preencha os dados bibliográficos. Os exemplares são gerenciados separadamente.</p>
    <form noValidate onSubmit={handleSubmit(values => {
      try { act({ type: 'book', book: { ...book, ...values, id: book?.id ?? crypto.randomUUID() } }); notify('Título salvo.'); close(); }
      catch (cause) { setError(errorMessage(cause)); }
    })}>
      {bookFields.map(([name, label, type]) => <Field key={name} label={label} error={errors[name]?.message}><input type={type} aria-invalid={!!errors[name]} {...register(name, { valueAsNumber: type === 'number' })} /></Field>)}
      <Field label="Categoria" error={errors.category?.message}><select {...register('category')}>{categories.map(category => <option key={category}>{category}</option>)}</select></Field>
      <ErrorText message={error} /><div className="actions end"><Button className="secondary" onClick={close}>Cancelar</Button><Button type="submit">Salvar título</Button></div>
    </form>
  </Dialog>;
}
const copySchema = z.object({ accession: required, condition: required, status: z.enum(['AVAILABLE', 'MAINTENANCE', 'ON_LOAN']) });
function EditCopy({ bookId, copy, close }: { bookId: string; copy?: BookCopy; close: () => void }) {
  const { act, notify } = useLibrary();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(copySchema), defaultValues: copy ?? { accession: '', condition: 'Bom', status: 'AVAILABLE' as const },
  });
  return <><h3>{copy ? 'Editar exemplar' : 'Novo exemplar'}</h3><form onSubmit={handleSubmit(values => {
    try { act({ type: 'copy', copy: { ...values, id: copy?.id ?? crypto.randomUUID(), bookId } }); notify('Exemplar salvo.'); close(); }
    catch (cause) { setError(errorMessage(cause)); }
  })}><Field label="Número de tombo" error={errors.accession?.message}><input {...register('accession')} /></Field>
    <Field label="Estado físico" error={errors.condition?.message}><input {...register('condition')} /></Field>
    {copy?.status === 'ON_LOAN' ? <p className="hint">Exemplar emprestado. A disponibilidade muda com a devolução.</p> :
      <Field label="Disponibilidade"><select {...register('status')}><option value="AVAILABLE">Disponível</option><option value="MAINTENANCE">Em manutenção</option></select></Field>}
    <ErrorText message={error} /><div className="actions end"><Button className="secondary" onClick={close}>Voltar</Button><Button type="submit">Salvar exemplar</Button></div>
  </form></>;
}
function Copies({ book, close }: { book: Book; close: () => void }) {
  const { data } = useLibrary();
  const copies = data.copies.filter(copy => copy.bookId === book.id);
  const [edit, setEdit] = useState<BookCopy | 'new'>();
  return <Dialog drawer title={'Exemplares · ' + book.title} onClose={close}>
    {edit ? <EditCopy key={edit === 'new' ? 'new' : edit.id} bookId={book.id} copy={edit === 'new' ? undefined : edit} close={() => setEdit(undefined)} /> : <>
      <p>Controle os itens físicos vinculados a este título.</p>
      <Button onClick={() => setEdit('new')}><Plus size={17} />Adicionar exemplar</Button>
      {copies.length ? <ul className="copy-list">{copies.map(copy => <li key={copy.id}><div><strong>{copy.accession}</strong><small>{copy.condition}</small></div><StatusBadge status={copy.status} />
        <button className="icon-button" aria-label={'Editar exemplar ' + copy.accession} onClick={() => setEdit(copy)}><Edit3 size={17} /></button></li>)}</ul>
        : <EmptyState title="Sem exemplares" text="Adicione o primeiro item físico deste título." />}
    </>}
  </Dialog>;
}
export function Collection() {
  const { data } = useLibrary();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<Book>();
  const [copies, setCopies] = useState<Book>();
  const status = params.get('status') ?? '';
  const rows = data.books.filter(book => normalize([book.title, book.author, book.isbn].join(' ')).includes(normalize(query)) &&
    (!category || book.category === category) && (!status || (availableCopies(data, book.id).length > 0) === (status === 'available')))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  const size = 6;
  const total = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, total);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  return <>
    <PageHeader title="Acervo" description="Gerencie títulos e acompanhe a disponibilidade dos exemplares." action={<Button onClick={() => update('novo', '1')}><Plus size={18} />Cadastrar título</Button>} />
    <div className="filter-bar">
      <SearchBar value={query} onChange={value => { setQuery(value); setPage(1); }} placeholder="Buscar título, autor ou ISBN" />
      <Field label="Categoria"><select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">Todas as categorias</option>{categories.map(item => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Disponibilidade"><select value={status} onChange={event => { update('status', event.target.value); setPage(1); }}><option value="">Qualquer situação</option><option value="available">Disponível</option><option value="unavailable">Indisponível</option></select></Field>
    </div>
    <p className="result-line" role="status">{rows.length} {rows.length === 1 ? 'título' : 'títulos'}</p>
    {rows.length ? <>
      <DataTable label="Títulos do acervo" columns={['Título', 'ISBN', 'Categoria', 'Disponíveis / total', 'Ações']}>
        {rows.slice((current - 1) * size, current * size).map(book => <tr key={book.id}>
          <td><div className="table-book"><div><BookCover book={book} /></div><span><strong>{book.title}</strong><small>{book.author}</small></span></div></td>
          <td>{book.isbn}</td><td>{book.category}</td><td>{availableCopies(data, book.id).length} / {data.copies.filter(copy => copy.bookId === book.id).length}</td>
          <td><div className="actions compact"><Button className="secondary" onClick={() => setCopies(book)}><Layers3 size={15} />Exemplares</Button>
            <button className="icon-button" aria-label={'Editar ' + book.title} onClick={() => setEdit(book)}><Edit3 size={17} /></button></div></td>
        </tr>)}
      </DataTable><Pagination page={current} total={total} onChange={setPage} />
    </> : <EmptyState title="Nenhum título encontrado" text="Revise os filtros ou cadastre um título no acervo." />}
    {(edit || params.get('novo') === '1') && <EditBook key={edit?.id ?? 'new'} book={edit} close={() => { setEdit(undefined); if (params.has('novo')) update('novo', ''); }} />}
    {copies && <Copies book={copies} close={() => setCopies(undefined)} />}
  </>;
}
