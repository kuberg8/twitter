import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/userSlice';
import { getPosts } from '../api/posts';
import { getChats, loadUnread, loadReadReceipt } from '../api/chats';
import { receiptKey, mergeReceipt } from '../utils/readReceipts';
import { applyMessageChange, messageKey } from '../utils/chatCache';
const WS_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3000';
export const loadMessages = async (peer) => {
  const result = await getPosts(peer);
  return { posts: result.data, nextCursor: result.nextCursor || null };
};
export default function useChatConnection(cache, token, peerId) {
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState([]);
  const [typing, setTyping] = useState({});
  const liveSocket = useRef(null);
  const lastTyping = useRef({});
  const sendTyping = useCallback((peer, active) => {
    const ws = liveSocket.current;
    if (!ws || ws.readyState !== 1) return;
    const now = Date.now();
    if (
      active &&
      lastTyping.current[peer] &&
      now - lastTyping.current[peer] < 1500
    )
      return;
    lastTyping.current[peer] = active ? now : 0;
    ws.send(JSON.stringify({ type: 'typing', peerId: peer, active }));
  }, []);
  const currentPeer = useRef(peerId);
  currentPeer.current = peerId;
  const dispatch = useDispatch();
  useEffect(() => {
    let disposed = false;
    let socket;
    let retry;
    let listTimer;
    let unreadTimer;
    const refreshUnread = () => {
      cache.invalidate('unread');
      clearTimeout(unreadTimer);
      unreadTimer = setTimeout(() => {
        if (!document.hidden && !disposed)
          cache.read('unread', loadUnread, { force: true }).catch(() => {});
      }, 250);
    };
    let online = false;
    let attempts = 0;
    let lastReply = Date.now();
    const refresh = () => {
      if (document.hidden || disposed) return;
      cache.read('unread', loadUnread, { force: true }).catch(() => {});
      const peer = currentPeer.current;
      if (peer)
        cache
          .read(receiptKey(peer), () => loadReadReceipt(peer), { force: true })
          .catch(() => {});
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
      liveSocket.current = socket;
      socket.onopen = () =>
        socket.send(JSON.stringify({ type: 'auth', token }));
      socket.onmessage = ({ data }) => {
        if (disposed) return;
        try {
          const event = JSON.parse(data);
          lastReply = Date.now();
          if (event.type === 'ready') {
            online = true;
            attempts = 0;
            setConnected(true);
            setPresence(event.users || []);
            socket.send(
              JSON.stringify({ type: 'presence', active: !document.hidden })
            );
            cache.invalidateAll();
            refresh();
          }
          if (event.type === 'presence') setPresence(event.users || []);
          if (event.type === 'typing') {
            const key = `${event.peerId}:${event.userId}`;
            setTyping((previous) => ({
              ...previous,
              [key]: event.active
                ? { peerId: event.peerId, expires: Date.now() + 5500 }
                : null,
            }));
          }
          if (event.type === 'chat:read') {
            const key = receiptKey(event.peerId);
            cache.prime(key, { position: null });
            cache.update(key, (previous) =>
              mergeReceipt(previous, { position: event.position })
            );
          }
          if (event.type === 'unread:changed') refreshUnread();
          if (event.type === 'chat:deleted') {
            refreshUnread();
            cache.update(messageKey(event.peerId), () => ({
              posts: [],
              nextCursor: null,
            }));
            cache.update('chats', (chats) =>
              (chats || []).filter((chat) => chat.peer._id !== event.peerId)
            );
            cache.invalidate(messageKey(event.peerId));
            cache.invalidate('chats');
            refresh();
          }
          if (event.type === 'posts:changed') {
            refreshUnread();
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
        setPresence([]);
        setTyping({});
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
    const visibility = () => {
      if (online && socket.readyState === 1)
        socket.send(
          JSON.stringify({ type: 'presence', active: !document.hidden })
        );
      if (document.hidden) sendTyping(currentPeer.current, false);
      else refresh();
    };
    const heartbeat = setInterval(() => {
      if (online && Date.now() - lastReply > 45000) {
        socket.close();
        return;
      }
      if (online && socket.readyState === 1)
        socket.send(
          JSON.stringify({ type: 'presence', active: !document.hidden })
        );
    }, 15000);
    const typingExpiry = setInterval(
      () =>
        setTyping((previous) => {
          const entries = Object.entries(previous).filter(
            ([, value]) => value && value.expires > Date.now()
          );
          return entries.length === Object.keys(previous).length
            ? previous
            : Object.fromEntries(entries);
        }),
      1000
    );
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('online', refresh);
    return () => {
      disposed = true;
      clearTimeout(unreadTimer);
      clearTimeout(retry);
      clearTimeout(listTimer);
      clearInterval(fallback);
      clearInterval(heartbeat);
      clearInterval(typingExpiry);
      liveSocket.current = null;
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('online', refresh);
      socket?.close();
    };
  }, [cache, token, dispatch, sendTyping]);
  const typingPeers = [
    ...new Set(
      Object.values(typing)
        .filter(Boolean)
        .map((value) => value.peerId)
    ),
  ];
  return {
    connected,
    typingPeers,
    presence,
    typing: typingPeers.includes(peerId),
    sendTyping,
  };
}
