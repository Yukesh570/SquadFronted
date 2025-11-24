import api from "../../axiosInstance";

export interface StateData {
  id?: number;
  name: string;
  country: number;
  countryName?: string; 
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getStateApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<StateData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams
  };
  const response = await api.get(`/state/${module}/`, { params });
  return response.data;
};

// POST
export const createStateApi = async (
  data: any,
  module: string
): Promise<StateData> => {
  const response = await api.post(`/state/${module}/`, data);
  return response.data;
};

// PATCH
export const updateStateApi = async (
  id: number,
  data: any,
  module: string
): Promise<StateData> => {
  const response = await api.patch(`/state/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteStateApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/state/${module}/${id}/`);
};