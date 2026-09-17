const { test } = require('node:test')
const assert = require('node:assert/strict')
const webpush = require('web-push')
const Subscription = require('../models/PushSubscription')
const {
  validSubscription,
  validEndpoint,
  sendPostNotifications,
} = require('../services/push')

test('accepts browser push providers but rejects private or spoofed destinations', () => {
  for (const url of [
    'https://fcm.googleapis.com/fcm/send/abc',
    'https://web.push.apple.com/abc',
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
  ])
    assert.equal(validEndpoint(url), true)
  for (const url of [
    'http://fcm.googleapis.com/a',
    'https://127.0.0.1/a',
    'https://fcm.googleapis.com.evil.test/a',
    'https://user:pass@fcm.googleapis.com/a',
    'https://fcm.googleapis.com:8443/a',
  ])
    assert.equal(validEndpoint(url), false)
  assert.equal(
    validSubscription({
      endpoint: 'https://fcm.googleapis.com/a',
      keys: {
        auth: Buffer.alloc(16).toString('base64url'),
        p256dh: Buffer.alloc(65).toString('base64url'),
      },
    }),
    true
  )
  assert.equal(
    validSubscription({
      endpoint: 'https://fcm.googleapis.com/a',
      keys: { auth: 'bad', p256dh: 'bad' },
    }),
    false
  )
})

test('excludes the sender, sends a bounded preview, removes expired subscriptions and isolates failures', async () => {
  const original = {
    find: Subscription.find,
    deleteOne: Subscription.deleteOne,
    send: webpush.sendNotification,
  }
  const savedEnv = { ...process.env }
  Object.assign(process.env, {
    VAPID_PUBLIC_KEY: 'public',
    VAPID_PRIVATE_KEY: 'private',
    VAPID_SUBJECT: 'https://example.com',
  })
  const rows = ['ok', 'expired', 'unavailable'].map((id) => ({
    _id: id,
    user: 'recipient',
    endpoint: `https://fcm.googleapis.com/${id}`,
    keys: {},
    updatedAt: 123,
  }))
  const deleted = []
  const payloads = []
  Subscription.find = (filter) => {
    assert.equal(filter.user.$ne, 'sender')
    return { lean: async () => rows }
  }
  Subscription.deleteOne = async (query) => deleted.push(query)
  webpush.sendNotification = async (sub, payload, options) => {
    payloads.push(JSON.parse(payload))
    assert.equal(options.vapidDetails.privateKey, 'private')
    assert.equal(options.timeout, 10000)
    if (sub.endpoint.endsWith('expired')) throw { statusCode: 410 }
    if (sub.endpoint.endsWith('unavailable')) throw { statusCode: 503 }
  }
  try {
    await sendPostNotifications({
      _id: 'post',
      user: { _id: 'sender', first_name: 'Анна', last_name: 'Петрова' },
      message: 'a'.repeat(1000),
    })
    assert.equal(payloads.length, 3)
    assert.equal(payloads[0].title, 'Анна Петрова')
    assert.equal(payloads[0].body.length, 160)
    assert.equal(payloads[0].recipientId, 'recipient')
    assert.deepEqual(deleted, [{ _id: 'expired', updatedAt: 123 }])
  } finally {
    Subscription.find = original.find
    Subscription.deleteOne = original.deleteOne
    webpush.sendNotification = original.send
    for (const key of [
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'VAPID_SUBJECT',
    ]) {
      if (savedEnv[key] === undefined) delete process.env[key]
      else process.env[key] = savedEnv[key]
    }
  }
})

test('subscriptions can only be removed by their authenticated owner', async () => {
  const router = require('../routes/pushRoutes')
  const handler = router.stack.find((entry) => entry.route?.methods.delete)
    .route.stack[0].handle
  const original = Subscription.deleteOne
  let query
  Subscription.deleteOne = async (filter) => {
    query = filter
  }
  try {
    await handler(
      {
        user: { id: 'owner' },
        body: { endpoint: 'https://fcm.googleapis.com/device', user: 'forged' },
      },
      { sendStatus: (status) => assert.equal(status, 204) }
    )
    assert.deepEqual(query, {
      endpoint: 'https://fcm.googleapis.com/device',
      user: 'owner',
    })
  } finally {
    Subscription.deleteOne = original
  }
})

test('private notifications target only the recipient and link back to the sender', async () => {
  const originalFind = Subscription.find
  const originalSend = webpush.sendNotification
  const env = { ...process.env }
  Object.assign(process.env, {
    VAPID_PUBLIC_KEY: 'public',
    VAPID_PRIVATE_KEY: 'private',
    VAPID_SUBJECT: 'https://example.com',
  })
  let query
  let payload
  Subscription.find = (filter) => {
    query = filter
    return {
      lean: async () => [
        {
          user: 'recipient',
          endpoint: 'https://fcm.googleapis.com/device',
          keys: {},
        },
      ],
    }
  }
  webpush.sendNotification = async (subscription, message) => {
    payload = JSON.parse(message)
  }
  try {
    await sendPostNotifications({
      _id: 'post',
      recipient: 'recipient',
      user: { _id: 'sender', first_name: 'Автор' },
      message: 'Личное',
    })
    assert.deepEqual(query, { user: 'recipient' })
    assert.equal(payload.recipientId, 'recipient')
    assert.equal(payload.peerId, 'sender')
  } finally {
    Subscription.find = originalFind
    webpush.sendNotification = originalSend
    for (const key of [
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'VAPID_SUBJECT',
    ]) {
      if (env[key] === undefined) delete process.env[key]
      else process.env[key] = env[key]
    }
  }
})
