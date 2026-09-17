// Browser/OS accessibility overrides and the browser's own menu remain outside page control.
export function installZoomLock(target = document) {
  const stop = (event) => event.preventDefault();
  const touch = (event) => {
    if (event.touches.length > 1) event.preventDefault();
  };
  const wheel = (event) => {
    if (event.ctrlKey || event.metaKey) event.preventDefault();
  };
  const key = (event) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      ['+', '-', '=', '0', 'Add', 'Subtract'].includes(event.key)
    )
      event.preventDefault();
  };
  const handlers = [
    ['gesturestart', stop],
    ['gesturechange', stop],
    ['gestureend', stop],
    ['touchstart', touch],
    ['touchmove', touch],
    ['wheel', wheel],
    ['keydown', key],
  ];
  handlers.forEach(([name, handler]) =>
    target.addEventListener(name, handler, { passive: false })
  );
  return () =>
    handlers.forEach(([name, handler]) =>
      target.removeEventListener(name, handler)
    );
}
