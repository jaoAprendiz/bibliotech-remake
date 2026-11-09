import { useState } from 'react';
import { ArrowRight, Bookmark, CalendarDays, Clock3, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCard } from '../../components/Books';
import { Button, PageHeader, SearchBar } from '../../components/ui';
import { useLibrary } from '../../contexts/LibraryContext';
import { categories, libraryInfo } from '../../data/library';
import { formatDate, isLoan } from '../../services/library';

export function StudentDashboard() {
  const { user, data } = useLibrary();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const mine = data.reservations.filter(item => item.userId === user?.id);
  const pending = mine.filter(item => item.status === 'PENDING').length;
  const loans = mine.filter(isLoan).sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));
  const next = loans[0];
  return <>
    <PageHeader title={`Olá, ${user?.name.split(' ')[0]}!`} description="Veja suas reservas e descubra o que ler a seguir." />
    {user?.status === 'BLOCKED' && <p role="status" className="error">Reservas bloqueadas. {user.reason}</p>}
    <section className="student-banner"><div><h2>O que você quer ler hoje?</h2><p>Procure um título, autor ou categoria no acervo.</p>
      <form onSubmit={event => { event.preventDefault(); navigate('/aluno/catalogo?' + new URLSearchParams(query.trim() ? { q: query.trim() } : {})); }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Ex.: Machado de Assis" /><Button type="submit"><Search size={17} />Buscar</Button>
      </form></div><img src="/library-art.svg" alt="" /></section>
    <div className="summary-strip">
      <Link to="/aluno/reservas"><Bookmark /><span><strong>{pending} {pending === 1 ? 'reserva pendente' : 'reservas pendentes'}</strong><small>{loans.length} {loans.length === 1 ? 'empréstimo ativo' : 'empréstimos ativos'}</small></span><ArrowRight size={17} /></Link>
      <Link to="/aluno/reservas?aba=ativas"><CalendarDays /><span><strong>{next?.status === 'OVERDUE' ? 'Devolução em atraso' : 'Próxima devolução'}</strong><small>{next ? formatDate(next.dueAt) + ' · ' + data.books.find(book => book.id === next.bookId)?.title : 'Sem devoluções previstas'}</small></span><ArrowRight size={17} /></Link>
      <Link to="/aluno/sobre"><Clock3 /><span><strong>Horários da biblioteca</strong><small>{libraryInfo.hours}</small></span><ArrowRight size={17} /></Link>
    </div>
    <section className="section"><header className="section-heading"><div><h2>Estante em destaque</h2><p>Uma seleção para descobrir no acervo.</p></div><Link className="text-link" to="/aluno/catalogo">Ver catálogo <ArrowRight size={17} /></Link></header>
      <div className="book-grid">{data.books.slice(0, 4).map(book => <BookCard key={book.id} book={book} base="/aluno/catalogo" />)}</div></section>
    <section className="section"><h2>Explore por categoria</h2><div className="chips">{categories.map(category => <Link key={category} to={'/aluno/catalogo?' + new URLSearchParams({ genero: category })}>{category}</Link>)}</div></section>
  </>;
}
