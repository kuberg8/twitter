const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Types } = require('mongoose')
const { readPosition, unreadFilter } = require('../services/unread')
const Post = require('../models/Post')
const ChatRead = require('../models/ChatRead')
const router = require('../routes/chatRoutes')
const a = '507f1f77bcf86cd799439011'
const b = '507f1f77bcf86cd799439012'
const messageId = '507f1f77bcf86cd799439099'
const handler = router.stack.find(
  (layer) => layer.route?.path === '/:id/read' && layer.route.methods.post
).route.stack[0].handle

test('unread counts exclude own and hidden messages and use an exact timestamp/id boundary', () => {
  const position = readPosition({ _id: messageId, created_at: 1700000000000 })
  assert.ok(
    position <
      readPosition({
        _id: '507f1f77bcf86cd799439100',
        created_at: 1700000000000,
      })
  )
  assert.ok(position < readPosition({ _id: a, created_at: 1700000000001 }))
  const filter = unreadFilter(a, [
    { peer: b, position },
    { peer: 'general', position },
  ])
  assert.equal(String(filter.hiddenFor.$ne), a)
  assert.deepEqual(filter['user._id'].$nin.map(String), [a, a])
  assert.equal(String(filter.$or[1].recipient), a)
  assert.equal(filter.$nor[0].$or[1].created_at, 1700000000000)
  assert.equal(String(filter.$nor[0].$or[1]._id.$lte), messageId)
  assert.deepEqual(filter.$nor[0]['user._id'].$in.map(String), [b, b])
  assert.equal(filter.$nor[1].recipient, null)
})

test('read watermark is based on an accessible stored message and only moves forward', async () => {
  const originalFind = Post.findOne
  const originalUpdate = ChatRead.updateOne
  let filter, key, update, notified, status
  Post.findOne = (query) => {
    filter = query
    return {
      select: () => ({
        lean: async () => ({
          _id: new Types.ObjectId(messageId),
          created_at: 1700000000000,
        }),
      }),
    }
  }
  ChatRead.updateOne = async (query, change) => {
    key = query
    update = change
    return { modifiedCount: 1 }
  }
  const broadcastPosts = Object.assign(() => {}, {
    unreadChanged: (id) => {
      notified = id
    },
  })
  try {
    await handler(
      {
        user: { id: a },
        params: { id: b },
        body: { messageId, userId: b, position: 'forged' },
        app: { locals: { broadcastPosts } },
      },
      {
        sendStatus: (code) => {
          status = code
        },
      }
    )
    assert.equal(status, 204)
    assert.equal(filter._id, messageId)
    assert.equal(String(filter.hiddenFor.$ne), a)
    assert.equal(String(filter.$or[0].recipient), b)
    assert.equal(String(filter.$or[1].recipient), a)
    assert.deepEqual(key, { user: a, peer: b })
    assert.deepEqual(update, {
      $max: {
        position: readPosition({ _id: messageId, created_at: 1700000000000 }),
      },
    })
    assert.equal(notified, a)
    Post.findOne = () => ({ select: () => ({ lean: async () => null }) })
    notified = null
    await handler(
      { user: { id: a }, params: { id: b }, body: { messageId } },
      {
        sendStatus: (code) => {
          status = code
        },
      }
    )
    assert.equal(status, 404)
    assert.equal(notified, null)
    await handler(
      {
        user: { id: a },
        params: { id: b },
        body: { messageId: { $ne: null } },
      },
      {
        sendStatus: (code) => {
          status = code
        },
      }
    )
    assert.equal(status, 400)
  } finally {
    Post.findOne = originalFind
    ChatRead.updateOne = originalUpdate
  }
})

test('receipt lookup exposes only the other participant’s read position for the authenticated conversation', async () => {
  const get = router.stack.find(
    (layer) => layer.route?.path === '/:id/read' && layer.route.methods.get
  ).route.stack[0].handle
  const original = ChatRead.findOne
  let filter, response
  ChatRead.findOne = (query) => {
    filter = query
    return {
      select: () => ({ lean: async () => ({ position: 'stored-position' }) }),
    }
  }
  try {
    await get(
      {
        user: { id: a },
        params: { id: b },
        query: { userId: b, peer: 'forged' },
      },
      {
        json: (value) => {
          response = value
        },
      }
    )
    assert.deepEqual(filter, { user: b, peer: a })
    assert.deepEqual(response, { position: 'stored-position' })
    filter = null
    await get(
      { user: { id: a }, params: { id: 'general' } },
      { sendStatus: (code) => assert.equal(code, 400) }
    )
    assert.equal(filter, null)
  } finally {
    ChatRead.findOne = original
  }
})
