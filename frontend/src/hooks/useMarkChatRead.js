import { useLayoutEffect, useRef } from 'react';
import { loadUnread, markChatRead } from '../api/chats';

export default function useMarkChatRead({
  cache,
  peerId,
  lastMessageId,
  away,
  threadOpen,
  paused,
  nearBottom,
}) {
  const acknowledged = useRef(null);
  useLayoutEffect(() => {
    let disposed = false;
    let pending = false;
    let timer;
    const canRead = () =>
      !disposed &&
      !paused &&
      !document.hidden &&
      document.hasFocus() &&
      !away &&
      nearBottom.current &&
      (threadOpen || !window.matchMedia?.('(max-width: 700px)').matches);
    const key = `${peerId}:${lastMessageId}`;
    const mark = async () => {
      if (
        !lastMessageId ||
        !canRead() ||
        pending ||
        acknowledged.current === key
      )
        return;
      pending = true;
      const release = cache.beginRead(peerId || 'general');
      try {
        await markChatRead(peerId, lastMessageId);
        cache.invalidate('unread');
        release();
        await cache.read('unread', loadUnread, { force: true });
        if (!disposed) acknowledged.current = key;
      } catch {
        release();
        cache.invalidate('unread');
        cache.read('unread', loadUnread, { force: true }).catch(() => {});
        if (!disposed) timer = setTimeout(mark, 5000);
      } finally {
        release();
        pending = false;
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      if (canRead()) void mark();
    };
    schedule();
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('focus', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      disposed = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('focus', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [cache, peerId, lastMessageId, away, threadOpen, paused, nearBottom]);
}
