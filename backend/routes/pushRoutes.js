const { Router } = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const Subscription = require('../models/PushSubscription')
const { getConfig, validSubscription } = require('../services/push')
const router = Router()
router.use(authMiddleware)
router.get('/config', (req, res) => {
  const config = getConfig()
  res.set('Cache-Control', 'no-store')
  res.json({ enabled: !!config, publicKey: config?.publicKey || null })
})
router.post('/subscriptions', async (req, res) => {
  if (!getConfig())
    return res
      .status(503)
      .json({ message: 'Уведомления ещё не настроены на сервере.' })
  if (!validSubscription(req.body))
    return res.status(400).json({ message: 'Некорректная push-подписка.' })
  try {
    const { endpoint, keys } = req.body
    // The browser endpoint is unique; signing in as another account rebinds this device.
    await Subscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          user: req.user.id,
          keys: { auth: keys.auth, p256dh: keys.p256dh },
        },
      },
      { upsert: true, runValidators: true }
    )
    res.sendStatus(204)
  } catch {
    res.status(500).json({ message: 'Не удалось сохранить подписку.' })
  }
})
router.delete('/subscriptions', async (req, res) => {
  if (typeof req.body.endpoint !== 'string') return res.sendStatus(400)
  try {
    await Subscription.deleteOne({
      endpoint: req.body.endpoint,
      user: req.user.id,
    })
    res.sendStatus(204)
  } catch {
    res.status(500).json({ message: 'Не удалось отключить подписку.' })
  }
})
module.exports = router
