import { useEffect, useRef } from 'react';
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
  useEffect(() => {
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
      try {
        await markChatRead(peerId, lastMessageId);
        if (disposed) return;
        cache.invalidate('unread');
        await cache.read('unread', loadUnread, { force: true });
        if (!disposed) acknowledged.current = key;
      } catch {
        if (!disposed) timer = setTimeout(mark, 5000);
      } finally {
        pending = false;
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      if (canRead()) timer = setTimeout(mark, 500);
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
