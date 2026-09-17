const { test } = require('node:test')
const assert = require('node:assert/strict')
const { makePage, parseCursor } = require('../services/messagePage')
const Post = require('../models/Post')
const controller = require('../controllers/PostController')
const id = (n) => n.toString(16).padStart(24, '0')

test('returns the latest 50 chronologically and uses an ID tie-breaker for equal timestamps', () => {
  const rows = Array.from({ length: 51 }, (_, i) => ({
    _id: id(100 - i),
    created_at: 1000,
    message: String(i),
    user: { _id: id(1), password: 'private', email: 'private' },
  }))
  const page = makePage(rows, 50)
  assert.equal(page.posts.length, 50)
  assert.equal(page.posts[0]._id, id(51))
  assert.equal(page.posts[49]._id, id(100))
  const cursor = parseCursor(page.nextCursor)
  assert.equal(cursor.$or[0].created_at.$lt, 1000)
  assert.equal(String(cursor.$or[1]._id.$lt), id(51))
  assert.equal(page.posts[0].user.password, undefined)
  assert.equal(page.posts[0].user.email, undefined)
  assert.equal(makePage([], 50).nextCursor, null)
})
test('rejects malformed cursors and query objects', () => {
  for (const cursor of [
    { $ne: null },
    'garbage',
    Buffer.from(JSON.stringify({ time: '1000', id: id(1) })).toString(
      'base64url'
    ),
  ])
    assert.throws(() => parseCursor(cursor))
})
test('applies the cursor inside the authenticated conversation and caps database rows', async () => {
  const original = Post.find
  let filter
  Post.find = (value) => {
    filter = value
    return {
      sort(order) {
        assert.deepEqual(order, { created_at: -1, _id: -1 })
        return {
          limit(size) {
            assert.equal(size, 51)
            return { lean: async () => [] }
          },
        }
      },
    }
  }
  try {
    await controller.getPosts(
      {
        user: { id: id(1) },
        query: {
          peer: id(2),
          before: Buffer.from(
            JSON.stringify({ time: 1000, id: id(3) })
          ).toString('base64url'),
        },
      },
      {
        json(page) {
          assert.deepEqual(page, { posts: [], nextCursor: null })
        },
      }
    )
    assert.equal(String(filter.$and[0].$or[0].recipient), id(2))
    assert.equal(String(filter.$and[0].$or[1].recipient), id(1))
    assert.equal(filter.$and[1].$or[0].created_at.$lt, 1000)
  } finally {
    Post.find = original
  }
})
