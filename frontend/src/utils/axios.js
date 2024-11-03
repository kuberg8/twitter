import axios from 'axios';
import store from '../store/store';
import { logout } from '../store/userSlice';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

instance.interceptors.request.use((request) => {
  const isAuthorization = !!instance.defaults.headers.common['Authorization'];
  const token = localStorage.getItem('token');

  if (!isAuthorization && token) {
    const bearer = 'Bearer ' + token;
    instance.defaults.headers.common['Authorization'] = bearer;
    request.headers.common['Authorization'] = bearer;
  }

  return request;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response && response.status === 403) {
      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

export default instance;
