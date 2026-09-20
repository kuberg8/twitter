import React from 'react';
import { Navigate } from 'react-router-dom';
import { withAuthRedirect } from './withAuthRedirect';

const Page = () => null;
afterEach(() => window.history.replaceState({}, '', '/'));

test.each([
  ['/', false, '/sign-in'],
  [
    '/?chat=507f1f77bcf86cd799439011',
    false,
    '/sign-in?chat=507f1f77bcf86cd799439011',
  ],
  ['/?room=general', false, '/sign-in?room=general'],
  [
    '/sign-in?chat=507f1f77bcf86cd799439011',
    true,
    '/?chat=507f1f77bcf86cd799439011',
  ],
  ['/sign-up', true, '/'],
])('redirects %s with auth=%s to %s', (url, isAuth, target) => {
  window.history.replaceState({}, '', url);
  const result = withAuthRedirect(<Page isAuth={isAuth} />);
  expect(result.type).toBe(Navigate);
  expect(result.props.to).toBe(target);
  expect(result.props.replace).toBe(true);
});

test.each([
  ['/', true],
  ['/sign-in', false],
  ['/sign-up', false],
])('keeps the page at %s with auth=%s', (url, isAuth) => {
  window.history.replaceState({}, '', url);
  const page = <Page isAuth={isAuth} />;
  expect(withAuthRedirect(page)).toBe(page);
});
