const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const WebSocket = require('./websocket/websocket')
require('dotenv').config()

// swagger
const swaggerUi = require('swagger-ui-express')
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerDocument = require('./swagger.json')
const swaggerDocs = swaggerJsDoc(swaggerDocument)

// routes
const authRoutes = require('./routes/authRoutes')
const postRoutes = require('./routes/postsRoutes')

const corsOptions = {
  origin: '*', // URL клиента или '*' для разрешения всех
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Разрешить отправку куки
  optionsSuccessStatus: 204, // Для некоторых старых браузеров
}

// app
const app = express()
const mongoURL = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test'
const PORT = process.env.PORT || 3000

// middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
app.use(express.json())
app.use(cors(corsOptions))

// use routes
app.use('/auth', authRoutes)
app.use('/posts', postRoutes)

mongoose.set('strictQuery', true)
mongoose
  .connect(mongoURL)
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server port - ${PORT}`)
    })

    WebSocket(server)
  })
  .catch((err) => console.log(err))
