const { publicPost } = require('../services/messagePage')
const WebSocket = require('ws')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { canReceive, validId } = require('../services/conversations')

module.exports = (server) => {
  const wss = new WebSocket.Server({ server, maxPayload: 16384 })
  const authorized = (ws) =>
    ws.readyState === WebSocket.OPEN && ws.userId && ws.expiresAt > Date.now()
  const send = (ws, event) => {
    if (authorized(ws)) ws.send(JSON.stringify(event))
  }
  let lastPresence = '[]'
  const presence = () => {
    const users = [
      ...new Set(
        [...wss.clients]
          .filter(
            (ws) => authorized(ws) && ws.active && Date.now() - ws.seen < 45000
          )
          .map((ws) => ws.userId)
      ),
    ].sort()
    const encoded = JSON.stringify(users)
    if (encoded !== lastPresence) {
      lastPresence = encoded
      wss.clients.forEach((ws) => send(ws, { type: 'presence', users }))
    }
    return users
  }
  const typing = (ws, active) => {
    if (ws.typingPeer === undefined) return
    wss.clients.forEach((client) => {
      if (
        client.userId !== ws.userId &&
        (!ws.typingPeer || client.userId === ws.typingPeer)
      )
        send(client, {
          type: 'typing',
          userId: ws.userId,
          peerId: ws.typingPeer ? ws.userId : '',
          active,
        })
    })
    if (!active) ws.typingPeer = undefined
  }
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.userId) return
      if (ws.expiresAt <= Date.now()) ws.close(4001, 'Session expired')
      else if (Date.now() - ws.seen >= 45000) {
        ws.active = false
        typing(ws, false)
      }
      if (ws.typingUntil <= Date.now()) typing(ws, false)
    })
    presence()
  }, 5000)
  heartbeat.unref?.()
  wss.on('close', () => clearInterval(heartbeat))
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
  broadcastPosts.clearChat = (userId, peerId) => {
    wss.clients.forEach((ws) => {
      if (ws.userId === String(userId))
        send(ws, { type: 'chat:deleted', peerId })
    })
  }
  wss.on('connection', (ws) => {
    const deadline = setTimeout(
      () => ws.close(4001, 'Authentication required'),
      10000
    )
    ws.on('close', () => {
      clearTimeout(deadline)
      ws.active = false
      typing(ws, false)
      presence()
    })
    ws.on('error', () => {})
    ws.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString())
        if (payload.type !== 'auth' && authorized(ws)) {
          if (payload.type === 'presence') {
            ws.seen = Date.now()
            ws.active = payload.active === true
            if (!ws.active) typing(ws, false)
            presence()
            send(ws, { type: 'heartbeat' })
            return
          }
          if (payload.type === 'typing') {
            const peer = payload.peerId || ''
            if (
              typeof peer !== 'string' ||
              (peer && (!validId(peer) || peer === ws.userId))
            )
              return
            if (payload.active && (!ws.active || Date.now() - ws.seen >= 45000))
              return
            if (ws.typingPeer !== undefined && ws.typingPeer !== peer)
              typing(ws, false)
            if (
              payload.active &&
              ws.typingPeer === peer &&
              Date.now() - ws.lastTyping < 1000
            )
              return
            ws.lastTyping = Date.now()
            ws.typingPeer = peer
            ws.typingUntil = Date.now() + 5000
            typing(ws, payload.active === true)
            return
          }
        }
        if (payload.type !== 'auth' || ws.userId) {
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
        ws.seen = Date.now()
        ws.active = false
        ws.send(JSON.stringify({ type: 'ready', users: presence() }))
      } catch {
        ws.close(4001, 'Invalid session')
      }
    })
  })
  return broadcastPosts
}
