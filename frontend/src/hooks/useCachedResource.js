import { useCallback, useEffect, useSyncExternalStore } from 'react';
export default function useCachedResource(cache, key, loader, ttl = 30000) {
  const subscribe = useCallback(
    (listener) => cache.subscribe(key, listener),
    [cache, key]
  );
  const snapshot = useCallback(() => cache.snapshot(key), [cache, key]);
  const state = useSyncExternalStore(subscribe, snapshot);
  const refresh = useCallback(
    (force = true) => cache.read(key, loader, { ttl, force }),
    [cache, key, loader, ttl]
  );
  useEffect(() => {
    refresh(false).catch(() => {});
  }, [refresh]);
  return { ...state, refresh };
}
