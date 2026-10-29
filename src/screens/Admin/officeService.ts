import api from "../../plugin/axios";

export interface Office {
  officeID: number;
  name: string;
  officeMail: string;
  street: string;
  city: string;
  province: string;
  region: string;
  // Derived on the backend from actual users assigned to this office — read-only.
  numUsers: number;
}

export type OfficeFormPayload = Omit<Office, "officeID" | "numUsers">;

// Matches offices/urls.py: `all/` (list+create), `<id>/` (retrieve+update+delete)
export const officeService = {
  list: async (): Promise<Office[]> => {
    const { data } = await api.get<Office[]>("office/all/");
    return data;
  },

  create: async (payload: OfficeFormPayload): Promise<Office> => {
    const { data } = await api.post<Office>("office/all/", payload);
    return data;
  },

  update: async (id: number, payload: OfficeFormPayload): Promise<Office> => {
    const { data } = await api.put<Office>(`office/${id}/`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`office/${id}/`);
  },
};
