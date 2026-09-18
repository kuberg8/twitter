import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { getChats, getUsers, loadUnread } from '../api/chats';
import useCachedResource from '../hooks/useCachedResource';
export const userName = (user) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Участник';
const loadChats = async () => (await getChats()).data;
export default function ChatNavigation({
  peerId,
  onSelect,
  cache,
  presence = [],
  typingPeers = [],
}) {
  const {
    data: chats = [],
    error,
    refresh,
  } = useCachedResource(cache, 'chats', loadChats);
  const {
    data: unread = {},
    error: unreadError,
    refresh: refreshUnread,
  } = useCachedResource(cache, 'unread', loadUnread);
  const [query, setQuery] = useState('');
  const [choosing, setChoosing] = useState(false);
  const choose = (peer) => {
    if (peer) cache.prime(`user:${peer._id}`, peer);
    onSelect(peer?._id || '');
    setChoosing(false);
    setQuery('');
  };
  const filtered = chats.filter(({ peer }) =>
    userName(peer).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  return (
    <nav className="chat-navigation" aria-label="Чаты">
      <div className="chat-search">
        <SearchRoundedIcon fontSize="small" />
        <input
          aria-label="Поиск чатов"
          placeholder="Поиск чатов"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <button
        aria-label="Общий чат"
        className={`chat-link general-chat ${!peerId ? 'selected' : ''}`}
        onClick={() => choose(null)}
        aria-current={!peerId ? 'page' : undefined}
      >
        <span className="avatar general-avatar">
          <ForumRoundedIcon fontSize="small" />
        </span>
        <span className="chat-link-text">
          <strong>Общий чат</strong>
          <small>
            {typingPeers.includes('') ? (
              <span className="chat-typing">Кто-то печатает…</span>
            ) : (
              'Обсуждаем всё вместе'
            )}
          </small>
        </span>
        <UnreadBadge count={unread.general} />
      </button>
      <div className="chat-list-heading">
        <span>Личные сообщения</span>
        <IconButton
          size="small"
          aria-label={choosing ? 'Закрыть поиск участников' : 'Новый чат'}
          onClick={() => setChoosing(!choosing)}
        >
          {choosing ? (
            <CloseRoundedIcon fontSize="small" />
          ) : (
            <AddRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </div>
      {choosing && <UserSearch cache={cache} onChoose={choose} />}
      {(error || unreadError) && (
        <div className="chat-list-error" role="alert">
          {error
            ? 'Не удалось обновить диалоги.'
            : 'Не удалось обновить счётчики непрочитанных.'}
          <Button
            size="small"
            onClick={() => {
              if (error) refresh().catch(() => {});
              if (unreadError) refreshUnread().catch(() => {});
            }}
          >
            Повторить
          </Button>
        </div>
      )}
      <div className="chat-list">
        {filtered.map(({ peer, message, created_at }) => (
          <button
            className={`chat-link ${peerId === peer._id ? 'selected' : ''}`}
            key={peer._id}
            onClick={() => choose(peer)}
            aria-current={peerId === peer._id ? 'page' : undefined}
          >
            <span className="avatar" style={{ position: 'relative' }}>
              {userName(peer).slice(0, 1)}
              {presence.includes(peer._id) && (
                <i
                  aria-label="В сети"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#28b77a',
                    border: '2px solid var(--surface, white)',
                  }}
                />
              )}
            </span>
            <span className="chat-link-text">
              <span className="chat-name-line">
                <strong>{userName(peer)}</strong>
                <time>
                  {new Date(created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </time>
              </span>
              <small>
                {typingPeers.includes(peer._id) ? (
                  <span className="chat-typing">Печатает…</span>
                ) : (
                  message
                )}
              </small>
            </span>
            <UnreadBadge count={unread[peer._id]} />
          </button>
        ))}
        {!filtered.length && !choosing && !error && (
          <div className="chat-list-empty">
            <p>
              {query ? 'Таких диалогов пока нет' : 'Ваши разговоры будут здесь'}
            </p>
            <Button size="small" onClick={() => setChoosing(true)}>
              Начать переписку
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
function UserSearch({ cache, onChoose }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const loader = useCallback(
    async () => (await getUsers(search)).data,
    [search]
  );
  const { data, error, refresh } = useCachedResource(
    cache,
    `search:${search}`,
    loader,
    60000
  );
  return (
    <div className="contact-picker">
      <div className="chat-search">
        <SearchRoundedIcon fontSize="small" />
        <input
          aria-label="Найти по имени"
          placeholder="Имя собеседника"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
      </div>
      <div className="contact-results">
        {error ? (
          <p role="alert">
            Не удалось найти участников.
            <Button onClick={() => refresh().catch(() => {})}>Повторить</Button>
          </p>
        ) : !data ? (
          <p>Ищем участников…</p>
        ) : (
          data.map((user) => (
            <button
              className="chat-link"
              key={user._id}
              onClick={() => onChoose(user)}
            >
              <span className="avatar">{userName(user).slice(0, 1)}</span>
              <strong>{userName(user)}</strong>
            </button>
          ))
        )}
        {data?.length === 0 && <p>Участники не найдены.</p>}
      </div>
    </div>
  );
}

function UnreadBadge({ count }) {
  const previous = useRef(count || 0);
  useEffect(() => {
    if (count) previous.current = count;
  }, [count]);
  const displayed = count || previous.current;
  return (
    <span className="unread-slot">
      <span
        className={`unread-badge ${count ? 'badge-visible' : 'badge-hidden'}`}
        aria-hidden={!count}
        aria-label={`Непрочитанных сообщений: ${displayed}`}
      >
        <span key={displayed} className="unread-number">
          {displayed > 99 ? '99+' : displayed}
        </span>
      </span>
    </span>
  );
}
