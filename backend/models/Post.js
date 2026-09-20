const { Schema, model } = require('mongoose')

const Post = new Schema({
  clientMessageId: { type: String },
  created_at: { type: Number, default: Date.now },
  message: { type: String, required: true },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  hiddenFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  user: { type: Object, ref: 'User' },
})

Post.index({ 'user._id': 1, clientMessageId: 1 }, { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } })

Post.index({ 'user._id': 1, recipient: 1, created_at: -1, _id: -1 })
Post.index({ recipient: 1, created_at: -1, _id: -1 })

module.exports = model('Post', Post)
