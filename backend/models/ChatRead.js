const { Schema, model } = require('mongoose')
const ChatRead = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  peer: { type: String, required: true },
  position: { type: String, required: true },
})
ChatRead.index({ user: 1, peer: 1 }, { unique: true })
module.exports = model('ChatRead', ChatRead)
