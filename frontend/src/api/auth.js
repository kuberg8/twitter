import axios from '../utils/axios.js';

/**
 * Авторизация
 * @param {String} email
 * @param {String} password
 */
function login(email, password) {
  return axios.post('/auth/login', { email, password });
}

/**
 * Регистрация
 * @param {String} email
 * @param {String} password
 * @param {String} first_name
 * @param {String} last_name
 */
function registration(email, password, first_name, last_name) {
  return axios.post('/auth/registration', {
    email,
    password,
    first_name,
    last_name,
  });
}

/**
 * Получение информации пользователя
 * @param {String} id
 */
// function getUserInfo(id) {
//   return axios.get(`/auth/info/${id}`);
// }

export { login, registration };
