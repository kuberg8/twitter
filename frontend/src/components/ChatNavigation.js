import React, { useEffect, useState } from 'react';
import { Button, TextField } from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import { getChats, getUsers } from '../api/chats';
export const userName = (user) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Участник';

export default function ChatNavigation({ peerId, onSelect, revision }) {
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    getChats()
      .then(({ data }) => {
        if (active) {
          setChats(data);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Не удалось загрузить диалоги.');
      });
    return () => {
      active = false;
    };
  }, [revision, retry]);
  useEffect(() => {
    if (!choosing) return;
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      getUsers(query)
        .then(({ data }) => {
          if (active) {
            setUsers(data);
            setError('');
          }
        })
        .catch(() => {
          if (active) setError('Не удалось найти участников.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [choosing, query, retry]);
  const choose = (id) => {
    onSelect(id);
    setChoosing(false);
    setQuery('');
  };
  return (
    <nav className="chat-navigation" aria-label="Чаты">
      <button
        className={`chat-link ${!peerId ? 'selected' : ''}`}
        onClick={() => choose('')}
        aria-current={!peerId ? 'page' : undefined}
      >
        <ForumRoundedIcon fontSize="small" />
        <span>Общий чат</span>
      </button>
      <div className="chat-list-heading">
        <span>ЛИЧНЫЕ ЧАТЫ</span>
        <Button size="small" onClick={() => setChoosing(!choosing)}>
          {choosing ? 'Закрыть' : 'Новый чат'}
        </Button>
      </div>
      {choosing && (
        <div className="contact-picker">
          <TextField
            label="Найти по имени"
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            fullWidth
            autoFocus
          />
          {loading ? (
            <p>Ищем участников…</p>
          ) : (
            <div className="contact-results">
              {users.map((user) => (
                <button
                  className="chat-link"
                  key={user._id}
                  onClick={() => choose(user._id)}
                >
                  <span className="avatar">{userName(user).slice(0, 1)}</span>
                  <span>{userName(user)}</span>
                </button>
              ))}
              {!users.length && !error && <p>Участники не найдены.</p>}
            </div>
          )}
        </div>
      )}
      {error && (
        <div role="alert" className="chat-list-error">
          {error}
          <Button size="small" onClick={() => setRetry((value) => value + 1)}>
            Повторить
          </Button>
        </div>
      )}
      <div className="chat-list">
        {chats.map(({ peer, message }) => (
          <button
            className={`chat-link ${peerId === peer._id ? 'selected' : ''}`}
            key={peer._id}
            onClick={() => choose(peer._id)}
            aria-current={peerId === peer._id ? 'page' : undefined}
          >
            <span className="avatar">{userName(peer).slice(0, 1)}</span>
            <span className="chat-link-text">
              <strong>{userName(peer)}</strong>
              <small>{message}</small>
            </span>
          </button>
        ))}
        {!chats.length && !choosing && !error && (
          <p className="chat-list-empty">
            Выберите «Новый чат», чтобы написать лично.
          </p>
        )}
      </div>
    </nav>
  );
}
