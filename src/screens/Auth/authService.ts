import api from "../../plugin/axios";
import { secureStorage } from "../../lib/secureStorage";

export interface LoginPayload {
  email: string;
  password: string;
}

// NOTE: the backend's UserAccount model has no `username` field and requires
// first_name/last_name/position/office/acc_lvl to create a user (see
// accounts/models.py, accounts/serializers.py). Self-registration is also
// restricted to admins via DJOSER['PERMISSIONS']['user_create'] in
// config/settings.py, so this payload/endpoint is a placeholder until the
// Register screen collects those fields.
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  re_password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
  office: number;
  acc_lvl: number;
  is_active: boolean;
  is_staff: boolean;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>("auth/jwt/create/", payload);
    secureStorage.setItem("access_token", data.access);
    secureStorage.setItem("refresh_token", data.refresh);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<UserProfile> => {
    const { data } = await api.post<UserProfile>("auth/users/", payload);
    return data;
  },

  getMe: async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>("auth/users/me/");
    secureStorage.setItem("user", data);
    return data;
  },

  logout: async (): Promise<void> => {
    const refresh = secureStorage.getItem<string>("refresh_token");
    secureStorage.removeItem("access_token");
    secureStorage.removeItem("refresh_token");
    secureStorage.removeItem("user");

    if (refresh) {
      try {
        // Blacklists the refresh token server-side so it can't mint new access tokens.
        await api.post("auth/jwt/logout/", { refresh });
      } catch {
        // Best-effort — client-side tokens are already cleared either way.
      }
    }
  },

  // Gates whether it's worth even trying to fetch the session on load. Only
  // checks that a refresh token is present; validity is left to the backend
  // (an expired token fails the request and the axios interceptor logs out).
  isAuthenticated: (): boolean => {
    return !!secureStorage.getItem<string>("refresh_token");
  },

  getCachedUser: (): UserProfile | null => {
    return secureStorage.getItem<UserProfile>("user");
  },
};

export default api;
