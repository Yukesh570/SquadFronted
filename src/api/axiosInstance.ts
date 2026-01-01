import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000, // <--- FIXED: Stops spinning after 10 seconds if backend is dead
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
    // --- FIX FOR SPINNER / BACKEND DOWN ---
    if (!error.response) {
      // Logic: If there is no response, it means Network Error or Timeout
      if (error.code === "ECONNABORTED") {
        toast.error("Connection timed out. Backend is not responding.");
      } else {
        toast.error("Cannot connect to server. Is the Backend running?");
      }
      return Promise.reject(error);
    }
    // --------------------------------------

    // If token is invalid (401) or expired/forbidden (403)
    if (error.response.status === 401 || error.response.status === 403) {
      
      // 1. Clear the bad token from storage (Your existing logic)
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sidebar_collapsed");

      // 2. Redirect to login
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;