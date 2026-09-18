import axios from '../utils/axios';
export const deleteChat = (id, scope = 'self') =>
  axios.delete(`/chats/${id}`, { data: { scope } });
export const getChats = () => axios.get('/chats');
export const getUsers = (q = '') =>
  axios.get('/chats/users', { params: { q } });
export const getChatUser = (id) => axios.get(`/chats/users/${id}`);

export const getUnread = () => axios.get('/chats/unread');
export const markChatRead = (peer, messageId) =>
  axios.post(`/chats/${peer || 'general'}/read`, { messageId });
export const loadUnread = async () => (await getUnread()).data;
