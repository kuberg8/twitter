const jwt = require('jsonwebtoken')

module.exports = async function (req, res, next) {
  if (req.method == 'OPTIONS') {
    next()
  }

  try {
    const [, token] = req.headers.authorization?.split(' ') || []

    if (!token) {
      return res.status(403).json({ message: 'Пользователь не авторизован' })
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decodedData

    next()
  } catch (err) {
    console.log(err)
    res.status(403).json({ message: 'Пользователь не авторизован' })
  }
}
