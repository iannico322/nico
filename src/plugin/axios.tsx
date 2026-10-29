import axios from "axios";
import { secureStorage } from "../lib/secureStorage";

const baseURL = `${import.meta.env.VITE_BACKEND_URL}/api/v1/`;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = secureStorage.getItem<string>("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Shared across concurrent 401s so a burst of requests triggers one refresh, not one each.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = secureStorage.getItem<string>("refresh_token");
  if (!refresh) throw new Error("No refresh token available");

  // Plain axios, not `api` — going through the intercepted instance here would
  // re-trigger this same 401 handler if the refresh token is also invalid.
  const { data } = await axios.post(`${baseURL}auth/jwt/refresh/`, { refresh });
  secureStorage.setItem("access_token", data.access);
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken();
        const access = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        secureStorage.removeItem("access_token");
        secureStorage.removeItem("refresh_token");
        secureStorage.removeItem("user");
        window.location.href = "/nico/login";
      } finally {
        refreshPromise = null;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
