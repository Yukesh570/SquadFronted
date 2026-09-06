import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

// 1. Request Interceptor (Adds token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        toast.error("Connection timed out. Backend is not responding.", {
          toastId: "backend-timeout",
        });
      } else {
        toast.error("Cannot connect to server. Is the Backend running?", {
          toastId: "backend-unreachable",
        });
      }
      return Promise.reject(error);
    }

    const isLoginRequest = originalRequest?.url?.includes("login/");

    // Handle 401 Unauthorized -> Attempt token refresh
    if (!isLoginRequest && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}refresh/`,
          { refresh: refreshToken }
        );
        const newAccessToken = refreshResponse.data.access;

        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError)) {
          console.error(
            "Refresh API failed:",
            refreshError.response?.data || refreshError.message
          );
        } else {
          console.error("An unexpected error occurred during refresh:", refreshError);
        }

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("sidebar_collapsed");

        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden -> Display warning, DO NOT logout
    if (!isLoginRequest && error.response.status === 403) {
      toast.error(
        error.response?.data?.detail || "You do not have permission to access this resource.",
        { toastId: "permission-denied" }
      );
    }

    return Promise.reject(error);
  }
);

export default api;