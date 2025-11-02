import api from "../axiosInstance";

export interface SideBarApi {
  id?: number;
  label: string;
  url: string;
  order: number;
  is_active: boolean;
  icon: string;
}
const token = localStorage.getItem("token");

export const getSideBarApi = async (): Promise<SideBarApi[]> => {
  const response = await api.get("/navItem/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createSideBarApi = async (
  data: SideBarApi
): Promise<SideBarApi> => {
  const response = await api.post("/navItem/", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
