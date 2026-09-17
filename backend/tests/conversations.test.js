const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Types } = require('mongoose')
const { conversationFilter, canReceive } = require('../services/conversations')
const Post = require('../models/Post')
const User = require('../models/User')
const controller = require('../controllers/PostController')
const a = '507f1f77bcf86cd799439011'
const b = '507f1f77bcf86cd799439012'
const c = '507f1f77bcf86cd799439013'

test('general history excludes private posts and direct history is scoped in both directions', () => {
  assert.deepEqual(conversationFilter(a), { recipient: null })
  const filter = conversationFilter(a, b)
  assert.equal(filter.$or.length, 2)
  assert.deepEqual(filter.$or[0]['user._id'].$in.map(String), [a, a])
  assert.equal(String(filter.$or[0].recipient), b)
  assert.deepEqual(filter.$or[1]['user._id'].$in.map(String), [b, b])
  assert.equal(String(filter.$or[1].recipient), a)
  assert.equal(
    canReceive({ user: { _id: a }, recipient: new Types.ObjectId(b) }, a),
    true
  )
  assert.equal(canReceive({ user: { _id: a }, recipient: b }, b), true)
  assert.equal(canReceive({ user: { _id: a }, recipient: b }, c), false)
})
test('history uses authenticated identity rather than a forged query user and rejects query objects', async () => {
  const original = Post.find
  let query
  Post.find = (filter) => {
    query = filter
    return { sort: async () => [] }
  }
  try {
    await controller.getPosts(
      { user: { id: c }, query: { peer: b, userId: a } },
      { json() {} }
    )
    assert.deepEqual(query.$or[0]['user._id'].$in.map(String), [c, c])
    assert.equal(String(query.$or[1].recipient), c)
    let status
    query = null
    await controller.getPosts(
      { user: { id: c }, query: { peer: { $ne: null } } },
      {
        status(code) {
          status = code
          return this
        },
        json() {},
      }
    )
    assert.equal(status, 400)
    assert.equal(query, null)
  } finally {
    Post.find = original
  }
})
test('creation validates a private recipient and ignores a forged author', async () => {
  const original = {
    exists: User.exists,
    findById: User.findById,
    save: Post.prototype.save,
  }
  let saved
  User.exists = async () => true
  User.findById = async (id) => {
    assert.equal(id, a)
    return { _id: new Types.ObjectId(a), first_name: 'Анна' }
  }
  Post.prototype.save = async function () {
    saved = this
    return this
  }
  try {
    await controller.createPost(
      {
        user: { id: a },
        body: { message: 'Личное', recipient: b, user: { _id: c } },
        app: { locals: {} },
      },
      {
        json() {},
        status() {
          return this
        },
      }
    )
    assert.equal(String(saved.recipient), b)
    assert.equal(String(saved.user._id), a)
    saved = null
    let status
    await controller.createPost(
      {
        user: { id: a },
        body: { message: 'Личное', recipient: { $ne: null } },
      },
      {
        status(code) {
          status = code
          return this
        },
        json() {},
      }
    )
    assert.equal(status, 400)
    assert.equal(saved, null)
  } finally {
    User.exists = original.exists
    User.findById = original.findById
    Post.prototype.save = original.save
  }
})
