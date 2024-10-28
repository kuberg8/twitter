import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Post from '../components/post/Post';

import smsAudio from '../assets/sms.mp3';

import { getPosts, deletePost } from '../api/posts';

let ws = new WebSocket('ws://localhost:8080');

export default function Index(props) {
  const [posts, setPosts] = useState([]);
  const [value, setValue] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editPost, setEditPost] = useState(null);

  const chatRef = useRef(null);

  useEffect(() => {
    fetchPost();
    let postCount = posts.length;

    const messageHandler = ({ data }) => {
      const newPosts = JSON.parse(data);

      try {
        if (
          newPosts[newPosts.length - 1].user !== props.userId &&
          newPosts.length > postCount
        ) {
          const audio = new Audio(smsAudio);
          audio.play();
        }
      } catch (e) {
        Promise.reject(e);
      }

      setPosts(newPosts);
      postCount = newPosts.length;
      scrollToBottom();
    };

    ws.addEventListener('message', messageHandler);

    const reconectWbSocket = async () => {
      await fetchPost();
      ws = new WebSocket('ws://localhost:8080');
      ws.addEventListener('message', messageHandler);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && document.hasFocus()) {
        reconectWbSocket();
      }
    };

    // переподключение к сокетам
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => {
      reconectWbSocket();
    });
  }, []);

  const save = async () => {
    setSaveLoading(true);

    try {
      if (editPost) {
        // await updatePost(editPost._id, editPost.message);
        if (editPost.message) {
          ws.send(
            JSON.stringify({
              message: editPost.message.trim(),
              userId: props.userId,
              postId: editPost._id,
            })
          );
        }
        setEditPost(null);
      } else {
        // await createPost(value);
        value &&
          ws.send(
            JSON.stringify({ message: value.trim(), userId: props.userId })
          );
        setValue('');
      }
    } catch (err) {
      Promise.reject(err);
    }

    setSaveLoading(false);
  };

  const removePost = (id) => {
    deletePost(id).then(() => fetchPost());
  };

  const fetchPost = async () => {
    try {
      const { data } = await getPosts();
      setPosts(data);
      scrollToBottom();
    } catch (err) {
      Promise.reject(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      const elementOffset =
        chatRef.current.scrollHeight - chatRef.current.clientHeight + 100;

      chatRef.current.scrollTo({
        top: elementOffset,
        behavior: 'smooth',
      });
    }, 100);
  };

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: '0',
        height: '100%',
        width: '100vw',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          rowGap: '15px',
          width: '100%',
          overflow: 'auto',
          padding: '20px',
        }}
        ref={chatRef}
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
              ? setEditPost({
                  ...editPost,
                  message: target.value,
                })
              : setValue(target.value)
          }
          style={{
            width: '100%',
            padding: '10px 20px',
            marginBottom: '10px',
            resize: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: '100vw',
            columnGap: '20px',
          }}
        >
          <LoadingButton
            loading={saveLoading}
            variant="contained"
            onClick={save}
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
