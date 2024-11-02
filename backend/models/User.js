const { Schema, model } = require('mongoose')

const User = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
})

module.exports = model('User', User)
