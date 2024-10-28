const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { secret } = require("../config");

const generateAccessToken = (id) => {
  const payload = {
    id,
  };

  return jwt.sign(payload, secret, { expiresIn: "24h" });
};

class AuthController {
  async registration(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Ошибка регистрации", ...errors });
      }

      const { email, password, first_name, last_name } = req.body;
      const isHaveUser = await User.findOne({ email });

      if (isHaveUser) {
        return res
          .status(400)
          .json({ message: "Пользователь с такой почтой уже существует" });
      }

      const hashPassword = bcrypt.hashSync(password, 7);
      const user = new User({
        email,
        password: hashPassword,
        first_name,
        last_name,
      });

      await user.save();
      return res.json({ message: "Пользователь успешно создан" });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "Ошибка регистрации" });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: "Пользователь не найден" });
      }

      const passwordIsValid = bcrypt.compareSync(password, user.password);

      if (!passwordIsValid) {
        return res.status(400).json({ message: "Неверный логин или пароль" });
      }

      const token = generateAccessToken(user._id);
      return res.json({ token, user_id: user._id });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "Ошибка авторизации" });
    }
  }
}

module.exports = new AuthController();
