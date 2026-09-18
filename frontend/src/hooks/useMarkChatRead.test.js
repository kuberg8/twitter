import { act, renderHook } from '@testing-library/react';
import useMarkChatRead from './useMarkChatRead';
import { markChatRead } from '../api/chats';
jest.mock('../api/chats', () => ({
  markChatRead: jest.fn().mockResolvedValue({}),
  loadUnread: jest.fn().mockResolvedValue({}),
}));
let focus;
let originalMatchMedia;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  focus = jest.spyOn(document, 'hasFocus').mockReturnValue(true);
  originalMatchMedia = window.matchMedia;
  window.matchMedia = () => ({ matches: false });
});
afterEach(() => {
  focus.mockRestore();
  window.matchMedia = originalMatchMedia;
  jest.useRealTimers();
});
const advance = () =>
  act(async () => {
    jest.advanceTimersByTime(600);
  });
const props = () => ({
  cache: { invalidate: jest.fn(), read: jest.fn().mockResolvedValue({}) },
  peerId: 'peer',
  lastMessageId: 'message1',
  away: false,
  nearBottom: { current: true },
  threadOpen: true,
  paused: false,
});

test('only marks the displayed message, and updates again when a newer one appears', async () => {
  const initial = props();
  const { rerender } = renderHook((value) => useMarkChatRead(value), {
    initialProps: initial,
  });
  await advance();
  expect(markChatRead).toHaveBeenCalledWith('peer', 'message1');
  expect(initial.cache.invalidate).toHaveBeenCalledWith('unread');
  rerender({ ...initial, lastMessageId: 'message2' });
  await advance();
  expect(markChatRead).toHaveBeenLastCalledWith('peer', 'message2');
});

test('reading older history does not clear unread; returning to bottom does', async () => {
  const initial = props();
  const { rerender } = renderHook((value) => useMarkChatRead(value), {
    initialProps: { ...initial, away: true },
  });
  await advance();
  expect(markChatRead).not.toHaveBeenCalled();
  rerender(initial);
  await advance();
  expect(markChatRead).toHaveBeenCalledTimes(1);
});

test('background and mobile chat-list views never mark the hidden conversation as read', async () => {
  const initial = props();
  focus.mockReturnValue(false);
  const { rerender } = renderHook((value) => useMarkChatRead(value), {
    initialProps: initial,
  });
  await advance();
  expect(markChatRead).not.toHaveBeenCalled();
  focus.mockReturnValue(true);
  window.matchMedia = () => ({ matches: true });
  rerender({ ...initial, threadOpen: false });
  await advance();
  expect(markChatRead).not.toHaveBeenCalled();
  rerender({ ...initial, threadOpen: true });
  await advance();
  expect(markChatRead).toHaveBeenCalledTimes(1);
});
