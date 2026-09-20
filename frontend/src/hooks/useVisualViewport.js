import { useLayoutEffect, useRef } from 'react';

// Browser equivalent of a keyboard dock: use actual visible geometry, without easing.
export default function useVisualViewport() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const viewport = window.visualViewport;
    const keyboard = navigator.virtualKeyboard;
    const previousOverlay = keyboard?.overlaysContent;
    if (keyboard) keyboard.overlaysContent = true;
    let expandedHeight = window.innerHeight;
    let width = window.innerWidth;
    let frame = 0;
    let until = 0;
    const update = () => {
      if (viewport && viewport.scale !== 1) return;
      if (width !== window.innerWidth) {
        width = window.innerWidth;
        expandedHeight = window.innerHeight;
      }
      expandedHeight = Math.max(expandedHeight, window.innerHeight);
      const top = viewport?.offsetTop || 0;
      const visibleHeight = viewport?.height || window.innerHeight;
      const rect = keyboard?.boundingRect;
      const height =
        rect?.height > 0
          ? Math.max(0, Math.min(visibleHeight, rect.y - top))
          : visibleHeight;
      const overlap = Math.max(0, expandedHeight - height);
      // Apply both measurements in the same frame, outside React rendering.
      element.style.setProperty('--messenger-height', `${height}px`);
      element.style.setProperty('--messenger-top', `${top}px`);
      element.style.setProperty('--keyboard-overlap', `${overlap}px`);
      element.classList.toggle('keyboard-open', overlap > 100);
    };
    const tick = () => {
      update();
      frame = performance.now() < until ? requestAnimationFrame(tick) : 0;
    };
    const followAnimation = () => {
      update();
      until = performance.now() + 800;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    update();
    window.addEventListener('resize', update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    keyboard?.addEventListener('geometrychange', update);
    element.addEventListener('focusin', followAnimation);
    element.addEventListener('focusout', followAnimation);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      keyboard?.removeEventListener('geometrychange', update);
      element.removeEventListener('focusin', followAnimation);
      element.removeEventListener('focusout', followAnimation);
      if (keyboard) keyboard.overlaysContent = previousOverlay;
    };
  }, []);
  return ref;
}
