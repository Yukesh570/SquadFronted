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
  _module?: string,
  page?: number,
  pageSize?: number,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<SideBarApi>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };

  // if (page !== undefined) params.page = page;
  // if (pageSize !== undefined) params.page_size = pageSize;
  const response = await api.get(`/navItem/`, { params });
  return response.data;
};

export const createSideBarApi = async (
  data: SideBarApi,
  _module?: string,
): Promise<SideBarApi> => {
  if (data.parent === 0) {
    const { parent, ...rest } = data;
    const response = await api.post(`/navItem/`, rest);
    return response.data;
  } else {
    const response = await api.post(`/navItem/`, data);
    return response.data;
  }
};

export const updateSideBarApi = async (
  id: number,
  data: SideBarApi,
  _module?: string,
): Promise<SideBarApi> => {
  const response = await api.patch(`/navItem/${id}/`, data);
  return response.data;
};

export const deleteSideBarApi = async (
  id: number,
  _module?: string,
): Promise<void> => {
  await api.delete(`/navItem/${id}/`);
};