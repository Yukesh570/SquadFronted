import api from "../../axiosInstance";

export interface CompanyCategoryData {
  id?: number;
  name: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getCompanyCategoryApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<CompanyCategoryData>> => {
  const response = await api.get(`/companyCategory/${module}/?page=${page}&page_size=${pageSize}`);
  return response.data;
};

// POST
export const createCompanyCategoryApi = async (
  data: any,
  module: string
): Promise<CompanyCategoryData> => {
  const response = await api.post(`/companyCategory/${module}/`, data);
  return response.data;
};

// PATCH
export const updateCompanyCategoryApi = async (
  id: number,
  data: any,
  module: string
): Promise<CompanyCategoryData> => {
  const response = await api.patch(`/companyCategory/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteCompanyCategoryApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/companyCategory/${module}/${id}/`);
};