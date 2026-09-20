import React, { memo, useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import DoneRoundedIcon from '@mui/icons-material/DoneRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
function Post({
  post,
  retryPost,
  deletePost,
  setEdit,
  isOwner,
  showReceipt = false,
  showAuthor = true,
  isRead = false,
}) {
  const [anchor, setAnchor] = useState(null);
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
        {!isOwner && showAuthor && (
          <div className="message-meta">
            <strong>{name}</strong>
          </div>
        )}
        <p>{post.message}</p>
        <div className="message-footer">
          {!Number.isNaN(date.getTime()) && (
            <time
              dateTime={date.toISOString()}
              title={date.toLocaleString('ru-RU')}
            >
              {date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          )}
          {isOwner && post.deliveryStatus === 'sending' && (
            <span
              className="message-receipt"
              role="status"
              aria-label="Отправляется"
            >
              <CircularProgress size={12} color="inherit" />
            </span>
          )}
          {isOwner && post.deliveryStatus === 'failed' && (
            <span role="alert">
              <button
                type="button"
                className="message-failed"
                title={post.deliveryError}
                onClick={() => retryPost(post._id)}
                aria-label="Не доставлено. Повторить отправку"
              >
                Не доставлено · Повторить
              </button>
            </span>
          )}
          {isOwner &&
            !post.deliveryStatus &&
            (showReceipt || post.clientMessageId) && (
              <span
                className={`message-receipt ${isRead ? 'is-read' : ''}`}
                role="img"
                aria-label={isRead ? 'Прочитано' : 'Отправлено'}
                title={isRead ? 'Прочитано собеседником' : 'Отправлено'}
              >
                {isRead ? (
                  <DoneAllRoundedIcon fontSize="inherit" />
                ) : (
                  <DoneRoundedIcon fontSize="inherit" />
                )}
              </span>
            )}
        </div>
      </div>
      {isOwner && !post.deliveryStatus && (
        <div className="message-actions">
          <IconButton
            aria-label="Действия с сообщением"
            aria-haspopup="menu"
            onClick={(event) => setAnchor(event.currentTarget)}
            size="small"
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchor}
            open={!!anchor}
            onClose={() => setAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setAnchor(null);
                setEdit(post);
              }}
            >
              <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              Редактировать сообщение
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchor(null);
                setConfirm(true);
              }}
            >
              <DeleteOutlineRoundedIcon fontSize="small" sx={{ mr: 1 }} />
              Удалить сообщение
            </MenuItem>
          </Menu>
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
