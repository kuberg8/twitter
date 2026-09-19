import React from 'react';
import { act, render } from '@testing-library/react';
import useVisualViewport from './useVisualViewport';
function Harness() {
  const ref = useVisualViewport();
  return <div ref={ref} data-testid="viewport" />;
}
test('follows keyboard resize and pan, restores height, and removes listeners', () => {
  const viewport = new EventTarget();
  Object.assign(viewport, {
    height: window.innerHeight,
    offsetTop: 0,
    scale: 1,
  });
  const previous = window.visualViewport;
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  });
  const remove = jest.spyOn(viewport, 'removeEventListener');
  const { getByTestId, unmount } = render(<Harness />);
  const element = getByTestId('viewport');
  act(() => {
    viewport.height = window.innerHeight - 300;
    viewport.offsetTop = 30;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(element.style.getPropertyValue('--messenger-height')).toBe(
    `${viewport.height}px`
  );
  expect(element.style.getPropertyValue('--messenger-top')).toBe('30px');
  expect(element.classList.contains('keyboard-open')).toBe(true);
  act(() => {
    viewport.height = window.innerHeight;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(element.classList.contains('keyboard-open')).toBe(false);
  unmount();
  expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: previous,
  });
});
