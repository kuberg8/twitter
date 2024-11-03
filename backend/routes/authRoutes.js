const { Router } = require('express')
const {
  login,
  registration,
  getUserInfo,
} = require('../controllers/AuthController')
const { check } = require('express-validator')
const authMiddleware = require('../middleware/authMiddleware')

const router = Router()

/**
 * @swagger
 * /auth/registration:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Запрос на регистрацию пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: Имя пользователя.
 *                 example: Leanne
 *               last_name:
 *                 type: string
 *                 description: Фамилия пользователя.
 *                 example: Graham
 *               email:
 *                 type: string
 *                 description: Email пользователя.
 *                 example: example@example.com
 *               password:
 *                 type: string
 *                 description: Пароль пользователя (должен быть не менее 4 символов).
 *                 example: password123
 *     responses:
 *       200:
 *         description: Успешная регистрация
 *       400:
 *         description: Ошибка регистрации; содержит сообщения об ошибках
 */
router.post(
  '/registration',
  [
    check('first_name', 'Имя пользователя обязательно').notEmpty(),
    check('last_name', 'Фамилия пользователя обязательна').notEmpty(),
    check('email', 'Email пользователя обязателен').notEmpty(),
    check('password', 'Длина пароля должна быть не меньше 4 символов').isLength(
      { min: 4 }
    ),
  ],
  registration
)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Запрос на авторизацию пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email пользователя (должен быть указан).
 *                 example: example@example.com
 *               password:
 *                 type: string
 *                 description: Пароль пользователя (должен быть указан).
 *                 example: password123
 *     responses:
 *       200:
 *         description: Возвращает токен для авторизованного пользователя
 *       400:
 *         description: Ошибка авторизации; неверный email или пароль
 */
router.post('/login', login)

/**
 * @swagger
 * /auth/info/{id}:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Получение информации о пользователе
 *     description: Возвращает информацию о пользователе по его ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Идентификатор пользователя
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный ответ с информацией о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Информация о пользователе
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     email:
 *                       type: string
 *                       example: example@example.com
 *                     first_name:
 *                       type: string
 *                       example: Leanne
 *                     last_name:
 *                       type: string
 *                       example: Graham
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2021-06-01T12:00:00Z
 *       401:
 *         description: Неудачная аутентификация; токен отсутствует или недействителен
 *       404:
 *         description: Пользователь не найден по заданному идентификатору
 *       500:
 *         description: Ошибка при получении информации о пользователе
 */
// router.get('/info/:id', authMiddleware, getUserInfo)

module.exports = router
