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

test('uses overlay keyboard geometry and restores browser behavior on unmount', () => {
  const keyboard = new EventTarget();
  Object.assign(keyboard, {
    overlaysContent: false,
    boundingRect: { y: window.innerHeight, height: 0 },
  });
  Object.defineProperty(navigator, 'virtualKeyboard', {
    configurable: true,
    value: keyboard,
  });
  const { getByTestId, unmount } = render(<Harness />);
  expect(keyboard.overlaysContent).toBe(true);
  act(() => {
    keyboard.boundingRect = { y: window.innerHeight - 260, height: 260 };
    keyboard.dispatchEvent(new Event('geometrychange'));
  });
  expect(
    getByTestId('viewport').style.getPropertyValue('--messenger-height')
  ).toBe(`${window.innerHeight - 260}px`);
  expect(
    getByTestId('viewport').style.getPropertyValue('--keyboard-overlap')
  ).toBe('260px');
  act(() => {
    keyboard.boundingRect = { y: window.innerHeight, height: 0 };
    keyboard.dispatchEvent(new Event('geometrychange'));
  });
  expect(
    getByTestId('viewport').style.getPropertyValue('--keyboard-overlap')
  ).toBe('0px');
  unmount();
  expect(keyboard.overlaysContent).toBe(false);
  delete navigator.virtualKeyboard;
});
