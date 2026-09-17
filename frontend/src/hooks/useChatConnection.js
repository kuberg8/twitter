import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/userSlice';
import { getPosts } from '../api/posts';
import { getChats } from '../api/chats';
import { applyMessageChange, messageKey } from '../utils/chatCache';
const WS_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3000';
export const loadMessages = async (peer) => {
  const result = await getPosts(peer);
  return { posts: result.data, nextCursor: result.nextCursor || null };
};
export default function useChatConnection(cache, token, peerId) {
  const [connected, setConnected] = useState(false);
  const currentPeer = useRef(peerId);
  currentPeer.current = peerId;
  const dispatch = useDispatch();
  useEffect(() => {
    let disposed = false;
    let socket;
    let retry;
    let listTimer;
    let online = false;
    let attempts = 0;
    const refresh = () => {
      if (document.hidden || disposed) return;
      const peer = currentPeer.current;
      cache
        .read(messageKey(peer), () => loadMessages(peer), { force: true })
        .catch(() => {});
      cache
        .read('chats', async () => (await getChats()).data, { force: true })
        .catch(() => {});
    };
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(WS_URL);
      socket.onopen = () =>
        socket.send(JSON.stringify({ type: 'auth', token }));
      socket.onmessage = ({ data }) => {
        if (disposed) return;
        try {
          const event = JSON.parse(data);
          if (event.type === 'ready') {
            online = true;
            attempts = 0;
            setConnected(true);
            cache.invalidateAll();
            refresh();
          }
          if (event.type === 'posts:changed') {
            const peer = event.peerId || '';
            if (
              event.post &&
              ['created', 'updated', 'deleted'].includes(event.action)
            ) {
              cache.update(messageKey(peer), (page) =>
                applyMessageChange(page, event.post, event.action)
              );
            } else {
              cache.invalidate(messageKey(peer));
              if (peer === currentPeer.current)
                cache
                  .read(messageKey(peer), () => loadMessages(peer), {
                    force: true,
                  })
                  .catch(() => {});
            }
            if (peer) {
              cache.invalidate('chats');
              clearTimeout(listTimer);
              listTimer = setTimeout(() => {
                if (!document.hidden)
                  cache
                    .read('chats', async () => (await getChats()).data, {
                      force: true,
                    })
                    .catch(() => {});
              }, 400);
            }
          }
        } catch {
          /* Ignore malformed events; scoped history is refreshed after reconnect. */
        }
      };
      socket.onclose = (event) => {
        if (disposed) return;
        online = false;
        setConnected(false);
        if (event.code === 4001) {
          dispatch(logout());
          return;
        }
        retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts++));
      };
      socket.onerror = () => socket.close();
    };
    connect();
    const fallback = setInterval(() => {
      if (!online) refresh();
    }, 30000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearTimeout(listTimer);
      clearInterval(fallback);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', refresh);
      socket?.close();
    };
  }, [cache, token, dispatch]);
  return connected;
}
