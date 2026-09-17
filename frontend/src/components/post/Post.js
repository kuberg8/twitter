import React, { memo, useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
function Post({ post, deletePost, setEdit, isOwner }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const name =
    [post.user?.first_name, post.user?.last_name].filter(Boolean).join(' ') ||
    'Участник';
  const date = new Date(post.created_at);
  return (
    <article className={`message ${isOwner ? 'outgoing' : 'incoming'}`}>
      <div className={`avatar ${isOwner ? 'own' : ''}`}>
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className="message-bubble">
        <div className="message-meta">
          <strong>{isOwner ? 'Вы' : name}</strong>
          {!Number.isNaN(date.getTime()) && (
            <time
              dateTime={date.toISOString()}
              title={date.toLocaleString('ru-RU')}
            >
              {date.toLocaleString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          )}
        </div>
        <p>{post.message}</p>
      </div>
      {isOwner && (
        <div className="message-actions">
          <IconButton
            aria-label="Редактировать сообщение"
            size="small"
            onClick={() => setEdit(post)}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Удалить сообщение"
            size="small"
            onClick={() => setConfirm(true)}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </div>
      )}
      <Dialog open={confirm} onClose={() => !deleting && setConfirm(false)}>
        <DialogTitle>Удалить сообщение?</DialogTitle>
        <DialogContent>Восстановить его не получится.</DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setConfirm(false)}>
            Отмена
          </Button>
          <Button
            color="error"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await deletePost(post._id);
              setDeleting(false);
              setConfirm(false);
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </article>
  );
}

export default memo(Post);
