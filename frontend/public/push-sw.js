/* global self, caches, Response, URL */
const PREFERENCES = 'twitter-push-preferences-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim())
);

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      if (!event.data) return;
      let payload;
      try {
        payload = event.data.json();
      } catch {
        return;
      }
      const cache = await caches.open(PREFERENCES);
      const state = await cache.match(
        new URL('__push-state', self.registration.scope).href
      );
      const preferences = state ? await state.json() : null;
      // Do not expose notifications for an account that signed out or switched devices.
      if (!preferences?.userId || preferences.userId !== payload.recipientId)
        return;
      await self.registration.showNotification(payload.title || 'Общий чат', {
        body: payload.body || 'Новое сообщение',
        icon: new URL('logo192.png', self.registration.scope).href,
        tag: `post-${payload.postId}`,
        data: { peerId: payload.peerId },
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const target = new URL(self.registration.scope);
      const peerId = event.notification.data?.peerId;
      if (typeof peerId === 'string' && /^[a-f0-9]{24}$/i.test(peerId))
        target.searchParams.set('chat', peerId);
      const url = target.href;
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const existing = windows.find((client) =>
        client.url.startsWith(self.registration.scope)
      );
      if (existing) {
        await existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })()
  );
});
