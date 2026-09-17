const { Router } = require('express')
const { Types } = require('mongoose')
const User = require('../models/User')
const Post = require('../models/Post')
const auth = require('../middleware/authMiddleware')
const { validId, idVariants } = require('../services/conversations')
const router = Router()
router.use(auth)
router.get('/users', async (req, res) => {
  try {
    const query =
      typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : ''
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const filter = { _id: { $ne: req.user.id } }
    if (query)
      filter.$or = ['first_name', 'last_name'].map((field) => ({
        [field]: { $regex: escaped, $options: 'i' },
      }))
    const users = await User.find(filter)
      .select('_id first_name last_name')
      .sort({ first_name: 1, _id: 1 })
      .limit(50)
      .lean()
    res.json(users)
  } catch {
    res.status(500).json({ message: 'Не удалось загрузить участников.' })
  }
})
router.get('/users/:id', async (req, res) => {
  if (!validId(req.params.id) || req.params.id === req.user.id)
    return res.sendStatus(400)
  try {
    const user = await User.findById(req.params.id)
      .select('_id first_name last_name')
      .lean()
    if (!user)
      return res.status(404).json({ message: 'Пользователь не найден.' })
    res.json(user)
  } catch {
    res.status(500).json({ message: 'Не удалось загрузить собеседника.' })
  }
})
router.get('/', async (req, res) => {
  try {
    const id = req.user.id
    const recent = await Post.aggregate([
      {
        $match: {
          recipient: { $ne: null },
          $or: [
            { 'user._id': { $in: idVariants(id) } },
            { recipient: new Types.ObjectId(id) },
          ],
        },
      },
      { $sort: { created_at: -1, _id: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: [{ $toString: '$user._id' }, id] },
              { $toString: '$recipient' },
              { $toString: '$user._id' },
            ],
          },
          message: { $first: '$message' },
          created_at: { $first: '$created_at' },
        },
      },
      { $sort: { created_at: -1 } },
      { $limit: 100 },
    ])
    const users = await User.find({
      _id: { $in: recent.map((chat) => chat._id).filter(validId) },
    })
      .select('_id first_name last_name')
      .lean()
    const byId = new Map(users.map((user) => [String(user._id), user]))
    res.json(
      recent.map((chat) => ({
        peer: byId.get(chat._id) || {
          _id: chat._id,
          first_name: 'Удалённый пользователь',
        },
        message: chat.message,
        created_at: chat.created_at,
      }))
    )
  } catch {
    res.status(500).json({ message: 'Не удалось загрузить личные чаты.' })
  }
})
module.exports = router
