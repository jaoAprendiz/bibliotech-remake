export type Role = 'student' | 'admin';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
export type ReservationStatus = 'PENDING' | 'APPROVED' | 'RETURNED' | 'CANCELLED' | 'OVERDUE';
export interface User { id: string; name: string; email: string; password: string; role: Role; status: UserStatus; reason?: string; createdAt: string }
export interface Book { id: string; title: string; author: string; publisher: string; isbn: string; year: number; edition: string; category: string; cover: string; synopsis?: string }
export interface BookCopy { id: string; bookId: string; accession: string; condition: string; status: 'AVAILABLE' | 'ON_LOAN' | 'MAINTENANCE' }
export interface Reservation { id: string; userId: string; bookId: string; copyId?: string; status: ReservationStatus; requestedAt: string; pickedUpAt?: string; dueAt?: string; closedAt?: string }
export interface Library { users: User[]; books: Book[]; copies: BookCopy[]; reservations: Reservation[] }
