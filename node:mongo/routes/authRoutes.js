const { Router } = require("express");
const { login, registration } = require("../controllers/AuthController");
const { check } = require("express-validator");

const router = Router();

/**
 * @swagger
 * /auth/registration:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Запрос на регистрацию пользователя
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name.
 *                 example: Leanne Graham
 *     responses:
 *       200:
 *         description: Successfully registered
 */
router.post(
  "/registration",
  [
    check("first_name", "Имя пользователя обязательно").notEmpty(),
    check("last_name", "Фамилия пользователя обязательна").notEmpty(),
    check("email", "Email пользователя обязателен").notEmpty(),
    check("password", "Длина пароля должна быть не меньше 4 символов").isLength(
      {
        min: 4,
        // max: 20,
      }
    ),
  ],
  registration
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Запрос на аторизацию пользователя
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Returns a token
 */
router.post("/login", login);

module.exports = router;
