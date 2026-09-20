import { createChatCache, applyMessageChange } from './chatCache';

test('coalesces concurrent requests and reuses fresh data', async () => {
  const cache = createChatCache();
  const load = jest.fn().mockResolvedValue(['message']);
  const a = cache.read('chat', load);
  const b = cache.read('chat', load);
  expect(a).toBe(b);
  await Promise.all([a, b]);
  await cache.read('chat', load);
  expect(load).toHaveBeenCalledTimes(1);
});
test('keeps stale messages on a failed refresh and retries afterward', async () => {
  const cache = createChatCache();
  await cache.read('chat', async () => ['saved']);
  cache.invalidate('chat');
  await expect(
    cache.read('chat', async () => {
      throw new Error('offline');
    })
  ).rejects.toThrow('offline');
  expect(cache.snapshot('chat').data).toEqual(['saved']);
  await cache.read('chat', async () => ['new']);
  expect(cache.snapshot('chat').data).toEqual(['new']);
});
test('replays socket changes arriving during a history request without duplicate messages', async () => {
  const cache = createChatCache();
  let finish;
  const pending = cache.read(
    'chat',
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  await Promise.resolve();
  const post = { _id: '1', created_at: 1, message: 'new' };
  cache.update('chat', (page) => applyMessageChange(page, post, 'created'));
  cache.update('chat', (page) => applyMessageChange(page, post, 'created'));
  finish({ posts: [], nextCursor: null });
  await pending;
  expect(cache.snapshot('chat').data.posts).toEqual([post]);
});
test('does not restore private data from a pending request after session cleanup', async () => {
  const cache = createChatCache();
  let finish;
  const pending = cache.read(
    'chat',
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  await Promise.resolve();
  cache.clear();
  finish(['secret']);
  await pending;
  expect(cache.snapshot('chat').data).toBeUndefined();
  expect(createChatCache().snapshot('chat').data).toBeUndefined();
});
test('drops old unused entries and preserves active conversations', async () => {
  const cache = createChatCache(2);
  const unsubscribe = cache.subscribe('active', () => {});
  await cache.read('active', async () => 'keep');
  await cache.read('old', async () => 'old');
  await cache.read('new', async () => 'new');
  expect(cache.snapshot('active').data).toBe('keep');
  expect(cache.snapshot('old').data).toBeUndefined();
  unsubscribe();
});
test('replays a deletion over an older history response', async () => {
  const cache = createChatCache();
  const old = { _id: '1', created_at: 1 };
  await cache.read('chat', async () => ({ posts: [old], nextCursor: null }));
  let finish;
  const request = cache.read(
    'chat',
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    { force: true }
  );
  await Promise.resolve();
  cache.update('chat', (page) => applyMessageChange(page, old, 'deleted'));
  finish({ posts: [old], nextCursor: null });
  await request;
  expect(cache.snapshot('chat').data.posts).toEqual([]);
});

test('schedules one fresh read if a mutation invalidates an in-flight list request', async () => {
  const cache = createChatCache();
  let finish;
  const first = cache.read(
    'chats',
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  await Promise.resolve();
  cache.invalidate('chats');
  const freshLoader = jest.fn().mockResolvedValue(['new conversation']);
  const refresh = cache.read('chats', freshLoader, { force: true });
  const sameRefresh = cache.read('chats', freshLoader, { force: true });
  expect(refresh).toBe(sameRefresh);
  finish([]);
  await first;
  await refresh;
  expect(freshLoader).toHaveBeenCalledTimes(1);
  expect(cache.snapshot('chats').data).toEqual(['new conversation']);
});

test('optimistic read survives an in-flight stale unread response', async () => {
  const cache = createChatCache();
  cache.prime('unread', { peer: 2, other: 3 });
  let resolve;
  const pending = cache.read(
    'unread',
    () =>
      new Promise((done) => {
        resolve = done;
      }),
    { force: true }
  );
  await Promise.resolve();
  const release = cache.beginRead('peer');
  expect(cache.snapshot('unread').data).toEqual({ peer: 0, other: 3 });
  resolve({ peer: 2, other: 4 });
  await pending;
  expect(cache.snapshot('unread').data).toEqual({ peer: 0, other: 4 });
  release();
  await cache.read('unread', async () => ({ peer: 1 }), { force: true });
  expect(cache.snapshot('unread').data.peer).toBe(1);
});

test('a stale request started during acknowledgement cannot resurrect the badge', async () => {
  const cache = createChatCache();
  cache.prime('unread', { peer: 2 });
  const release = cache.beginRead('peer');
  let resolve;
  const pending = cache.read(
    'unread',
    () =>
      new Promise((done) => {
        resolve = done;
      }),
    { force: true }
  );
  await Promise.resolve();
  release();
  resolve({ peer: 2 });
  await pending;
  expect(cache.snapshot('unread').data.peer).toBe(0);
});
