const WebSocket = require('ws')
const Post = require('../models/Post')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

module.exports = (server) => {
  const wss = new WebSocket.Server({ server })
  const broadcastPosts = async () => {
    try {
      const posts = await Post.find()
      const payload = JSON.stringify({ posts })
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(payload)
      })
    } catch (error) {
      console.error('Broadcast failed:', error)
    }
  }
  wss.on('connection', (ws) => {
    console.log('A new client connected')

    ws.on('error', (error) => {
      console.error('WebSocket error: ', error)
    })

    ws.on('message', async (data, isBinary) => {
      try {
        const message = isBinary ? data : data.toString()
        const parseData = JSON.parse(message)

        const token = parseData.token
        if (!token) {
          return ws.send(JSON.stringify({ error: 'Токен не предоставлен' }))
        }

        let user
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          user = await User.findById(decoded.id)
        } catch (err) {
          return ws.send(JSON.stringify({ error: 'Неверный токен' }))
        }

        if (!user) {
          return ws.send(JSON.stringify({ error: 'Пользователь не найден' }))
        }

        if (
          typeof parseData.message !== 'string' ||
          !parseData.message.trim() ||
          parseData.message.length > 5000
        ) {
          return ws.send(
            JSON.stringify({
              error: 'Введите сообщение длиной до 5000 символов',
            })
          )
        }
        parseData.message = parseData.message.trim()
        let post

        if (parseData.postId) {
          post = await Post.findById(parseData.postId)
          if (!post || String(post.user?._id) !== String(user._id)) {
            return ws.send(
              JSON.stringify({
                error: 'Сообщение недоступно для редактирования',
              })
            )
          }
          post.message = parseData.message
        } else {
          post = new Post({
            message: parseData.message,
            user: {
              _id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
            },
          })
        }

        await post.save()
        const posts = await Post.find()

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ posts }))
          }
        })
      } catch (error) {
        console.error('Error processing WebSocket message: ', error)
        ws.send(JSON.stringify({ error: 'Ошибка обработки сообщения' }))
      }
    })

    ws.on('close', () => {
      console.log('Client disconnected')
    })
  })
  return broadcastPosts
}
