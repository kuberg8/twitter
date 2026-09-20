// Session-only cache. Never persists private messages to disk or shares data across accounts.
export function createChatCache(maxEntries = 40) {
  const entries = new Map();
  const unreadReads = new Map();
  const entryFor = (key) => {
    if (!entries.has(key))
      entries.set(key, {
        state: { data: undefined, loading: false, error: null },
        time: 0,
        listeners: new Set(),
        pending: null,
        patches: [],
        invalidated: false,
        trailing: null,
      });
    const entry = entries.get(key);
    entries.delete(key);
    entries.set(key, entry);
    if (entries.size > maxEntries) {
      for (const [oldKey, old] of entries) {
        if (oldKey !== key && !old.listeners.size && !old.pending) {
          entries.delete(oldKey);
          break;
        }
      }
    }
    return entry;
  };
  const publish = (entry, state) => {
    if (state.data && entries.get('unread') === entry) {
      state = { ...state, data: { ...state.data } };
      unreadReads.forEach((_, peer) => {
        state.data[peer] = 0;
      });
    }
    entry.state = state;
    entry.listeners.forEach((listener) => listener());
  };
  const cache = {
    beginRead(peer) {
      const token = {};
      unreadReads.set(peer, token);
      cache.prime('unread', {});
      cache.update('unread', (counts) => ({ ...counts, [peer]: 0 }));
      return () => {
        if (unreadReads.get(peer) !== token) return;
        // Preserve the optimistic patch on any request started during the POST.
        cache.update('unread', (counts) => ({ ...counts, [peer]: 0 }));
        unreadReads.delete(peer);
      };
    },
    snapshot: (key) => entryFor(key).state,
    subscribe(key, listener) {
      const entry = entryFor(key);
      entry.listeners.add(listener);
      return () => entry.listeners.delete(listener);
    },
    read(key, loader, { ttl = 30000, force = false } = {}) {
      const entry = entryFor(key);
      if (entry.pending) {
        if (force && entry.invalidated) {
          if (!entry.trailing)
            entry.trailing = entry.pending
              .catch(() => {})
              .then(() => {
                entry.trailing = null;
                if (entries.get(key) !== entry) return undefined;
                return cache.read(key, loader, { ttl, force: true });
              });
          return entry.trailing;
        }
        return entry.pending;
      }
      if (
        !force &&
        entry.state.data !== undefined &&
        Date.now() - entry.time < ttl
      )
        return Promise.resolve(entry.state.data);
      publish(entry, { ...entry.state, loading: true, error: null });
      entry.patches = [];
      entry.invalidated = false;
      entry.pending = Promise.resolve()
        .then(loader)
        .then((result) => {
          if (entries.get(key) !== entry) return result;
          const data = entry.patches.reduce(
            (value, patch) => patch(value),
            result
          );
          entry.time = entry.invalidated ? 0 : Date.now();
          publish(entry, { data, loading: false, error: null });
          return data;
        })
        .catch((error) => {
          if (entries.get(key) === entry)
            publish(entry, { ...entry.state, loading: false, error });
          throw error;
        })
        .finally(() => {
          entry.pending = null;
          entry.patches = [];
        });
      return entry.pending;
    },
    update(key, patch) {
      const entry = entryFor(key);
      if (entry.pending) entry.patches.push(patch);
      if (entry.state.data !== undefined)
        publish(entry, { ...entry.state, data: patch(entry.state.data) });
    },
    prime(key, data) {
      const entry = entryFor(key);
      if (entry.state.data === undefined) {
        entry.time = Date.now();
        publish(entry, { ...entry.state, data });
      }
    },
    invalidate(key) {
      const entry = entryFor(key);
      entry.time = 0;
      entry.invalidated = true;
    },
    invalidateAll() {
      entries.forEach((entry) => {
        entry.time = 0;
        entry.invalidated = true;
      });
    },
    clear() {
      entries.clear();
      unreadReads.clear();
    },
  };
  return cache;
}

export const messageKey = (peer = '') => `messages:${peer}`;
export function applyMessageChange(page, post, action) {
  const index = page.posts.findIndex((item) => item._id === post._id);
  let posts = page.posts;
  if (action === 'deleted')
    posts = posts.filter((item) => item._id !== post._id);
  else if (index >= 0)
    posts = posts.map((item) => (item._id === post._id ? post : item));
  else if (action === 'created') posts = [...posts, post];
  posts = [...posts].sort(
    (a, b) =>
      a.created_at - b.created_at || String(a._id).localeCompare(String(b._id))
  );
  return { ...page, posts };
}
