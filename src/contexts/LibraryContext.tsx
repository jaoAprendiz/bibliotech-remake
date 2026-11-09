import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Library, User } from '../types/library';
import { applyAction, type Action } from '../services/library';
import { libraryKey, readLibrary, saveLibrary, sessionKey } from '../services/storage';

interface LibraryContextValue {
  data: Library; user?: User; notice: string; notify: (message: string) => void;
  act: (action: Action) => void; signIn: (email: string, password: string) => User;
  signOut: () => void; register: (name: string, email: string, password: string) => User;
  resetPassword: (token: string, password: string) => void;
}
const LibraryContext = createContext<LibraryContextValue | null>(null);
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(readLibrary);
  const [id, setId] = useState(() => localStorage.getItem(sessionKey));
  const [notice, setNotice] = useState('');
  const notify = useCallback((message: string) => setNotice(message), []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    saveLibrary(readLibrary());
    function sync(event: StorageEvent) {
      if (event.key === libraryKey) setData(readLibrary());
      if (event.key === sessionKey) setId(event.newValue);
    }
    const timer = window.setInterval(() => setData(readLibrary()), 60_000);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('storage', sync); window.clearInterval(timer); };
  }, []);
  const persist = (next: Library) => { saveLibrary(next); setData(next); };
  const startSession = (user: User) => { localStorage.setItem(sessionKey, user.id); setId(user.id); return user; };
  const value: LibraryContextValue = {
    data, notice, notify, user: data.users.find(user => user.id === id && user.status !== 'INACTIVE'),
    act: action => persist(applyAction(readLibrary(), id ?? '', action)),
    signIn: (email, password) => {
      const current = readLibrary();
      const user = current.users.find(item => item.email === email.trim().toLowerCase() && item.password === password);
      if (!user) throw new Error('E-mail ou senha incorretos.');
      if (user.status === 'INACTIVE') throw new Error('Esta conta está desativada.');
      setData(current);
      return startSession(user);
    },
    signOut: () => { localStorage.removeItem(sessionKey); setId(null); },
    register: (name, email, password) => {
      const current = readLibrary();
      const normalized = email.trim().toLowerCase();
      if (current.users.some(item => item.email === normalized)) throw new Error('Este e-mail já está cadastrado.');
      const user: User = { id: crypto.randomUUID(), name: name.trim(), email: normalized, password,
        role: 'student', status: 'ACTIVE', createdAt: new Date().toISOString() };
      persist({ ...current, users: [...current.users, user] });
      return startSession(user);
    },
    resetPassword: (token, password) => {
      const key = 'bibliotech.recovery.' + token;
      const raw = sessionStorage.getItem(key);
      if (!raw) throw new Error('Link inválido ou já utilizado.');
      const { email, expires } = JSON.parse(raw) as { email: string; expires: number };
      if (expires < Date.now()) throw new Error('O link expirou. Solicite outro.');
      const current = readLibrary();
      const account = current.users.find(user => user.email === email && user.status !== 'INACTIVE');
      if (!account) throw new Error('Nenhuma conta demonstrativa ativa está vinculada a este link.');
      persist({ ...current, users: current.users.map(user => user.id === account.id ? { ...user, password } : user) });
      sessionStorage.removeItem(key);
    },
  };
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('LibraryProvider ausente.');
  return context;
}
