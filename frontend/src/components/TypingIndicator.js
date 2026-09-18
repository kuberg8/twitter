import React from 'react';
export default function TypingIndicator({ general = false }) {
  return (
    <div
      className="message incoming typing-message"
      role="status"
      aria-label={general ? 'Кто-то печатает' : 'Собеседник печатает'}
    >
      <div className="message-bubble typing-bubble">
        <span className="typing-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}
