const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const connect = require('../websocket/websocket')

test('socket requires authentication and private updates reach only the two participants', async () => {
  const originalServer = WebSocket.Server
  const originalExists = User.exists
  const originalSecret = process.env.JWT_SECRET
  let server
  WebSocket.Server = class extends EventEmitter {
    constructor() {
      super()
      this.clients = new Set()
      server = this
    }
  }
  User.exists = async () => true
  process.env.JWT_SECRET = 'unit-test-secret'
  const ids = [
    '507f1f77bcf86cd799439011',
    '507f1f77bcf86cd799439012',
    '507f1f77bcf86cd799439013',
  ]
  const clients = []
  const addClient = () => {
    const client = new EventEmitter()
    client.readyState = WebSocket.OPEN
    client.received = []
    client.send = (data) => client.received.push(JSON.parse(data))
    client.close = (code) => {
      client.closeCode = code
      client.readyState = WebSocket.CLOSED
      client.emit('close')
    }
    clients.push(client)
    server.clients.add(client)
    server.emit('connection', client)
    return client
  }
  try {
    const broadcast = connect({})
    for (const id of ids) {
      const client = addClient()
      await client.listeners('message')[0](
        Buffer.from(
          JSON.stringify({
            type: 'auth',
            token: jwt.sign({ id }, process.env.JWT_SECRET, {
              expiresIn: '1h',
            }),
          })
        )
      )
      assert.equal(client.received[0].type, 'ready')
      client.received = []
    }
    const anonymous = addClient()
    const event = (client, payload) =>
      client.listeners('message')[0](Buffer.from(JSON.stringify(payload)))
    await event(clients[0], { type: 'presence', active: true })
    assert.deepEqual(
      clients[1].received.find((e) => e.type === 'presence').users,
      [ids[0]]
    )
    await event(clients[0], { type: 'typing', peerId: ids[1], active: true })
    assert.equal(
      clients[1].received.some(
        (e) => e.type === 'typing' && e.active && e.userId === ids[0]
      ),
      true
    )
    assert.equal(
      clients[2].received.some((e) => e.type === 'typing'),
      false
    )
    await event(clients[0], { type: 'presence', active: false })
    assert.equal(
      clients[1].received.filter((e) => e.type === 'typing').at(-1).active,
      false
    )
    const secondTab = addClient()
    await event(secondTab, {
      type: 'auth',
      token: jwt.sign({ id: ids[0] }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      }),
    })
    await event(secondTab, { type: 'presence', active: true })
    await event(clients[0], { type: 'presence', active: true })
    await event(secondTab, { type: 'presence', active: false })
    assert.deepEqual(
      clients[1].received.filter((e) => e.type === 'presence').at(-1).users,
      [ids[0]]
    )
    // An idle second tab must not cancel typing from the first tab.
    await event(clients[0], { type: 'typing', peerId: ids[1], active: true })
    await event(secondTab, { type: 'typing', peerId: ids[1], active: false })
    assert.equal(
      clients[1].received.filter((e) => e.type === 'typing').at(-1).active,
      true
    )
    await event(clients[0], { type: 'typing', peerId: ids[1], active: false })
    assert.equal(
      clients[1].received.filter((e) => e.type === 'typing').at(-1).active,
      false
    )
    clients.forEach((client) => {
      client.received = []
    })
    const post = {
      user: { _id: ids[0] },
      recipient: ids[1],
      message: 'Private text',
    }
    broadcast(post)
    assert.deepEqual(clients[0].received, [
      {
        type: 'posts:changed',
        peerId: ids[1],
        action: 'updated',
        post: {
          message: 'Private text',
          recipient: ids[1],
          user: { _id: ids[0], first_name: '', last_name: '' },
        },
      },
    ])
    assert.deepEqual(clients[1].received, [
      {
        type: 'posts:changed',
        peerId: ids[0],
        action: 'updated',
        post: {
          message: 'Private text',
          recipient: ids[1],
          user: { _id: ids[0], first_name: '', last_name: '' },
        },
      },
    ])
    assert.equal(clients[2].received.length, 0)
    assert.equal(anonymous.received.length, 0)
    clients[0].expiresAt = 0
    broadcast(post)
    assert.equal(clients[0].closeCode, 4001)
    await anonymous.listeners('message')[0](
      Buffer.from(JSON.stringify({ type: 'auth', token: 'invalid' }))
    )
    assert.equal(anonymous.closeCode, 4001)
  } finally {
    clients.forEach((client) => client.close())
    WebSocket.Server = originalServer
    User.exists = originalExists
    if (originalSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originalSecret
  }
})
