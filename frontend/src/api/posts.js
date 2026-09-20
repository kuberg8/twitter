import axios from '../utils/axios.js';

/**
 * Получение постов
 * @return {Array} Посты
 */
async function getPosts(peer, before) {
  const response = await axios.get('/posts', {
    params: { ...(peer ? { peer } : {}), ...(before ? { before } : {}) },
  });
  return {
    ...response,
    data: response.data.posts,
    nextCursor: response.data.nextCursor,
  };
}

/**
 * Создание поста
 * @param {String} message
 */
function createPost(message, recipient = null, clientMessageId) {
  return axios.post(
    '/posts',
    { message, recipient, ...(clientMessageId ? { clientMessageId } : {}) },
    { timeout: 20000 }
  );
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
