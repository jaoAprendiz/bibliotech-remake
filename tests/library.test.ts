import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedLibrary } from '../src/data/library.ts';
import { activeCount, applyAction, availableCopies, refreshOverdue } from '../src/services/library.ts';

const today = new Date('2026-11-09T13:00:00Z');
test('solicitação, aprovação, devolução e histórico preservam a disponibilidade física', () => {
  const initial = seedLibrary(today);
  const pending = applyAction(initial, 'student', { type: 'request', bookId: '1' }, today);
  const reservation = pending.reservations[0];
  assert.equal(reservation.status, 'PENDING');
  assert.equal(availableCopies(pending, '1').length, 1);
  assert.throws(() => applyAction(pending, 'student', { type: 'approve', id: reservation.id, copyId: '1-0' }, today));
  assert.throws(() => applyAction(pending, 'admin', { type: 'approve', id: reservation.id, copyId: '2-1' }, today));
  const approved = applyAction(pending, 'admin', { type: 'approve', id: reservation.id, copyId: '1-0' }, today);
  assert.equal(activeCount(approved, 'student'), 2);
  assert.equal(availableCopies(approved, '1').length, 0);
  assert.throws(() => applyAction(approved, 'student', { type: 'cancel', id: reservation.id }, today));
  const returned = applyAction(approved, 'admin', { type: 'return', id: reservation.id }, today);
  assert.equal(availableCopies(returned, '1').length, 1);
  assert.equal(returned.reservations[0].status, 'RETURNED');
  assert.throws(() => applyAction(returned, 'admin', { type: 'return', id: reservation.id }, today));
});

test('limite, duplicidade e disponibilidade impedem novas solicitações', () => {
  const initial = seedLibrary(today);
  assert.throws(() => applyAction(initial, 'student', { type: 'request', bookId: '2' }, today), /já tem/);
  assert.throws(() => applyAction(initial, 'student', { type: 'request', bookId: '4' }, today), /Nenhum exemplar/);
  const full = applyAction(initial, 'student', { type: 'request', bookId: '1' }, today);
  assert.throws(() => applyAction(full, 'student', { type: 'request', bookId: '5' }, today), /limite/);
  const cancelled = applyAction(full, 'student', { type: 'cancel', id: full.reservations[0].id }, today);
  assert.equal(cancelled.reservations[0].status, 'CANCELLED');
  assert.doesNotThrow(() => applyAction(cancelled, 'student', { type: 'request', bookId: '5' }, today));
});

test('atrasos bloqueiam a conta e o desbloqueio manual é preservado', () => {
  const overdue = refreshOverdue(seedLibrary(today), today);
  assert.equal(overdue.reservations.find(item => item.id === 'demo-late')?.status, 'OVERDUE');
  assert.equal(overdue.users.find(user => user.id === 'demo-overdue')?.status, 'BLOCKED');
  assert.throws(() => applyAction(overdue, 'demo-overdue', { type: 'request', bookId: '1' }, today));
  assert.throws(() => applyAction(overdue, 'admin', { type: 'user', id: 'demo-overdue', status: 'INACTIVE' }, today), /Finalize/);
  const unblocked = applyAction(overdue, 'admin', { type: 'user', id: 'demo-overdue', status: 'ACTIVE' }, today);
  assert.equal(refreshOverdue(unblocked, today).users.find(user => user.id === 'demo-overdue')?.status, 'ACTIVE');
  assert.doesNotThrow(() => applyAction(unblocked, 'demo-overdue', { type: 'request', bookId: '1' }, today));
});

test('editar exemplares preserva o vínculo com o empréstimo e a unicidade do tombo', () => {
  const initial = seedLibrary(today);
  const copy = initial.copies.find(item => item.id === '2-0')!;
  assert.throws(() => applyAction(initial, 'admin', { type: 'copy', copy: { ...copy, status: 'AVAILABLE' } }, today), /fluxo de empréstimo/);
  assert.throws(() => applyAction(initial, 'admin', { type: 'copy', copy: { ...initial.copies[0], id: 'new' } }, today), /tombo/);
  const edited = applyAction(initial, 'admin', { type: 'copy', copy: { ...copy, condition: 'Regular' } }, today);
  assert.equal(edited.copies.find(item => item.id === copy.id)?.condition, 'Regular');
  assert.equal(edited.reservations.find(item => item.id === 'demo-active')?.copyId, copy.id);
});
