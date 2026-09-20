const { test } = require('node:test')
const assert = require('node:assert/strict')
const Post = require('../models/Post')
const controller = require('../controllers/PostController')
const owner = '507f1f77bcf86cd799439011'

for (const operation of ['update', 'delete']) {
  test(`${operation} restricts the database mutation to the authenticated owner`, async () => {
    const method = operation === 'update' ? 'findOneAndUpdate' : 'findOneAndDelete'
    const original = Post[method]
    let query
    let broadcast = false
    Post[method] = async (filter) => { query = filter; return null }
    const req = { params: { id: 'post-id' }, body: { message: 'Hello' }, user: { id: owner }, app: { locals: { broadcastPosts: () => { broadcast = true } } } }
    let status
    const res = { status(code) { status = code; return this }, json() {} }
    try {
      await controller[`${operation}Post`](req, res)
      assert.equal(query._id, 'post-id')
      assert.deepEqual(query['user._id'].$in.map(String), [owner, owner])
      assert.equal(status, 400)
      assert.equal(broadcast, false)
    } finally { Post[method] = original }
  })
}
test('message timestamp is evaluated when the message is created', () => {
  assert.equal(Post.schema.path('created_at').defaultValue, Date.now)
})

test('idempotent send returns the existing post without broadcasting again', async () => {
  const find = Post.findOne
  const existing = { _id: 'saved', clientMessageId: 'request-123', message: 'Hello', recipient: null, user: { _id: owner } }
  let query, payload, broadcasts = 0
  Post.findOne = async filter => { query = filter; return existing }
  try {
    await controller.createPost({ body: { message: 'Hello', clientMessageId: 'request-123' }, user: { id: owner },
      app: { locals: { broadcastPosts: () => broadcasts++ } } }, { json(value) { payload = value }, status() { return this } })
    assert.equal(String(query['user._id']), owner)
    assert.equal(query.clientMessageId, 'request-123')
    assert.equal(payload.post._id, 'saved')
    assert.equal(payload.post.clientMessageId, 'request-123')
    assert.equal(broadcasts, 0)
  } finally { Post.findOne = find }
})

test('rejects reused request ids with different message content', async () => {
  const find = Post.findOne
  Post.findOne = async () => ({ message: 'Original', recipient: null })
  let status
  try {
    await controller.createPost({ body: { message: 'Changed', clientMessageId: 'request-123' }, user: { id: owner } },
      { status(code) { status = code; return this }, json() {} })
    assert.equal(status, 409)
  } finally { Post.findOne = find }
})

test('concurrent retries recover the winning message after a unique-index conflict', async () => {
  const User = require('../models/User')
  const find = Post.findOne, save = Post.prototype.save, findUser = User.findById
  const existing = { _id: 'winner', clientMessageId: 'request-123', message: 'Hello', recipient: null, user: { _id: owner } }
  let reads = 0, payload, broadcasts = 0
  Post.findOne = async () => ++reads === 1 ? null : existing
  User.findById = async () => ({ _id: owner, first_name: 'Alice' })
  Post.prototype.save = async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }) }
  try {
    await controller.createPost({ body: { message: 'Hello', clientMessageId: 'request-123' }, user: { id: owner },
      app: { locals: { broadcastPosts: () => broadcasts++ } } }, { json(value) { payload = value }, status() { return this } })
    assert.equal(payload.post._id, 'winner')
    assert.equal(reads, 2)
    assert.equal(broadcasts, 0)
    assert.ok(Post.schema.indexes().some(([keys, options]) => keys.clientMessageId && options.unique && options.partialFilterExpression))
  } finally { Post.findOne = find; Post.prototype.save = save; User.findById = findUser }
})
