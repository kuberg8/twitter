import axios from '../utils/axios';
export const getChats = () => axios.get('/chats');
export const getUsers = (q = '') =>
  axios.get('/chats/users', { params: { q } });
export const getChatUser = (id) => axios.get(`/chats/users/${id}`);
