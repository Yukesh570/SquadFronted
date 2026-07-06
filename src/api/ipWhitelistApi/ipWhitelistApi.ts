import api from "../../api/axiosInstance";

export interface IpWhitelistData {
  id?: number;
  ip?: string;
  hostname?: string;
  access_type: string;
  client: number;
  clientName?: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getIpWhitelistApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<IpWhitelistData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/accessControl/${module}/`, { params });
  return response.data;
};

// POST
export const createIpWhitelistApi = async (
  data: any,
  module: string
): Promise<IpWhitelistData> => {
  const response = await api.post(`/accessControl/${module}/`, data);
  return response.data;
};

// PUT
export const updateIpWhitelistApi = async (
  id: number,
  data: any,
  module: string
): Promise<IpWhitelistData> => {
  const response = await api.put(`/accessControl/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteIpWhitelistApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/accessControl/${module}/${id}/`);
};