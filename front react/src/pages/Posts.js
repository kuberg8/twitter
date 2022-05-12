import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { LoadingButton } from "@mui/lab";
import Button from "@mui/material/Button";
import Post from "../components/post/Post";
import TextareaAutosize from "@mui/base/TextareaAutosize";

import { getPosts, createPost, deletePost, updatePost } from "../api/posts";

export default function Index(props) {
  const [posts, setPosts] = useState([]);
  const [value, setValue] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [editPost, setEditPost] = useState(null);

  useEffect(() => {
    getPosts().then(({ data }) => setPosts(data));
  }, []);

  const save = async () => {
    setSaveLoading(true);

    try {
      if (editPost) {
        await updatePost(editPost._id, editPost.message);
        setEditPost(null);
      } else {
        await createPost(value);
        setValue("");
      }

      await fetchPost();
    } catch (err) {
      Promise.reject(err);
    }

    setSaveLoading(false);
  };

  const removePost = (id) => {
    deletePost(id).then(() => fetchPost());
  };

  const fetchPost = () => {
    getPosts().then(({ data }) => setPosts(data));
  };

  return (
    <Box
      sx={{
        width: 500,
        margin: "20px auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          rowGap: "15px",
          width: "100%",
          marginBottom: "20px",
        }}
      >
        {posts.map((post) => (
          <Post
            key={post._id}
            post={post}
            deletePost={removePost}
            setEdit={setEditPost}
            isOwner={post.user._id === props.userId}
          />
        ))}
      </div>

      <TextareaAutosize
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
          width: "100%",
          minWidth: "100%",
          height: 150,
          padding: "10px 20px",
        }}
      />

      <div style={{ display: "flex", width: "100%", columnGap: "20px" }}>
        <LoadingButton
          loading={saveLoading}
          variant="contained"
          onClick={save}
          fullWidth
          size="large"
        >
          {editPost ? "Сохранить" : "Отправить"}
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
    </Box>
  );
}
