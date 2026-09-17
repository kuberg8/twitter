const webpush = require('web-push')
const Subscription = require('../models/PushSubscription')

function getConfig() {
  const {
    VAPID_PUBLIC_KEY: publicKey,
    VAPID_PRIVATE_KEY: privateKey,
    VAPID_SUBJECT: subject,
  } = process.env
  if (!publicKey || !privateKey || !subject) return null
  return { publicKey, privateKey, subject }
}

// Only browser push providers may be used as outgoing delivery destinations.
function validEndpoint(value) {
  try {
    const url = new URL(value)
    const host = url.hostname
    return (
      typeof value === 'string' &&
      value.length <= 2048 &&
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === '443') &&
      !url.hash &&
      (host === 'fcm.googleapis.com' ||
        host === 'updates.push.services.mozilla.com' ||
        host.endsWith('.push.services.mozilla.com') ||
        host === 'web.push.apple.com' ||
        host.endsWith('.notify.windows.com'))
    )
  } catch {
    return false
  }
}

function validSubscription(subscription) {
  const validKey = (value, size) =>
    typeof value === 'string' &&
    /^[A-Za-z0-9_-]+={0,2}$/.test(value) &&
    Buffer.from(value, 'base64url').length === size
  return (
    validEndpoint(subscription?.endpoint) &&
    validKey(subscription?.keys?.auth, 16) &&
    validKey(subscription?.keys?.p256dh, 65)
  )
}

async function sendPostNotifications(post) {
  const config = getConfig()
  if (!config) return
  try {
    const subscriptions = await Subscription.find({
      user: post.recipient || { $ne: post.user._id },
    }).lean()
    const name =
      [post.user.first_name, post.user.last_name].filter(Boolean).join(' ') ||
      'Новое сообщение'
    // Bound simultaneous requests; delivery failures must not reject message creation.
    for (let i = 0; i < subscriptions.length; i += 10) {
      await Promise.all(
        subscriptions.slice(i, i + 10).map(async (subscription) => {
          if (!validEndpoint(subscription.endpoint)) return
          const payload = JSON.stringify({
            title: name.slice(0, 100),
            body: post.message.slice(0, 160),
            postId: String(post._id),
            peerId: post.recipient ? String(post.user._id) : null,
            recipientId: String(subscription.user),
          })
          try {
            await webpush.sendNotification(
              { endpoint: subscription.endpoint, keys: subscription.keys },
              payload,
              {
                vapidDetails: config,
                TTL: 3600,
                urgency: 'normal',
                timeout: 10000,
              }
            )
          } catch (error) {
            if (error.statusCode === 404 || error.statusCode === 410) {
              await Subscription.deleteOne({
                _id: subscription._id,
                updatedAt: subscription.updatedAt,
              })
            } else {
              // Never log subscription URLs, keys, or message bodies.
              console.error(
                'Push delivery failed:',
                error.statusCode || error.code || 'unknown'
              )
            }
          }
        })
      )
    }
  } catch (error) {
    console.error('Push delivery unavailable:', error.name)
  }
}
module.exports = {
  getConfig,
  validEndpoint,
  validSubscription,
  sendPostNotifications,
}
