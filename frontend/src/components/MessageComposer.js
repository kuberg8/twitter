import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, CircularProgress, IconButton } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { updatePost } from '../api/posts';
export default function MessageComposer({
  peerId,
  drafts,
  editing,
  onEdit,
  onMutation,
  onSend,
  disabled,
  onTyping,
}) {
  const [value, setValue] = useState(drafts.current[peerId] || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);
  const typingTimer = useRef(null);
  useEffect(
    () => () => {
      clearTimeout(typingTimer.current);
      onTyping?.(peerId, false);
    },
    [onTyping, peerId]
  );
  useEffect(() => {
    setValue(editing ? editing.message : drafts.current[peerId] || '');
    if (editing) input.current?.focus({ preventScroll: true });
  }, [editing, drafts, peerId]);
  useLayoutEffect(() => {
    if (!input.current) return;
    input.current.style.height = 'auto';
    input.current.style.height = `${Math.min(120, Math.max(44, input.current.scrollHeight))}px`;
  }, [value]);
  const send = async (event) => {
    event.preventDefault();
    if (!value.trim() || saving || disabled) return;
    onTyping?.(peerId, false);
    clearTimeout(typingTimer.current);
    if (!editing) {
      onSend(value.trim());
      drafts.current[peerId] = '';
      setValue('');
      setError('');
      input.current?.focus({ preventScroll: true });
      return;
    }
    setSaving(true);
    setError('');
    const submitted = value;
    try {
      const result = await updatePost(editing._id, submitted.trim());
      if (!editing && drafts.current[peerId] === submitted)
        drafts.current[peerId] = '';
      setValue(drafts.current[peerId] || '');
      onEdit(null);
      onMutation(editing ? 'updated' : 'created', result?.data?.post);
      input.current?.focus({ preventScroll: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Не удалось отправить. Текст сохранён — попробуйте ещё раз.'
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <form className="message-composer" onSubmit={send}>
      {error && (
        <div className="composer-error" role="alert">
          {error}
        </div>
      )}
      {editing && (
        <div className="edit-strip">
          <div>
            <strong>Редактирование</strong>
            <span>{editing.message}</span>
          </div>
          <IconButton
            aria-label="Отменить редактирование"
            onClick={() => onEdit(null)}
            disabled={saving}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </div>
      )}
      <div className="compose-row">
        <label className="sr-only" htmlFor="message">
          Сообщение
        </label>
        <textarea
          id="message"
          ref={input}
          rows={1}
          placeholder="Напишите сообщение…"
          value={value}
          maxLength={5000}
          disabled={saving || disabled}
          onBlur={() => onTyping?.(peerId, false)}
          onChange={(event) => {
            if (!editing) {
              onTyping?.(peerId, !!event.target.value.trim());
              clearTimeout(typingTimer.current);
              typingTimer.current = setTimeout(
                () => onTyping?.(peerId, false),
                3000
              );
            }
            setValue(event.target.value);
            if (!editing) drafts.current[peerId] = event.target.value;
          }}
          onKeyDown={(event) => {
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key === 'Enter' &&
              !event.nativeEvent.isComposing
            )
              send(event);
          }}
        />
        <Button
          type="submit"
          onMouseDown={(event) => event.preventDefault()}
          className="send-button"
          variant="contained"
          disabled={!value.trim() || saving || disabled}
          aria-label={editing ? 'Сохранить' : 'Отправить'}
        >
          {saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendRoundedIcon />
          )}
        </Button>
      </div>
      <div className="compose-hint">
        <span>Ctrl / ⌘ + Enter — отправить</span>
        <span>
          {value.length ? `${value.length} / 5000` : 'Enter — новая строка'}
        </span>
      </div>
    </form>
  );
}
