import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PushNotifications from './PushNotifications';
import axios from '../utils/axios';
import {
  disablePush,
  getPushRegistration,
  savePushSubscription,
} from '../utils/pushNotifications';

jest.mock('../utils/axios', () => ({ get: jest.fn() }));
jest.mock('../utils/pushNotifications', () => ({
  applicationKey: () => new Uint8Array([1, 2]),
  disablePush: jest.fn(),
  getPushRegistration: jest.fn(),
  pushSupportMessage: () => '',
  savePushSubscription: jest.fn(),
  setPushRecipient: jest.fn().mockResolvedValue(),
}));
const originalNotification = window.Notification;
let subscribe;
beforeEach(() => {
  jest.clearAllMocks();
  window.Notification = {
    permission: 'default',
    requestPermission: jest.fn().mockResolvedValue('granted'),
  };
  axios.get.mockResolvedValue({ data: { enabled: true, publicKey: 'key' } });
  subscribe = jest.fn().mockResolvedValue({ endpoint: 'device' });
  getPushRegistration.mockResolvedValue({
    pushManager: {
      getSubscription: jest.fn().mockResolvedValue(null),
      subscribe,
    },
  });
  savePushSubscription.mockResolvedValue();
  disablePush.mockResolvedValue();
});
afterAll(() => {
  window.Notification = originalNotification;
});
async function ready() {
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Включить push-уведомления' })
    ).toBeEnabled()
  );
}
test('requests permission only on click and then saves the subscription', async () => {
  render(<PushNotifications userId="u1" />);
  await ready();
  expect(Notification.requestPermission).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Включить push-уведомления' })
  );
  await screen.findByRole('button', { name: 'Отключить push-уведомления' });
  expect(subscribe).toHaveBeenCalledWith({
    userVisibleOnly: true,
    applicationServerKey: new Uint8Array([1, 2]),
  });
  expect(savePushSubscription).toHaveBeenCalledWith(
    { endpoint: 'device' },
    'u1'
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Отключить push-уведомления' })
  );
  await ready();
  expect(disablePush).toHaveBeenCalled();
});
test('does not subscribe when notification permission is denied', async () => {
  Notification.requestPermission.mockResolvedValue('denied');
  render(<PushNotifications userId="u1" />);
  await ready();
  fireEvent.click(
    screen.getByRole('button', { name: 'Включить push-уведомления' })
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Разрешение не получено'
  );
  expect(subscribe).not.toHaveBeenCalled();
});
test('rolls back browser subscription when saving it on the server fails', async () => {
  savePushSubscription.mockRejectedValue(new Error('offline'));
  render(<PushNotifications userId="u1" />);
  await ready();
  fireEvent.click(
    screen.getByRole('button', { name: 'Включить push-уведомления' })
  );
  await screen.findByRole('alert');
  expect(disablePush).toHaveBeenCalledWith({ server: false });
  expect(
    screen.getByRole('button', { name: 'Включить push-уведомления' })
  ).toBeEnabled();
});
