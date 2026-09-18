import axios from './axios';

export const getPushPreference = (userId) => {
  const value = localStorage.getItem(`push-enabled:${userId}`);
  return value === null ? null : value === 'true';
};
export async function getPushRecipient() {
  const cache = await caches.open(PUSH_CACHE);
  const response = await cache.match(stateUrl);
  return response ? (await response.json()).userId : null;
}
export const setPushPreference = (userId, enabled) =>
  localStorage.setItem(`push-enabled:${userId}`, String(enabled));

export const PUSH_CACHE = 'twitter-push-preferences-v1';
const base = new URL(
  `${process.env.PUBLIC_URL || ''}/`,
  window.location.origin
);
const stateUrl = new URL('__push-state', base).href;

export function pushSupportMessage() {
  if (!window.isSecureContext) return 'Для уведомлений откройте чат по HTTPS.';
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    navigator.standalone;
  if (ios && !standalone)
    return 'На iPhone: «Поделиться» → «На экран Домой». Затем откройте чат с этой иконки.';
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return 'Этот браузер не поддерживает фоновые уведомления.';
  }
  return '';
}

export async function setPushRecipient(userId) {
  const cache = await caches.open(PUSH_CACHE);
  if (userId)
    await cache.put(stateUrl, new Response(JSON.stringify({ userId })));
  else await cache.delete(stateUrl);
}

export async function getPushRegistration() {
  const registration = await navigator.serviceWorker.register(
    new URL('push-sw.js', base).href,
    { scope: base.pathname }
  );
  if (registration.active) return registration;
  const worker = registration.installing || registration.waiting;
  if (!worker)
    throw new Error('Не удалось запустить уведомления. Обновите страницу.');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Уведомления не запустились. Попробуйте ещё раз.'));
    }, 15000);
    const cleanup = () => {
      clearTimeout(timeout);
      worker.removeEventListener('statechange', change);
    };
    const change = () => {
      if (worker.state === 'activated') {
        cleanup();
        resolve();
      } else if (worker.state === 'redundant') {
        cleanup();
        reject(new Error('Обновите страницу и повторите попытку.'));
      }
    };
    worker.addEventListener('statechange', change);
    change();
  });
  return registration;
}

export function applicationKey(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(
    atob((value + padding).replace(/-/g, '+').replace(/_/g, '/')),
    (char) => char.charCodeAt(0)
  );
}

export async function savePushSubscription(subscription, userId) {
  const sameUser = () => localStorage.getItem('userId') === String(userId);
  if (!sameUser())
    throw new Error('Аккаунт изменился. Повторите включение уведомлений.');
  await axios.post('/push/subscriptions', subscription.toJSON());
  if (!sameUser())
    throw new Error('Аккаунт изменился. Повторите включение уведомлений.');
  await setPushRecipient(userId);
}

export async function disablePush({ server = true } = {}) {
  if (!('serviceWorker' in navigator)) return;
  // Persist the opt-out first, including when offline or the session has expired.
  if ('caches' in window) await setPushRecipient(null);
  const registration = await navigator.serviceWorker.getRegistration(base.href);
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  const unsubscribed = await subscription.unsubscribe();
  if (!unsubscribed)
    throw new Error('Не удалось отключить подписку. Попробуйте ещё раз.');
  if (server) {
    // Browser unsubscription already stops delivery; the server also removes 410 endpoints.
    await axios
      .delete('/push/subscriptions', { data: { endpoint } })
      .catch(() => {});
  }
}
