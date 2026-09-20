import { useLayoutEffect, useRef } from 'react';

// Track the visible area, including Safari's keyboard-driven viewport pan.
export default function useVisualViewport() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    const element = ref.current;
    if (!viewport || !element) return;
    let expandedHeight = window.innerHeight;
    let width = window.innerWidth;
    const update = () => {
      if (viewport.scale !== 1) return;
      if (width !== window.innerWidth) {
        width = window.innerWidth;
        expandedHeight = window.innerHeight;
      }
      expandedHeight = Math.max(expandedHeight, window.innerHeight);
      element.style.setProperty('--messenger-height', `${viewport.height}px`);
      element.style.setProperty('--messenger-top', `${viewport.offsetTop}px`);
      element.classList.toggle(
        'keyboard-open',
        expandedHeight - viewport.height > 100
      );
    };
    update();
    window.addEventListener('resize', update);
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);
  return ref;
}
