const { publicPost } = require('../services/messagePage')
const WebSocket = require('ws')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { canReceive, validId } = require('../services/conversations')

module.exports = (server) => {
  const wss = new WebSocket.Server({ server, maxPayload: 16384 })
  // Deliver one sanitized change only to authenticated conversation participants.
  const broadcastPosts = (post, action = 'updated') => {
    if (!post) return
    wss.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN || !client.userId) return
      if (client.expiresAt <= Date.now()) {
        client.close(4001, 'Session expired')
        return
      }
      if (canReceive(post, client.userId)) {
        client.send(
          JSON.stringify({
            type: 'posts:changed',
            action,
            post: publicPost(post),
            peerId: post.recipient
              ? String(post.user._id) === client.userId
                ? String(post.recipient)
                : String(post.user._id)
              : null,
          })
        )
      }
    })
  }
  wss.on('connection', (ws) => {
    const deadline = setTimeout(
      () => ws.close(4001, 'Authentication required'),
      10000
    )
    ws.on('close', () => clearTimeout(deadline))
    ws.on('error', () => {})
    ws.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString())
        if (payload.type !== 'auth') {
          ws.send(
            JSON.stringify({ error: 'Используйте API для отправки сообщений.' })
          )
          return
        }
        const decoded = jwt.verify(payload.token, process.env.JWT_SECRET)
        if (
          !validId(decoded.id) ||
          !decoded.exp ||
          !(await User.exists({ _id: decoded.id }))
        ) {
          ws.close(4001, 'Invalid session')
          return
        }
        ws.userId = String(decoded.id)
        ws.expiresAt = decoded.exp * 1000
        clearTimeout(deadline)
        ws.send(JSON.stringify({ type: 'ready' }))
      } catch {
        ws.close(4001, 'Invalid session')
      }
    })
  })
  return broadcastPosts
}
