import React, { useEffect, useRef, useState } from 'react';
import { Collapse, useMediaQuery } from '@mui/material';

export default function MessageReveal({ animate, onResize, children }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [animateOnMount] = useState(() => animate && !reducedMotion);
  const [expanded, setExpanded] = useState(!animateOnMount);
  const [finished, setFinished] = useState(false);
  const container = useRef(null);
  useEffect(() => {
    if (animateOnMount) setExpanded(true);
  }, [animateOnMount]);
  useEffect(() => {
    if (
      !animateOnMount ||
      finished ||
      !container.current ||
      typeof ResizeObserver === 'undefined'
    )
      return;
    const observer = new ResizeObserver(() => onResize?.());
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [animateOnMount, finished, onResize]);
  if (!animateOnMount) return children;
  return (
    <Collapse
      ref={container}
      in={expanded}
      timeout={reducedMotion ? 0 : 220}
      onEntered={() => {
        setFinished(true);
        onResize?.();
      }}
    >
      <div
        style={{
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(6px)',
          transition: reducedMotion
            ? 'none'
            : 'opacity 180ms ease, transform 220ms ease',
        }}
      >
        {children}
      </div>
    </Collapse>
  );
}
