import { Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LibraryProvider } from '../contexts/LibraryContext';
import { Skeleton, Toast } from '../components/ui';
import { Router } from './router';

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.getElementById('main');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
export function App() {
  return <LibraryProvider><Suspense fallback={<Skeleton />}><Router /><RouteFocus /></Suspense><Toast /></LibraryProvider>;
}
