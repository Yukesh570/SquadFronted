import api from "../axiosInstance";

export interface SideBarApi {
  id?: number;
  label: string;
  parent?: number;
  url: string;
  order: number;
  is_active: boolean;
  icon: string;
}

export const getSideBarApi = async (module: string): Promise<SideBarApi[]> => {
  const response = await api.get(`/navItem/${module}/`);
  console.log("Fetched sidebar data:", module);
  return response.data;
};

export const createSideBarApi = async (
  data: SideBarApi,
  module: string
): Promise<SideBarApi> => {
  if (data.parent === 0) {
    const { parent, ...rest } = data;
    const response = await api.post(`/navItem/${module}/`, rest);
    return response.data;
  } else {
    const response = await api.post(`/navItem/${module}/`, data);
    return response.data;
  }
};

export const updateSideBarApi = async (
  id: number,
  data: SideBarApi,
  module: string
): Promise<SideBarApi> => {
  const response = await api.patch(`/navItem/${module}/${id}/`, data);
  return response.data;
};

export const deleteSideBarApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/navItem/${module}/${id}/`);
};