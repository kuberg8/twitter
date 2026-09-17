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
