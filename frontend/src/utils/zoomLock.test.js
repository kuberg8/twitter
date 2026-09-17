import { installZoomLock } from './zoomLock';
test('blocks zoom gestures while allowing normal scrolling and typing, and cleans up', () => {
  const dispose = installZoomLock();
  const wheel = new WheelEvent('wheel', { ctrlKey: true, cancelable: true });
  document.dispatchEvent(wheel);
  expect(wheel.defaultPrevented).toBe(true);
  const scroll = new WheelEvent('wheel', { cancelable: true });
  document.dispatchEvent(scroll);
  expect(scroll.defaultPrevented).toBe(false);
  const zoom = new KeyboardEvent('keydown', {
    key: '+',
    metaKey: true,
    cancelable: true,
  });
  document.dispatchEvent(zoom);
  expect(zoom.defaultPrevented).toBe(true);
  const typing = new KeyboardEvent('keydown', { key: '+', cancelable: true });
  document.dispatchEvent(typing);
  expect(typing.defaultPrevented).toBe(false);
  dispose();
  const after = new WheelEvent('wheel', { ctrlKey: true, cancelable: true });
  document.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
});
