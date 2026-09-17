const { parseCursor, makePage, publicPost } = require('../services/messagePage')
const { conversationFilter, validId } = require('../services/conversations')
const { sendPostNotifications } = require('../services/push')
const { Types } = require('mongoose')
const Post = require('../models/Post')
const User = require('../models/User')
const { validationResult } = require('express-validator')

class PostController {
  async getPosts(req, res) {
    try {
      const peer = req.query?.peer
      if (
        peer !== undefined &&
        (!validId(peer) ||
          peer.toLowerCase() === String(req.user.id).toLowerCase())
      ) {
        return res.status(400).json({ message: 'Некорректный собеседник.' })
      }
      const limit = 50
      let filter = conversationFilter(req.user.id, peer)
      if (req.query?.before !== undefined) {
        try {
          filter = { $and: [filter, parseCursor(req.query.before)] }
        } catch {
          return res
            .status(400)
            .json({ message: 'Некорректная страница истории.' })
        }
      }
      const posts = await Post.find(filter)
        .sort({ created_at: -1, _id: -1 })
        .limit(limit + 1)
        .lean()
      res.json(makePage(posts, limit))
    } catch (err) {
      console.log(err)
      res.status(400).json({ message: 'Ошибка получения списка постов' })
    }
  }

  async createPost(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: 'Ошибка создания поста', ...errors })
      }

      const { message, recipient = null } = req.body
      if (
        recipient !== null &&
        (!validId(recipient) ||
          recipient.toLowerCase() === String(req.user.id).toLowerCase())
      ) {
        return res.status(400).json({ message: 'Некорректный получатель.' })
      }
      if (recipient && !(await User.exists({ _id: recipient }))) {
        return res.status(404).json({ message: 'Получатель не найден.' })
      }
      const { _id, first_name, last_name } = await User.findById(req.user.id)

      const post = new Post({
        message,
        recipient,
        user: {
          _id,
          first_name,
          last_name,
        },
      })

      await post.save()
      void sendPostNotifications(post)
      req.app.locals.broadcastPosts?.(post, 'created')
      res.json({ message: 'Пост успешно создан', post: publicPost(post) })
    } catch (err) {
      console.log(err)
      res.status(400).json({ message: 'Ошибка создания поста' })
    }
  }

  async updatePost(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: 'Ошибка изменения поста', ...errors })
      }

      const { id } = req.params
      const { message } = req.body

      const updatedPost = await Post.findOneAndUpdate(
        {
          _id: id,
          'user._id': { $in: [req.user.id, new Types.ObjectId(req.user.id)] },
        },
        { message: message.trim() },
        { new: true }
      )

      if (updatedPost) {
        req.app.locals.broadcastPosts?.(updatedPost, 'updated')
        res.json({
          message: 'Пост успешно изменен',
          post: publicPost(updatedPost),
        })
      } else {
        res.status(400).json({ message: 'Пост не найден' })
      }
    } catch (err) {
      console.log(err)
      res.status(400).json({ message: 'Ошибка изменения поста' })
    }
  }

  async deletePost(req, res) {
    try {
      const { id } = req.params

      const deletedPost = await Post.findOneAndDelete({
        _id: id,
        'user._id': { $in: [req.user.id, new Types.ObjectId(req.user.id)] },
      })

      if (deletedPost) {
        req.app.locals.broadcastPosts?.(deletedPost, 'deleted')
        res.json({
          message: 'Пост успешно удален',
          post: publicPost(deletedPost),
        })
      } else {
        res.status(400).json({ message: 'Пост не найден' })
      }
    } catch (err) {
      console.log(err)
      res.status(400).json({ message: 'Ошибка удаления поста' })
    }
  }
}

module.exports = new PostController()
