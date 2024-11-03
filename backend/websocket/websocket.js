const WebSocket = require('ws')
const Post = require('../models/Post')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

module.exports = (server) => {
  const wss = new WebSocket.Server({ server })
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

        let post

        if (parseData.postId) {
          post = await Post.findById(parseData.postId)
          post.message = parseData.message
        } else {
          post = new Post({
            message: parseData.message,
            user,
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
}
