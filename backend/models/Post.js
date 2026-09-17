const { Schema, model } = require('mongoose')

const Post = new Schema({
  created_at: { type: Number, default: Date.now },
  message: { type: String, required: true },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  user: { type: Object, ref: 'User' },
})

Post.index({ 'user._id': 1, recipient: 1, created_at: -1 })

module.exports = model('Post', Post)
