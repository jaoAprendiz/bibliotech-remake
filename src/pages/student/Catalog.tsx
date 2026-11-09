import { useState } from 'react';
import { ArrowLeft, BookmarkPlus, SlidersHorizontal } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BookCard, BookCover } from '../../components/Books';
import { Button, ConfirmDialog, EmptyState, Field, PageHeader, SearchBar, StatusBadge } from '../../components/ui';
import { useLibrary } from '../../contexts/LibraryContext';
import { categories } from '../../data/library';
import { availableCopies, isOpen } from '../../services/library';

export const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function Catalog({ publicView = false }: { publicView?: boolean }) {
  const { data } = useLibrary();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const genre = params.get('genero') ?? '';
  const availability = params.get('disponibilidade') ?? '';
  const order = params.get('ordem') ?? 'title';
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const books = data.books.filter(book => {
    const count = availableCopies(data, book.id).length;
    return normalize([book.title, book.author, book.category].join(' ')).includes(normalize(query)) &&
      (!genre || genre === book.category) && (!availability || (availability === 'yes' ? count > 0 : count === 0));
  }).sort((a, b) => order === 'year' ? b.year - a.year : (order === 'author' ? a.author.localeCompare(b.author, 'pt-BR') : a.title.localeCompare(b.title, 'pt-BR')));
  const base = publicView ? '/catalogo' : '/aluno/catalogo';
  return <div className={publicView ? 'public-width public-content' : ''}>
    <PageHeader title="Catálogo" description="Encontre livros para estudar, descobrir e levar para casa." />
    <div className="filter-bar">
      <SearchBar value={query} onChange={value => setFilter('q', value)} placeholder="Buscar por título, autor ou categoria" />
      <Field label="Gênero"><select value={genre} onChange={event => setFilter('genero', event.target.value)}><option value="">Todos os gêneros</option>{categories.map(category => <option key={category}>{category}</option>)}</select></Field>
      <Field label="Disponibilidade"><select value={availability} onChange={event => setFilter('disponibilidade', event.target.value)}><option value="">Qualquer situação</option><option value="yes">Disponível</option><option value="no">Indisponível</option></select></Field>
      <Field label="Ordenar por"><select value={order} onChange={event => setFilter('ordem', event.target.value)}><option value="title">Título (A–Z)</option><option value="author">Autor (A–Z)</option><option value="year">Ano mais recente</option></select></Field>
    </div>
    <div className="result-line"><span role="status">{books.length} {books.length === 1 ? 'título encontrado' : 'títulos encontrados'}</span>
      {!!params.size && <button className="text-link" onClick={() => setParams({}, { replace: true })}><SlidersHorizontal size={16} />Limpar filtros</button>}</div>
    {books.length ? <div className="book-grid">{books.map(book => <BookCard key={book.id} book={book} base={base} />)}</div>
      : <EmptyState title="Nenhum livro encontrado" text="Experimente outro termo de busca ou limpe os filtros." />}
  </div>;
}

export function BookDetails({ publicView = false }: { publicView?: boolean }) {
  const { id } = useParams();
  const { data, user, act, notify } = useLibrary();
  const [confirm, setConfirm] = useState(false);
  const book = data.books.find(item => item.id === id);
  const base = publicView ? '/catalogo' : '/aluno/catalogo';
  if (!book) return <div className="public-width public-content"><EmptyState title="Título não encontrado" text="Volte ao catálogo para consultar outros livros." /><Link className="text-link" to={base}>Voltar ao catálogo</Link></div>;
  const count = availableCopies(data, book.id).length;
  const open = data.reservations.filter(item => item.userId === user?.id && isOpen(item));
  const unavailable = !count ? 'Todos os exemplares estão indisponíveis.' : user?.status === 'BLOCKED' ? user.reason || 'Conta bloqueada.'
    : open.some(item => item.bookId === book.id) ? 'Você já tem uma reserva para este título.' : open.length >= 3 ? 'Você atingiu o limite de três reservas em andamento.' : '';
  return <div className={publicView ? 'public-width public-content' : ''}>
    <Link className="text-link back" to={base}><ArrowLeft size={17} />Voltar ao catálogo</Link>
    <article className="detail panel"><div className="cover-stage"><BookCover book={book} /></div><div>
      <span className="category">{book.category}</span><h1>{book.title}</h1><p className="author">{book.author}</p>
      {book.synopsis && <p>{book.synopsis}</p>}
      <dl className="facts">{[['Editora', book.publisher], ['ISBN', book.isbn], ['Ano de publicação', book.year], ['Edição', book.edition]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="availability"><StatusBadge status={count ? 'AVAILABLE' : 'UNAVAILABLE'} /><span>{count} {count === 1 ? 'exemplar disponível' : 'exemplares disponíveis'}</span></div>
      {user?.role === 'student' ? <><Button disabled={!!unavailable} onClick={() => setConfirm(true)}><BookmarkPlus size={18} />Solicitar reserva</Button>{unavailable && <p className="hint">{unavailable}</p>}</>
        : !user && count > 0 && <Link className="button" to="/login" state={{ from: '/aluno/catalogo/' + book.id }}>Entrar para reservar</Link>}
    </div></article>
    {confirm && <ConfirmDialog title="Solicitar reserva" text={`Sua solicitação para “${book.title}” ficará pendente até a aprovação da biblioteca.`} onClose={() => setConfirm(false)} onConfirm={() => {
      act({ type: 'request', bookId: book.id }); notify('Reserva solicitada. Acompanhe em Minhas reservas.');
    }} />}
  </div>;
}
