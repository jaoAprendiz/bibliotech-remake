import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, ChevronDown, House, Info, LayoutDashboard, LibraryBig, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { Brand } from '../components/Brand';
import { useLibrary } from '../contexts/LibraryContext';
import type { Role } from '../types/library';

export function PublicLayout() {
  const { user } = useLibrary();
  return <div className="public-shell">
    <a className="skip" href="#main">Ir para o conteúdo</a>
    <header className="public-header"><div className="public-width"><Brand /><nav aria-label="Navegação pública">
      <NavLink to="/catalogo">Catálogo</NavLink><Link className="button" to={user ? (user.role === 'admin' ? '/admin' : '/aluno') : '/login'}>{user ? 'Minha área' : 'Entrar'}</Link>
    </nav></div></header>
    <main id="main" tabIndex={-1}><Outlet /></main>
    <footer className="public-footer"><div className="public-width"><Brand /><span>Biblioteca escolar · ETEC Raposo Tavares</span></div></footer>
  </div>;
}

const studentLinks = [['', 'Início', House], ['/catalogo', 'Catálogo', BookOpen], ['/reservas', 'Minhas reservas', CalendarDays], ['/sobre', 'Sobre a biblioteca', Info]] as const;
const adminLinks = [['', 'Dashboard', LayoutDashboard], ['/acervo', 'Acervo', LibraryBig], ['/reservas', 'Reservas', CalendarDays], ['/usuarios', 'Usuários', Users]] as const;

export function AppShell({ role }: { role: Role }) {
  const { user, signOut } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuPath, setMenuPath] = useState('');
  const open = menuPath === location.pathname;
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeMenu = () => { setMenuPath(''); requestAnimationFrame(() => menuButton.current?.focus()); };
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const desktop = window.matchMedia('(min-width: 801px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuPath(''); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [open]);
  const base = role === 'admin' ? '/admin' : '/aluno';
  const links = role === 'admin' ? adminLinks : studentLinks;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/aluno'} replace />;
  const current = [...links].reverse().find(([path]) => path && location.pathname.startsWith(base + path))?.[1]
    ?? (location.pathname.endsWith('/configuracoes') ? 'Configurações' : links[0][1]);
  return <div className="app-shell" onKeyDown={event => { if (open && event.key === 'Escape') closeMenu(); }}>
    <a className="skip" href="#main">Ir para o conteúdo</a>
    <aside className={'sidebar' + (open ? ' open' : '')} id="sidebar">
      <div className="sidebar-brand"><Brand to={base} /><button ref={closeButton} className="icon-button mobile-only" aria-label="Fechar menu" onClick={closeMenu}><X size={22} /></button></div>
      <nav aria-label="Menu principal">
        <p className="nav-label">{role === 'admin' ? 'GESTÃO DA BIBLIOTECA' : 'MINHA BIBLIOTECA'}</p>
        {links.map(([path, title, Icon]) => <NavLink key={title} end={!path} to={base + path} onClick={() => setMenuPath('')}><Icon size={19} />{title}</NavLink>)}
        <p className="nav-label secondary-nav">PREFERÊNCIAS</p>
        <NavLink to={base + '/configuracoes'} onClick={() => setMenuPath('')}><Settings size={19} />Configurações</NavLink>
      </nav>
      <div className="account">
        <details><summary><span className="initials">{user.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</span><span><strong>{user.name}</strong><small>{role === 'admin' ? 'Administração' : 'Área do leitor'}</small></span><ChevronDown size={16} /></summary>
          <Link to={base + '/configuracoes'} onClick={() => setMenuPath('')}>Minha conta</Link><Link to="/">Página pública</Link></details>
        <button onClick={() => { signOut(); navigate('/login', { replace: true }); }}><LogOut size={18} />Encerrar sessão</button>
      </div>
    </aside>
    {open && <button className="menu-backdrop" aria-label="Fechar navegação" tabIndex={-1} onClick={closeMenu} />}
    <div className="app-body" inert={open}><header className="app-header">
      <button ref={menuButton} className="icon-button mobile-only" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded={open} onClick={() => setMenuPath(open ? '' : location.pathname)}><Menu size={23} /></button>
      <span><span className="breadcrumb-root">Biblioteca / </span>{current}</span><span className="school">ETEC Raposo Tavares</span>
    </header><main id="main" className="app-content" tabIndex={-1}><Outlet /></main></div>
  </div>;
}
