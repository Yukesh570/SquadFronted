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
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CompanyCategoryData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/companyCategory/`, { params });
  return response.data;
};

// POST
export const createCompanyCategoryApi = async (
  data: any,
  _module?: string,
): Promise<CompanyCategoryData> => {
  const response = await api.post(`/companyCategory/`, data);
  return response.data;
};

// PATCH
export const updateCompanyCategoryApi = async (
  id: number,
  data: any,
  _module?: string,
): Promise<CompanyCategoryData> => {
  const response = await api.patch(`/companyCategory/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteCompanyCategoryApi = async (
  id: number,
  _module?: string,
): Promise<void> => {
  await api.delete(`/companyCategory/${id}/`);
};