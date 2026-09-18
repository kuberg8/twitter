const { Types } = require('mongoose')
const { idVariants } = require('./conversations')

// Lexicographic order matches the history order, including equal timestamps.
const readPosition = (post) =>
  `${String(post.created_at).padStart(16, '0')}:${post._id}`
function unreadFilter(userId, states) {
  const filter = {
    hiddenFor: { $ne: new Types.ObjectId(userId) },
    'user._id': { $nin: idVariants(userId) },
    $or: [{ recipient: null }, { recipient: new Types.ObjectId(userId) }],
  }
  if (states.length)
    filter.$nor = states.map((state) => {
      const [time, id] = state.position.split(':')
      return {
        ...(state.peer === 'general'
          ? { recipient: null }
          : {
              recipient: new Types.ObjectId(userId),
              'user._id': { $in: idVariants(state.peer) },
            }),
        $or: [
          { created_at: { $lt: Number(time) } },
          { created_at: Number(time), _id: { $lte: new Types.ObjectId(id) } },
        ],
      }
    })
  return filter
}
module.exports = { readPosition, unreadFilter }
