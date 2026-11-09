import { seedLibrary } from '../data/library.ts';
import type { Library } from '../types/library.ts';
import { refreshOverdue } from './library';

export const libraryKey = 'bibliotech.library.v1';
export const sessionKey = 'bibliotech.session.v1';

export function readLibrary(): Library {
  const raw = localStorage.getItem(libraryKey);
  if (!raw) return refreshOverdue(seedLibrary());
  try { return refreshOverdue(JSON.parse(raw) as Library); }
  catch { return refreshOverdue(seedLibrary()); }
}

export function saveLibrary(data: Library) {
  localStorage.setItem(libraryKey, JSON.stringify(data));
}
