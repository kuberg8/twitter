const { Router } = require('express')
const { Types } = require('mongoose')
const User = require('../models/User')
const Post = require('../models/Post')
const auth = require('../middleware/authMiddleware')
const {
  validId,
  idVariants,
  conversationFilter,
} = require('../services/conversations')
const router = Router()
router.use((req, res, next) => {
  res.set('Cache-Control', 'private, no-store')
  next()
})
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
          hiddenFor: { $ne: new Types.ObjectId(id) },
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
router.delete('/:id', async (req, res) => {
  const peer = req.params.id.toLowerCase()
  if (!validId(peer) || peer === req.user.id) return res.sendStatus(400)
  const scope = req.body?.scope ?? 'self'
  if (!['self', 'both'].includes(scope)) return res.sendStatus(400)
  try {
    const filter = conversationFilter(req.user.id, peer)
    if (scope === 'both') await Post.deleteMany(filter)
    else
      await Post.updateMany(filter, {
        $addToSet: { hiddenFor: new Types.ObjectId(req.user.id) },
      })
    req.app.locals.broadcastPosts?.clearChat?.(req.user.id, peer)
    if (scope === 'both')
      req.app.locals.broadcastPosts?.clearChat?.(peer, req.user.id)
    res.json({
      message: scope === 'both' ? 'Чат удалён у обоих.' : 'Чат удалён у вас.',
    })
  } catch {
    res.status(500).json({ message: 'Не удалось удалить чат.' })
  }
})
module.exports = router
