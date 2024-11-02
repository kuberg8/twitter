const { Schema, model } = require('mongoose')

const Post = new Schema({
  created_at: { type: Number, default: Date.now() },
  message: { type: String, required: true },
  user: { type: Object, ref: 'User' },
})

module.exports = model('Post', Post)
