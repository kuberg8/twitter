import ThemeChoice from '../components/ThemeChoice';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import { useDispatch } from 'react-redux';
import { logout } from '../store/userSlice';
import ChatNavigation, { userName } from '../components/ChatNavigation';
import PushNotifications from '../components/PushNotifications';
import MessageComposer from '../components/MessageComposer';
import Post from '../components/post/Post';
import { getChatUser, getChats } from '../api/chats';
import { getPosts, deletePost } from '../api/posts';
import { disablePush } from '../utils/pushNotifications';
import {
  createChatCache,
  messageKey,
  applyMessageChange,
} from '../utils/chatCache';
import useCachedResource from '../hooks/useCachedResource';
import useChatConnection, { loadMessages } from '../hooks/useChatConnection';
import useMessageSound from '../hooks/useMessageSound';

export default function Posts(props) {
  return <Messenger key={props.userId} {...props} />;
}

function Messenger({ userId, token }) {
  const [params, setParams] = useSearchParams();
  const peerId = params.get('chat') || '';
  const threadOpen = params.has('chat') || params.get('room') === 'general';
  const [cache] = useState(createChatCache);
  const drafts = useRef(Object.create(null));
  const sound = useMessageSound(userId, peerId);
  const connected = useChatConnection(cache, token, peerId);
  const [settings, setSettings] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  useEffect(() => () => cache.clear(), [cache]);
  const select = useCallback(
    (id) => setParams(id ? { chat: id } : { room: 'general' }),
    [setParams]
  );
  const back = useCallback(() => setParams({}), [setParams]);
  return (
    <div className={`messenger ${threadOpen ? 'thread-open' : ''}`}>
      <aside className="messenger-sidebar">
        <header className="sidebar-header">
          <div className="messenger-brand">
            <span className="brand-icon">
              <ForumRoundedIcon fontSize="small" />
            </span>
            <div>
              <strong>
                twitter<span>.</span>
              </strong>
              <small>Сообщения</small>
            </div>
          </div>
          <IconButton aria-label="Настройки" onClick={() => setSettings(true)}>
            <SettingsOutlinedIcon />
          </IconButton>
        </header>
        <ChatNavigation peerId={peerId} onSelect={select} cache={cache} />
        <footer className="sidebar-footer">
          <span className={`connection ${connected ? 'online' : ''}`}>
            <i />
            {connected ? 'Подключено' : 'Подключаемся…'}
          </span>
          <IconButton
            aria-label="Выйти из аккаунта"
            onClick={async () => {
              try {
                await disablePush();
                cache.clear();
                dispatch(logout());
              } catch {
                setError('Не удалось выйти. Попробуйте ещё раз.');
              }
            }}
          >
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </footer>
        {error && (
          <p role="alert" className="composer-error">
            {error}
          </p>
        )}
      </aside>
      <Conversation
        key={peerId || 'general'}
        userId={userId}
        peerId={peerId}
        cache={cache}
        drafts={drafts}
        sound={sound}
        onBack={back}
        connected={connected}
      />
      <Dialog
        open={settings}
        onClose={() => setSettings(false)}
        keepMounted
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Настройки
          <IconButton
            aria-label="Закрыть настройки"
            onClick={() => setSettings(false)}
            sx={{ float: 'right' }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <ThemeChoice />
          <h3 className="settings-heading">Уведомления</h3>
          <Button
            onClick={sound.toggleSound}
            startIcon={
              sound.enabled ? <VolumeUpRoundedIcon /> : <VolumeOffRoundedIcon />
            }
            aria-pressed={sound.enabled}
          >
            {sound.enabled ? 'Выключить звук' : 'Включить звук'}
          </Button>
          <PushNotifications userId={userId} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
const EMPTY = [];
export function Conversation({
  userId,
  peerId,
  cache,
  drafts,
  sound,
  onBack,
  connected,
}) {
  const loader = useCallback(() => loadMessages(peerId), [peerId]);
  const history = useCachedResource(cache, messageKey(peerId), loader);
  const peerLoader = useCallback(
    async () => (peerId ? (await getChatUser(peerId)).data : null),
    [peerId]
  );
  const profile = useCachedResource(
    cache,
    `user:${peerId}`,
    peerLoader,
    300000
  );
  const posts = history.data?.posts || EMPTY;
  const { notify } = sound;
  const refreshMessages = history.refresh;
  const quiet = useRef(false);
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState('');
  const [olderLoading, setOlderLoading] = useState(false);
  const [away, setAway] = useState(false);
  const scroll = useRef(null);
  const nearBottom = useRef(true);
  const preserve = useRef(null);
  const first = useRef(true);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (history.data) {
      notify(posts, quiet.current);
      quiet.current = false;
    }
  }, [history.data, posts, notify]);
  const scrollBottom = useCallback(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
    nearBottom.current = true;
    setAway(false);
  }, []);
  useLayoutEffect(() => {
    if (!scroll.current || !history.data) return;
    if (preserve.current) {
      scroll.current.scrollTop =
        preserve.current.top +
        scroll.current.scrollHeight -
        preserve.current.height;
      preserve.current = null;
    } else if (first.current || nearBottom.current) scrollBottom();
    first.current = false;
  }, [posts, history.data, scrollBottom]);
  const mutation = useCallback(
    (action, post) => {
      if (post)
        cache.update(messageKey(peerId), (page) =>
          applyMessageChange(page, post, action)
        );
      else refreshMessages().catch(() => {});
      if (peerId) {
        cache.invalidate('chats');
        cache
          .read('chats', async () => (await getChats()).data, { force: true })
          .catch(() => {});
      }
      if (action === 'created') scrollBottom();
    },
    [cache, peerId, refreshMessages, scrollBottom]
  );
  const remove = useCallback(
    async (id) => {
      try {
        const result = await deletePost(id);
        mutation('deleted', result?.data?.post || { _id: id });
        setEditing((post) => (post?._id === id ? null : post));
      } catch {
        setActionError('Не удалось удалить сообщение. Попробуйте ещё раз.');
      }
    },
    [mutation]
  );
  const loadOlder = async () => {
    if (olderLoading || history.loading || !history.data?.nextCursor) return;
    setOlderLoading(true);
    setActionError('');
    try {
      const cursor = history.data.nextCursor;
      await cache.read(
        messageKey(peerId),
        async () => {
          const result = await getPosts(peerId, cursor);
          const page = cache.snapshot(messageKey(peerId)).data;
          if (alive.current) {
            quiet.current = true;
            if (scroll.current)
              preserve.current = {
                top: scroll.current.scrollTop,
                height: scroll.current.scrollHeight,
              };
          }
          const map = new Map(
            [...result.data, ...(page?.posts || [])].map((post) => [
              post._id,
              post,
            ])
          );
          return {
            posts: [...map.values()].sort(
              (a, b) =>
                a.created_at - b.created_at ||
                String(a._id).localeCompare(String(b._id))
            ),
            nextCursor: result.nextCursor || null,
          };
        },
        { force: true }
      );
    } catch {
      if (alive.current)
        setActionError('Не удалось загрузить историю. Попробуйте ещё раз.');
    } finally {
      if (alive.current) setOlderLoading(false);
    }
  };
  const name = peerId
    ? profile.data
      ? userName(profile.data)
      : 'Личный чат'
    : 'Общий чат';
  return (
    <main className="conversation">
      <header className="conversation-header">
        <IconButton
          className="back-to-chats"
          aria-label="К списку чатов"
          onClick={onBack}
        >
          <ArrowBackRoundedIcon />
        </IconButton>
        <span className="avatar conversation-avatar">
          {peerId ? name.slice(0, 1) : <ForumRoundedIcon fontSize="small" />}
        </span>
        <div className="conversation-title">
          <h1>{name}</h1>
          <p>
            {peerId ? 'Личная переписка' : 'Пространство для всех участников'}
          </p>
        </div>
        <span
          className={`connection ${connected ? 'online' : ''}`}
          title={
            connected
              ? 'Соединение с сервером установлено'
              : 'Восстанавливаем соединение'
          }
        >
          <i />
          <span>{connected ? 'На связи' : 'Подключение…'}</span>
        </span>
      </header>
      {(history.error || profile.error || actionError) && (
        <div className="chat-error" role="alert">
          {actionError ||
            (profile.error
              ? 'Собеседник недоступен.'
              : 'Не удалось обновить сообщения. Показываем сохранённую переписку.')}
          <Button
            size="small"
            onClick={() => {
              setActionError('');
              history.refresh().catch(() => {});
              if (profile.error) profile.refresh().catch(() => {});
            }}
          >
            Повторить
          </Button>
        </div>
      )}
      <section
        ref={scroll}
        className="conversation-messages"
        aria-label="Сообщения"
        aria-busy={history.loading && !history.data}
        onScroll={() => {
          const el = scroll.current;
          nearBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
          setAway(!nearBottom.current);
        }}
      >
        {history.data?.nextCursor && (
          <div className="history-more">
            <Button
              size="small"
              onClick={loadOlder}
              disabled={olderLoading || history.loading}
            >
              {olderLoading ? 'Загружаем…' : 'Более ранние сообщения'}
            </Button>
          </div>
        )}
        {!history.data && !history.error ? (
          <div className="chat-empty">
            <CircularProgress size={26} />
            <p>Загружаем переписку…</p>
          </div>
        ) : !posts.length ? (
          <div className="chat-empty">
            <span className="empty-chat-icon">
              <ForumRoundedIcon />
            </span>
            <h2>
              {history.error ? 'Не удалось загрузить чат' : 'Начните разговор'}
            </h2>
            <p>
              {history.error
                ? 'Проверьте соединение и повторите попытку.'
                : 'Напишите первое сообщение — собеседник будет рад.'}
            </p>
          </div>
        ) : (
          posts.map((post, index) => {
            const date = new Date(post.created_at);
            const label = date.toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            const showDate =
              index === 0 ||
              new Date(posts[index - 1].created_at).toDateString() !==
                date.toDateString();
            return (
              <React.Fragment key={post._id}>
                {showDate && (
                  <div className="date-divider">
                    <span>{label}</span>
                  </div>
                )}
                <Post
                  post={post}
                  deletePost={remove}
                  setEdit={setEditing}
                  isOwner={
                    String(post.user?._id || post.user) === String(userId)
                  }
                />
              </React.Fragment>
            );
          })
        )}
      </section>
      {away && (
        <IconButton
          className="jump-to-latest"
          aria-label="К новым сообщениям"
          onClick={scrollBottom}
        >
          <KeyboardArrowDownRoundedIcon />
        </IconButton>
      )}
      <MessageComposer
        peerId={peerId}
        drafts={drafts}
        editing={editing}
        onEdit={setEditing}
        onMutation={mutation}
        disabled={!!peerId && !profile.data}
      />
    </main>
  );
}
