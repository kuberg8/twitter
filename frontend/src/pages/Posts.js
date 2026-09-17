import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, CircularProgress } from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import Post from '../components/post/Post';
import { getPosts, deletePost, createPost, updatePost } from '../api/posts';
import { logout } from '../store/userSlice';
import { useDispatch } from 'react-redux';
const WS_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3000';
export default function Posts({ userId }) {
  const [posts, setPosts] = useState([]);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await getPosts();
      setPosts(data);
      setError('');
    } catch {
      setError(
        'Не удалось загрузить сообщения. Проверьте соединение и попробуйте ещё раз.'
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let disposed = false;
    let socket;
    let retry;
    fetchPosts();
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(WS_URL);
      socket.onopen = () => {
        setConnected(true);
        fetchPosts();
      };
      socket.onmessage = ({ data }) => {
        try {
          const payload = JSON.parse(data);
          if (Array.isArray(payload.posts)) setPosts(payload.posts);
        } catch {
          setError('Не удалось получить обновление. Обновите ленту.');
        }
      };
      socket.onclose = () => {
        if (!disposed) {
          setConnected(false);
          retry = setTimeout(connect, 3000);
        }
      };
      socket.onerror = () => socket.close();
    };
    connect();
    // REST operations from other clients are refreshed even without socket events.
    const refresh = setInterval(fetchPosts, 15000);
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearInterval(refresh);
      socket.close();
    };
  }, [fetchPosts]);
  const save = async (event) => {
    event?.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      if (editPost) await updatePost(editPost._id, value.trim());
      else await createPost(value.trim());
      setValue('');
      setEditPost(null);
      await fetchPosts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Не удалось отправить сообщение. Текст сохранён — попробуйте ещё раз.'
      );
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    try {
      await deletePost(id);
      if (editPost?._id === id) {
        setEditPost(null);
        setValue('');
      }
      await fetchPosts();
    } catch {
      setError('Не удалось удалить сообщение. Попробуйте ещё раз.');
    }
  };
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-icon">
            <ForumRoundedIcon />
          </span>
          twitter<span className="brand-dot">.</span>
        </a>
        <div className="sidebar-label">ВАШЕ ПРОСТРАНСТВО</div>
        <div className="nav-active">
          <ForumRoundedIcon fontSize="small" /> Общий чат <span>01</span>
        </div>
        <div className="sidebar-note">
          <span>✦</span>
          <h3>Есть что сказать?</h3>
          <p>Идея, вопрос или просто привет — здесь есть место для каждого.</p>
        </div>
        <Button
          className="logout"
          startIcon={<LogoutRoundedIcon />}
          onClick={() => dispatch(logout())}
        >
          Выйти из аккаунта
        </Button>
      </aside>
      <main className="feed">
        <header className="feed-header">
          <div>
            <span className="eyebrow">РАЗГОВОРЫ, КОТОРЫЕ ОБЪЕДИНЯЮТ</span>
            <h1>
              Общий чат<span className="heading-dot">.</span>
            </h1>
            <p>Делитесь мыслями. Будьте на связи.</p>
          </div>
          <span className={`connection ${connected ? 'online' : ''}`}>
            <i />
            {connected ? 'На связи' : 'Переподключение'}
          </span>
        </header>
        <form className="composer" onSubmit={save}>
          <div className="composer-label">
            <span className="avatar own">Я</span>
            <label htmlFor="message">
              {editPost ? 'Редактирование сообщения' : 'Что у вас нового?'}
            </label>
          </div>
          <textarea
            id="message"
            ref={inputRef}
            placeholder="Поделитесь мыслью или начните разговор…"
            value={value}
            disabled={saving}
            maxLength={5000}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') save(e);
            }}
          />
          <div className="composer-bottom">
            <span>
              {value.length
                ? `${value.length} / 5000`
                : 'Ctrl / ⌘ + Enter для отправки'}
            </span>
            <div>
              {editPost && (
                <Button
                  disabled={saving}
                  onClick={() => {
                    setEditPost(null);
                    setValue('');
                  }}
                >
                  Отмена
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={!value.trim() || saving}
                endIcon={
                  saving ? (
                    <CircularProgress size={16} />
                  ) : (
                    <ArrowUpwardRoundedIcon />
                  )
                }
              >
                {saving ? 'Отправляем…' : editPost ? 'Сохранить' : 'Отправить'}
              </Button>
            </div>
          </div>
        </form>
        {error && (
          <div className="error-panel" role="alert">
            {error}
            <Button onClick={fetchPosts}>Повторить</Button>
          </div>
        )}
        <div className="feed-section">
          <h2>Последние сообщения</h2>
          <span>{posts.length}</span>
        </div>
        <section
          className="messages"
          aria-label="Сообщения"
          aria-busy={loading}
        >
          {loading ? (
            <div className="empty-state">
              <CircularProgress size={28} />
              <p>Загружаем разговор…</p>
            </div>
          ) : !posts.length ? (
            <div className="empty-state">
              <ForumRoundedIcon />
              <h3>{error ? 'Пока нет соединения' : 'Начните разговор'}</h3>
              <p>
                {error
                  ? 'Сообщения появятся после подключения к серверу.'
                  : 'Первое сообщение может стать началом чего-то интересного.'}
              </p>
            </div>
          ) : (
            [...posts].reverse().map((post) => (
              <Post
                key={post._id}
                post={post}
                deletePost={remove}
                setEdit={(item) => {
                  setEditPost(item);
                  setValue(item.message);
                  inputRef.current?.focus();
                  inputRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                }}
                isOwner={String(post.user?._id || post.user) === String(userId)}
              />
            ))
          )}
        </section>
        <footer className="feed-footer">Вы в хорошей компании.</footer>
      </main>
      <aside className="context-panel">
        <div className="context-symbol">✳</div>
        <span className="eyebrow">ОБЩИЙ ЧАТ</span>
        <h2>Разговор начинается с вас.</h2>
        <p>Это общее пространство для мыслей, вопросов и маленьких открытий.</p>
        <hr />
        <h3>Давайте беречь общение</h3>
        <p>Уважайте собеседников, делитесь полезным и оставайтесь собой.</p>
        <span className="context-bottom">Меньше шума. Больше смысла.</span>
      </aside>
    </div>
  );
}
