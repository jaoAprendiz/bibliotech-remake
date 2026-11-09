import { Link } from 'react-router-dom';

export function Brand({ to = '/' }: { to?: string }) {
  return <Link className="brand" to={to} aria-label="Bibliotech, início">
    <svg width="41" height="42" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="9" y="4" width="26" height="21" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15 11 4 4-4 4m8 0h5M22 38c-6-4-12-5-19-4V23c7-1 13 1 19 6 4-6 8-9 13-10v5l6-1v11c-7-1-13 0-19 4Zm0-9v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span><strong>Bibliotech</strong><small>MODERNIZANDO A LITERATURA</small></span>
  </Link>;
}
