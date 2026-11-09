import { useState } from 'react';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book } from '../types/library';
import { useLibrary } from '../contexts/LibraryContext';
import { availableCopies } from '../services/library';
import { StatusBadge } from './ui';

export function BookCover({ book }: { book: Book }) {
  const [failedCover, setFailedCover] = useState('');
  return book.cover && book.cover !== failedCover ? <img src={book.cover} alt={`Capa de ${book.title}`} loading="lazy" onError={() => setFailedCover(book.cover)} />
    : <span className="cover-fallback"><BookOpen size={29} /><span>{book.title}</span></span>;
}
export function BookCard({ book, base }: { book: Book; base: string }) {
  const { data } = useLibrary();
  const count = availableCopies(data, book.id).length;
  return <article className="book-card">
    <Link className="cover-stage" tabIndex={-1} aria-hidden="true" to={base + '/' + book.id}><BookCover book={book} /></Link>
    <div className="book-info"><span className="category">{book.category}</span>
      <h3><Link to={base + '/' + book.id}>{book.title}<ArrowUpRight size={16} aria-hidden="true" /></Link></h3>
      <p>{book.author}</p><StatusBadge status={count ? 'AVAILABLE' : 'UNAVAILABLE'} />
    </div>
  </article>;
}
