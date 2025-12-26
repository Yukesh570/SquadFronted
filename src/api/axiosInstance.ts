import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 1. Request Interceptor (Adds token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor (The Fix)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid (401) or expired/forbidden (403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      
      // 1. Clear the bad token from storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // 2. Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;