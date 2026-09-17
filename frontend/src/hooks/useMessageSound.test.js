import { createMessageTracker } from './useMessageSound';

test('notifies only for new incoming messages, not history, edits, own messages or repeats', () => {
  const receive = createMessageTracker('me');
  const old = { _id: 'old', user: { _id: 'other' }, message: 'Old' };
  const own = { _id: 'own', user: { _id: 'me' } };
  const incoming = { _id: 'new', user: 'other' };
  expect(receive([old])).toBe(false);
  expect(receive([{ ...old, message: 'Edited' }])).toBe(false);
  expect(receive([old, own])).toBe(false);
  expect(receive([old, own, incoming])).toBe(true);
  expect(receive([old, own, incoming])).toBe(false);
  expect(receive([own])).toBe(false);
  expect(receive([old, own, incoming])).toBe(false);
});

test('notifies for the first incoming message after an empty history', () => {
  const receive = createMessageTracker('me');
  expect(receive([])).toBe(false);
  expect(receive([{ _id: 'first', user: { _id: 'other' } }])).toBe(true);
});
