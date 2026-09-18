import React, { useEffect, useRef } from 'react';
import { Collapse, useMediaQuery } from '@mui/material';
export default function TypingIndicator({
  general = false,
  active = false,
  onResize,
}) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const container = useRef(null);
  useEffect(() => {
    if (!container.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => onResize?.());
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [onResize]);
  return (
    <Collapse ref={container} in={active} timeout={reducedMotion ? 0 : 220}>
      <div
        className="message incoming typing-message"
        role={active ? 'status' : undefined}
        aria-hidden={!active}
        aria-label={general ? 'Кто-то печатает' : 'Собеседник печатает'}
        style={{
          opacity: active ? 1 : 0,
          transform: active ? 'translateY(0)' : 'translateY(6px)',
          transition: reducedMotion
            ? 'none'
            : 'opacity 180ms ease, transform 220ms ease',
        }}
      >
        <div className="message-bubble typing-bubble">
          <span className="typing-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </Collapse>
  );
}
