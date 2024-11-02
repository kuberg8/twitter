const Post = require('../models/Post')
const User = require('../models/User')
const { validationResult } = require('express-validator')

class PostController {
  async getPosts(req, res) {
    try {
      const posts = await Post.find()
      res.json(posts)
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

      const { message } = req.body
      const { _id, first_name, last_name, email } = await User.findById(
        req.user.id
      )

      const post = new Post({
        message,
        user: {
          _id,
          first_name,
          last_name,
          email,
        },
      })

      await post.save()
      res.json({ message: 'Пост успешно создан' })
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

      const updatedPost = await Post.findByIdAndUpdate({ _id: id }, { message })

      if (updatedPost) {
        res.json({ message: 'Пост успешно изменен' })
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

      const deletedPost = await Post.findOneAndDelete({ _id: id })

      if (deletedPost) {
        res.json({ message: 'Пост успешно удален' })
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
