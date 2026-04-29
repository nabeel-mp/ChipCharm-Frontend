import axios from 'axios';

const api = axios.create({ 
  // Use Vercel's environment variable in production, fallback to '/api' for local dev
  baseURL: import.meta.env.VITE_API_URL || '/api' 
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('chipcharm_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default api;