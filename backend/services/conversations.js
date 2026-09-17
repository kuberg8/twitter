const { Types } = require('mongoose')

const validId = (value) =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
const idVariants = (id) => [String(id), new Types.ObjectId(String(id))]
function conversationFilter(userId, peerId) {
  if (!peerId) return { recipient: null }
  return {
    $or: [
      {
        'user._id': { $in: idVariants(userId) },
        recipient: new Types.ObjectId(peerId),
      },
      {
        'user._id': { $in: idVariants(peerId) },
        recipient: new Types.ObjectId(userId),
      },
    ],
  }
}
function canReceive(post, userId) {
  return (
    !post.recipient ||
    String(post.recipient) === String(userId) ||
    String(post.user?._id) === String(userId)
  )
}
module.exports = { validId, idVariants, conversationFilter, canReceive }
