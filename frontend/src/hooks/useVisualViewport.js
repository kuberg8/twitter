import { useLayoutEffect, useRef } from 'react';

// Track the visible area, including Safari's keyboard-driven viewport pan.
export default function useVisualViewport() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    const element = ref.current;
    if (!viewport || !element) return;
    const update = () => {
      if (viewport.scale !== 1) return;
      element.style.setProperty('--messenger-height', `${viewport.height}px`);
      element.style.setProperty('--messenger-top', `${viewport.offsetTop}px`);
      element.classList.toggle(
        'keyboard-open',
        window.innerHeight - viewport.height > 100
      );
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);
  return ref;
}
