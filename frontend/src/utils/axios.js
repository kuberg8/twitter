import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000',
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

export default instance;
