import React from 'react';
export default function TypingIndicator({ general = false }) {
  return (
    <span className="chat-typing">
      <span>{general ? 'Кто-то печатает…' : 'Печатает…'}</span>
      <span className="typing-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}
