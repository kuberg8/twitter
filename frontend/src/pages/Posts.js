import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Post from '../components/post/Post';
import smsAudio from '../assets/sms.mp3';
import { getPosts, deletePost } from '../api/posts';

const WS_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080';

export default function Index(props) {
  const [posts, setPosts] = useState([]);
  const [value, setValue] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const chatRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      try {
        const { data } = await getPosts();
        setPosts(data);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    wsRef.current = new WebSocket(WS_URL);
    const messageHandler = handleNewPost;

    wsRef.current.addEventListener('message', messageHandler);
    fetchInitialPosts();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reconnectWebSocket();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', reconnectWebSocket);

    return () => {
      wsRef.current.removeEventListener('message', messageHandler);
      wsRef.current.close();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', reconnectWebSocket);
    };
  }, []);

  const handleNewPost = ({ data }) => {
    const newPosts = JSON.parse(data);
    setPosts((prevPosts) => {
      if (
        newPosts.length > prevPosts.length &&
        newPosts[newPosts.length - 1].user !== props.userId
      ) {
        const audio = new Audio(smsAudio);
        audio.play();
      }
      return newPosts;
    });
    scrollToBottom();
  };

  const reconnectWebSocket = async () => {
    wsRef.current = new WebSocket(WS_URL);
    wsRef.current.addEventListener('message', handleNewPost);
    await fetchPosts();
  };

  const savePost = async () => {
    setSaveLoading(true);
    const message = editPost ? editPost.message.trim() : value.trim();

    try {
      if (message) {
        wsRef.current.send(
          JSON.stringify({
            message,
            userId: props.userId,
            postId: editPost?._id,
          })
        );
        if (!editPost) setValue('');
      }
      setEditPost(null);
    } catch (error) {
      Promise.reject(error);
      console.error(error);
    } finally {
      setSaveLoading(false);
    }
  };

  const removePost = async (id) => {
    try {
      await deletePost(id);
      await fetchPosts();
    } catch (error) {
      Promise.reject(error);
      console.error(error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data } = await getPosts();
      setPosts(data);
      scrollToBottom();
    } catch (error) {
      Promise.reject(error);
      console.error(error);
    }
  };

  const scrollToBottom = () => {
    if (chatRef.current) {
      setTimeout(() => {
        const elementOffset =
          chatRef.current.scrollHeight - chatRef.current.clientHeight;
        chatRef.current.scrollTo({ top: elementOffset, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        height: '100%',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        ref={chatRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          rowGap: '15px',
          width: '100%',
          overflow: 'auto',
          padding: '20px',
        }}
      >
        {posts.map((post) => (
          <Post
            key={post._id}
            post={post}
            deletePost={removePost}
            setEdit={setEditPost}
            isOwner={post.user === props.userId}
          />
        ))}
      </div>

      <div style={{ marginTop: 'auto', width: '100%', padding: '0 20px 20px' }}>
        <textarea
          value={editPost ? editPost.message : value}
          onChange={({ target }) =>
            editPost
              ? setEditPost({ ...editPost, message: target.value })
              : setValue(target.value)
          }
          style={{
            width: '100%',
            padding: '10px 20px',
            marginBottom: '10px',
            resize: 'none',
          }}
        />
        <div style={{ display: 'flex', width: '100%', columnGap: '20px' }}>
          <LoadingButton
            loading={saveLoading}
            variant="contained"
            onClick={savePost}
            fullWidth
            size="large"
          >
            {editPost ? 'Сохранить' : 'Отправить'}
          </LoadingButton>
          {editPost && (
            <Button
              onClick={() => setEditPost(null)}
              fullWidth
              size="large"
              color="error"
              variant="contained"
            >
              Отмена
            </Button>
          )}
        </div>
      </div>
    </Box>
  );
}
