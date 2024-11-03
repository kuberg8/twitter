const jwt = require('jsonwebtoken')
const User = require('../models/User')

module.exports = async function (req, res, next) {
  if (req.method == 'OPTIONS') {
    next()
  }

  try {
    const [, token] = req.headers.authorization.split(' ')

    if (!token) {
      return res.status(403).json({ message: 'Пользователь не авторизован' })
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decodedData.id)
    if (!user) {
      return res.status(403).json({ message: 'Пользователь не авторизован' })
    }
    req.user = decodedData

    next()
  } catch (err) {
    console.log(err)
    res.status(403).json({ message: 'Пользователь не авторизован' })
  }
}
