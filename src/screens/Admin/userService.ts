import api from "../../plugin/axios";

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
  office: number | null;
  acc_lvl: number;
  is_active: boolean;
  is_staff: boolean;
}

export interface UserFormPayload {
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  position: string;
  office: number;
  acc_lvl: number;
  is_active: boolean;
  is_staff: boolean;
}

// Matches accounts/urls.py: `all/` (list+create), `update/<id>/` (update+delete)
export const userService = {
  list: async (): Promise<AdminUser[]> => {
    const { data } = await api.get<AdminUser[]>("users/all/");
    return data;
  },

  create: async (payload: UserFormPayload): Promise<AdminUser> => {
    const { data } = await api.post<AdminUser>("users/all/", payload);
    return data;
  },

  update: async (id: number, payload: Partial<UserFormPayload>): Promise<AdminUser> => {
    const { data } = await api.put<AdminUser>(`users/update/${id}/`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`users/update/${id}/`);
  },
};
