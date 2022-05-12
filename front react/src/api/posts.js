import axios from "../utils/axios.js";

/**
 * Получение постов
 * @return {Array} Посты
 */
function getPosts() {
  return axios.get("/posts");
}

/**
 * Создание поста
 * @param {String} message
 */
function createPost(message) {
  return axios.post("/posts", { message });
}

/**
 * Изменение поста
 * @param {Number} id
 */
function updatePost(id, message) {
  return axios.put(`/posts/${id}`, { message });
}

/**
 * Удаление поста
 * @param {Number} id
 */
function deletePost(id) {
  return axios.delete(`/posts/${id}`);
}

export { getPosts, createPost, updatePost, deletePost };
