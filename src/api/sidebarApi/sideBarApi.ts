import api from "../axiosInstance";

export interface SideBarApi {
  id?: number;
  label: string;
  parent?: number;
  url: string;
  order: number;
  is_active: boolean;
  icon: string;
  module: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getSideBarApi = async (
  module?: string,
  page?: number,
  pageSize?: number,
): Promise<PaginatedResponse<SideBarApi>> => {
    const params: any = {};

  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.page_size = pageSize;
  const response = await api.get(`/navItem/${module}/`, { params });
  return response.data;
};

export const createSideBarApi = async (data: SideBarApi, module: string): Promise<SideBarApi> => {
  if (data.parent === 0) {
    const { parent, ...rest } = data;
    const response = await api.post(`/navItem/${module}/`, rest);
    return response.data;
  } else {
    const response = await api.post(`/navItem/${module}/`, data);
    return response.data;
  }
};

export const updateSideBarApi = async (id: number, data: SideBarApi, module: string): Promise<SideBarApi> => {
  const response = await api.patch(`/navItem/${module}/${id}/`, data);
  return response.data;
};

export const deleteSideBarApi = async (id: number, module: string): Promise<void> => {
  await api.delete(`/navItem/${module}/${id}/`);
};