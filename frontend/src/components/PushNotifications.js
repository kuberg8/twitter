import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import axios from '../utils/axios';
import {
  applicationKey,
  disablePush,
  getPushRegistration,
  pushSupportMessage,
  savePushSubscription,
  setPushRecipient,
} from '../utils/pushNotifications';

export default function PushNotifications({ userId }) {
  const support = pushSupportMessage();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      if (support) {
        setBusy(false);
        return;
      }
      try {
        await setPushRecipient(null);
        const { data } = await axios.get('/push/config');
        if (cancelled) return;
        setConfig(data);
        if (!data.enabled) return;
        const registration = await getPushRegistration();
        const subscription = await registration.pushManager.getSubscription();
        if (
          subscription &&
          new Uint8Array(
            subscription.options.applicationServerKey || []
          ).toString() !== applicationKey(data.publicKey).toString()
        ) {
          await disablePush({ server: false });
          return;
        }
        if (
          subscription &&
          Notification.permission === 'granted' &&
          !cancelled
        ) {
          await savePushSubscription(subscription, userId);
          if (!cancelled) setEnabled(true);
        }
      } catch {
        if (!cancelled)
          setError('Не удалось проверить уведомления. Повторите попытку.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    initialize();
    return () => {
      cancelled = true;
    };
  }, [userId, support]);

  const toggle = async () => {
    setBusy(true);
    setError('');
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
        return;
      }
      if (Notification.permission === 'denied') {
        throw new Error(
          'Уведомления заблокированы. Разрешите их в настройках браузера или телефона.'
        );
      }
      // Request permission within the button gesture, before any network awaits (iOS).
      const permission = await Notification.requestPermission();
      if (permission !== 'granted')
        throw new Error(
          'Разрешение не получено. Уведомления остаются выключенными.'
        );
      const settings = config || (await axios.get('/push/config')).data;
      setConfig(settings);
      if (!settings.enabled)
        throw new Error('Уведомления ещё не настроены на сервере.');
      const registration = await getPushRegistration();
      let subscription = await registration.pushManager.getSubscription();
      const key = applicationKey(settings.publicKey);
      if (
        subscription &&
        new Uint8Array(
          subscription.options.applicationServerKey || []
        ).toString() !== key.toString()
      ) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription =
        subscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      try {
        await savePushSubscription(subscription, userId);
      } catch (err) {
        await disablePush({ server: false });
        throw err;
      }
      setEnabled(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Не удалось включить уведомления.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="push-settings">
      <Button
        startIcon={<NotificationsOutlinedIcon />}
        onClick={toggle}
        disabled={busy || !!support || config?.enabled === false}
        aria-pressed={enabled}
      >
        {busy
          ? 'Проверяем уведомления…'
          : enabled
            ? 'Отключить push-уведомления'
            : 'Включить push-уведомления'}
      </Button>
      <p className="muted" role={error ? 'alert' : 'status'}>
        {error ||
          support ||
          (config?.enabled === false
            ? 'Уведомления ещё не настроены на сервере.'
            : enabled
              ? 'Уведомления включены на этом устройстве, даже когда чат закрыт.'
              : 'Получайте новые сообщения, даже когда чат закрыт.')}
      </p>
    </div>
  );
}
