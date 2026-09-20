const { Types } = require('mongoose')
const { validId } = require('./conversations')
function publicPost(post) {
  return {
    _id: post._id,
    ...(post.clientMessageId ? { clientMessageId: post.clientMessageId } : {}),
    message: post.message,
    created_at: post.created_at,
    recipient: post.recipient || null,
    user: {
      _id: post.user?._id || post.user,
      first_name: post.user?.first_name || '',
      last_name: post.user?.last_name || '',
    },
  }
}
function parseCursor(cursor) {
  if (typeof cursor !== 'string' || cursor.length > 200)
    throw new Error('Invalid cursor')
  const value = JSON.parse(Buffer.from(cursor, 'base64url').toString())
  if (!validId(value.id) || !Number.isSafeInteger(value.time) || value.time < 0)
    throw new Error('Invalid cursor')
  return {
    $or: [
      { created_at: { $lt: value.time } },
      { created_at: value.time, _id: { $lt: new Types.ObjectId(value.id) } },
    ],
  }
}
function makePage(rows, limit) {
  const hasMore = rows.length > limit
  const posts = rows.slice(0, limit).reverse().map(publicPost)
  const oldest = posts[0]
  return {
    posts,
    nextCursor: hasMore
      ? Buffer.from(
          JSON.stringify({ time: oldest.created_at, id: String(oldest._id) })
        ).toString('base64url')
      : null,
  }
}
module.exports = { parseCursor, makePage, publicPost }
