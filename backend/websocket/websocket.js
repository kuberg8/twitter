const WebSocket = require('ws')
const Post = require('../models/Post')
const User = require('../models/User')

const wss = new WebSocket.Server({ port: 8080 })

wss.on('connection', (ws) => {
  console.log('A new client connected')

  ws.on('error', (error) => {
    console.error('WebSocket error: ', error)
  })

  ws.on('message', async (data, isBinary) => {
    try {
      const message = isBinary ? data : data.toString()
      const parseData = JSON.parse(message)
      const user = await User.findById(parseData.userId)

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
          client.send(JSON.stringify(posts))
        }
      })
    } catch (error) {
      console.error('Error processing WebSocket message: ', error)
    }
  })

  ws.on('close', () => {
    console.log('Client disconnected')
  })
})

module.exports = wss
