import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('chipcharm_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default api;