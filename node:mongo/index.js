const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const WebSocket = require('ws')

// swagger
const swaggerUi = require('swagger-ui-express')
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerDocument = require('./swagger.json')
const swaggerDocs = swaggerJsDoc(swaggerDocument)

// routes
const authRoutes = require('./routes/authRoutes')
const postRoutes = require('./routes/postsRoutes')

// app
const app = express()
const mongoURL = 'mongodb://127.0.0.1:27017/test'
const PORT = 3000

// middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
app.use(express.json())
app.use(cors())

// use routes
app.use('/auth', authRoutes)
app.use('/posts', postRoutes)

mongoose
  .connect(mongoURL)
  .then(({ connection }) => {
    app.listen(PORT, () => {
      console.log(`Server has been started on port - ${PORT}`)
    })
  })
  .catch((err) => console.log(err))

const wsServer = new WebSocket.Server({ port: 8080 })

const Post = require('./models/Post')
const User = require('./models/User')

wsServer.on('connection', (ws) => {
  ws.on('message', async (data, isBinary) => {
    const message = isBinary ? data : data.toString()
    const parseData = JSON.parse(message)
    console.log(parseData)

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

    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(posts))
      }
    })
  })
})
