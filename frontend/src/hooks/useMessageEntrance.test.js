import { renderHook } from '@testing-library/react';
import useMessageEntrance from './useMessageEntrance';
const message = (id, time) => ({ _id: id, created_at: time });
test('animates new arrivals but not initial history, edits or older pages', () => {
  const a = message('a', 100);
  const b = message('b', 200);
  const { result, rerender } = renderHook(
    ({ posts, loaded }) => useMessageEntrance(posts, loaded),
    { initialProps: { posts: [a], loaded: true } }
  );
  expect([...result.current]).toEqual([]);
  rerender({ posts: [a, b], loaded: true });
  expect([...result.current]).toEqual(['b']);
  rerender({ posts: [message('older', 50), a, b], loaded: true });
  expect([...result.current]).toEqual([]);
  rerender({ posts: [a, { ...b, message: 'edited' }], loaded: true });
  expect([...result.current]).toEqual([]);
});
test('animates the first live message in an already loaded empty conversation', () => {
  const { result, rerender } = renderHook(
    ({ posts, loaded }) => useMessageEntrance(posts, loaded),
    { initialProps: { posts: [], loaded: true } }
  );
  rerender({ posts: [message('a', 100)], loaded: true });
  expect([...result.current]).toEqual(['a']);
});
