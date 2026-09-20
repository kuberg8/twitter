const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
const script = fs.readFileSync(
  path.join(__dirname, '../../frontend/public/push-sw.js'),
  'utf8'
)

function worker(userId, windows = []) {
  const handlers = {}
  const notifications = []
  const opened = []
  const scope = 'https://example.com/chat/'
  const self = {
    addEventListener: (event, handler) => {
      handlers[event] = handler
    },
    registration: {
      scope,
      showNotification: async (...args) => notifications.push(args),
    },
    clients: {
      matchAll: async () => windows,
      openWindow: async (url) => opened.push(url),
    },
  }
  vm.runInNewContext(script, {
    self,
    URL,
    caches: {
      open: async () => ({
        match: async () => ({ json: async () => ({ userId }) }),
      }),
    },
  })
  return { handlers, notifications, opened, scope }
}
async function push(instance, recipientId) {
  let pending
  instance.handlers.push({
    data: {
      json: () => ({ title: 'Анна', body: 'Привет', postId: '1', recipientId }),
    },
    waitUntil: (promise) => {
      pending = promise
    },
  })
  await pending
}
test('background worker displays a push without any open windows', async () => {
  const instance = worker('u1')
  await push(instance, 'u1')
  assert.equal(instance.notifications.length, 1)
  assert.equal(instance.notifications[0][0], 'Анна')
  assert.equal(instance.notifications[0][1].body, 'Привет')
})
test('worker ignores signed-out and other-account notifications', async () => {
  for (const id of [null, 'another-user']) {
    const instance = worker(id)
    await push(instance, 'u1')
    assert.equal(instance.notifications.length, 0)
  }
})
test('notification click opens the chat and ignores arbitrary payload URLs', async () => {
  const instance = worker('u1')
  let pending
  instance.handlers.notificationclick({
    notification: { close() {}, data: { url: 'https://evil.test' } },
    waitUntil: (promise) => {
      pending = promise
    },
  })
  await pending
  assert.deepEqual(instance.opened, [`${instance.scope}?room=general`])
})

test('private notification click opens its own conversation', async () => {
  const instance = worker('u1')
  let pending
  const peerId = '507f1f77bcf86cd799439011'
  instance.handlers.notificationclick({
    notification: { close() {}, data: { peerId } },
    waitUntil: (promise) => {
      pending = promise
    },
  })
  await pending
  assert.deepEqual(instance.opened, [`${instance.scope}?chat=${peerId}`])
})

test('click navigates and focuses an existing window', async () => {
  let target
  let focused = false
  const instance = worker('u1', [
    {
      url: 'https://example.com/chat/?chat=old',
      navigate: async (url) => {
        target = url
        return {
          focus: async () => {
            focused = true
          },
        }
      },
    },
  ])
  let pending
  instance.handlers.notificationclick({
    notification: { close() {}, data: {} },
    waitUntil: (promise) => {
      pending = promise
    },
  })
  await pending
  assert.equal(target, `${instance.scope}?room=general`)
  assert.equal(focused, true)
  assert.equal(instance.opened.length, 0)
})
