import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeSettingsProvider from './ThemeContext';
import ThemeChoice from '../components/ThemeChoice';
let change;
const original = window.matchMedia;
beforeEach(() => {
  localStorage.clear();
  window.matchMedia = jest.fn(() => ({
    matches: true,
    addEventListener: (name, listener) => {
      change = listener;
    },
    removeEventListener: jest.fn(),
  }));
});
afterAll(() => {
  window.matchMedia = original;
});
test('follows system changes and persists an explicit override', () => {
  render(
    <ThemeSettingsProvider>
      <ThemeChoice />
    </ThemeSettingsProvider>
  );
  expect(document.documentElement.dataset.theme).toBe('dark');
  act(() => change({ matches: false }));
  expect(document.documentElement.dataset.theme).toBe('light');
  fireEvent.change(screen.getByLabelText('Тема оформления'), {
    target: { value: 'dark' },
  });
  expect(localStorage.getItem('twitter-theme')).toBe('dark');
  act(() => change({ matches: false }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  fireEvent.change(screen.getByLabelText('Тема оформления'), {
    target: { value: 'system' },
  });
  expect(document.documentElement.dataset.theme).toBe('light');
});
test('restores a saved choice and synchronizes preference changes across tabs', () => {
  localStorage.setItem('twitter-theme', 'light');
  render(
    <ThemeSettingsProvider>
      <ThemeChoice />
    </ThemeSettingsProvider>
  );
  expect(document.documentElement.dataset.theme).toBe('light');
  localStorage.setItem('twitter-theme', 'dark');
  fireEvent(window, new StorageEvent('storage', { key: 'twitter-theme' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(screen.getByLabelText('Тема оформления')).toHaveValue('dark');
});
