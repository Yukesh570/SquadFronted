import api from "../axiosInstance";

export interface SideBarApi {
  id?: number;
  label: string;
  url: string;
  order: number;
  is_active: boolean;
  icon: string;
}

export const getSideBarApi = async (): Promise<SideBarApi[]> => {
  const response = await api.get("/navItem/");
  return response.data;
};

export const createSideBarApi = async (
  data: SideBarApi
): Promise<SideBarApi> => {
  const response = await api.post("/navItem/", data);
  return response.data;
};