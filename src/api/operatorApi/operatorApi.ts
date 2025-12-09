import api from "../axiosInstance";

export interface OperatorData {
  id?: number;
  name: string;
  country: number;
  MNC: number;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getOperatorsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<OperatorData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/operator/${module}/`, { params });
  return response.data;
};

// POST
export const createOperatorApi = async (
  data: OperatorData,
  module: string
): Promise<OperatorData> => {
  const response = await api.post(`/operator/${module}/`, data);
  return response.data;
};

// PATCH
export const updateOperatorApi = async (
  id: number,
  data: OperatorData,
  module: string
): Promise<OperatorData> => {
  const response = await api.patch(`/operator/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteOperatorApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/operator/${module}/${id}/`);
};