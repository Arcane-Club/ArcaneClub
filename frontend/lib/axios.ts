import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.log("Attaching token:", token.substring(0, 10) + "..."); 
      } else {
        console.warn("No token found in localStorage");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Request Failed:", error.response?.data?.message || error.message);
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        // Only remove token if it exists to avoid loops
        if (localStorage.getItem('token')) {
           localStorage.removeItem('token');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
