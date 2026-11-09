import { lazy } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { AppShell, PublicLayout } from '../layouts/Layouts';
import { Home, About } from '../pages/public/Home';
import { Auth } from '../pages/public/Auth';
import { Catalog, BookDetails } from '../pages/student/Catalog';
import { StudentDashboard } from '../pages/student/Dashboard';
import { Reservations } from '../pages/Reservations';
import { Settings } from '../pages/Settings';

const AdminDashboard = lazy(() => import('../pages/admin/Dashboard').then(module => ({ default: module.AdminDashboard })));
const Collection = lazy(() => import('../pages/admin/Collection').then(module => ({ default: module.Collection })));
const Users = lazy(() => import('../pages/admin/Users').then(module => ({ default: module.Users })));

export function Router() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<Home />} />
      <Route path="login" element={<Auth key="login" mode="login" />} />
      <Route path="cadastro" element={<Auth key="register" mode="register" />} />
      <Route path="recuperar-senha" element={<Auth key="recover" mode="recover" />} />
      <Route path="redefinir-senha" element={<Auth key="reset" mode="reset" />} />
      <Route path="catalogo" element={<Catalog publicView />} />
      <Route path="catalogo/:id" element={<BookDetails publicView />} />
      <Route path="*" element={<div className="public-width public-content"><h1>Página não encontrada</h1><p>O endereço pode ter mudado.</p><Link className="button" to="/">Voltar ao início</Link></div>} />
    </Route>
    <Route path="aluno" element={<AppShell role="student" />}>
      <Route index element={<StudentDashboard />} />
      <Route path="catalogo" element={<Catalog />} />
      <Route path="catalogo/:id" element={<BookDetails />} />
      <Route path="reservas" element={<Reservations />} />
      <Route path="sobre" element={<About />} />
      <Route path="configuracoes" element={<Settings />} />
    </Route>
    <Route path="admin" element={<AppShell role="admin" />}>
      <Route index element={<AdminDashboard />} />
      <Route path="acervo" element={<Collection />} />
      <Route path="reservas" element={<Reservations admin />} />
      <Route path="usuarios" element={<Users />} />
      <Route path="configuracoes" element={<Settings />} />
    </Route>
  </Routes>;
}
