import { ArrowRight, BookOpen, Clock3, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../contexts/LibraryContext';
import { BookCard } from '../../components/Books';
import { PageHeader } from '../../components/ui';
import { libraryInfo } from '../../data/library';

export function LibraryInfo() {
  return <div className="library-info">
    <div><Clock3 /><section><h3>Funcionamento</h3><p>{libraryInfo.hours}</p></section></div>
    <div><MapPin /><section><h3>Localização</h3><p>{libraryInfo.location}</p></section></div>
    <div><MessageCircle /><section><h3>Atendimento</h3><p>{libraryInfo.contact}</p></section></div>
  </div>;
}
export function About() {
  return <><PageHeader title="Sobre a biblioteca" description="Conheça a biblioteca escolar da ETEC Raposo Tavares." />
    <div className="panel about"><BookOpen size={28} /><h2>Um espaço para ler e aprender</h2><p>Explore o acervo da escola, solicite reservas e acompanhe seus empréstimos pelo Bibliotech.</p></div>
    <LibraryInfo /></>;
}
export function Home() {
  const { data } = useLibrary();
  return <div className="public-width home">
    <section className="hero"><div className="hero-copy"><h1>Encontre sua<br />próxima <em>leitura.</em></h1>
      <p>Explore o acervo da ETEC Raposo Tavares, reserve livros e acompanhe seus empréstimos em um só lugar.</p>
      <div className="actions"><Link className="button" to="/catalogo">Explorar catálogo <ArrowRight size={18} /></Link><Link className="button hero-secondary" to="/login">Acessar minha conta</Link></div>
    </div><div className="hero-art" aria-hidden="true"><img src="/library-art.svg" alt="" /></div></section>
    <section className="section"><header className="section-heading"><div><h2>Para começar a leitura</h2><p>Uma seleção de títulos do acervo escolar.</p></div><Link className="text-link" to="/catalogo">Ver catálogo <ArrowRight size={17} /></Link></header>
      <div className="book-grid">{data.books.slice(0, 4).map(book => <BookCard key={book.id} book={book} base="/catalogo" />)}</div></section>
    <section className="section"><h2>Visite a biblioteca</h2><LibraryInfo /></section>
  </div>;
}
