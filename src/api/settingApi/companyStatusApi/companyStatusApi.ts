import api from "../../axiosInstance";

export interface CompanyStatusData {
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
export const getCompanyStatusApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<CompanyStatusData>> => {
    const params: any = {
      page: page,
    page_size: pageSize,
    ...searchParams
    };
  const response = await api.get(`/companyStatus/${module}/`, { params });
  return response.data;
};

// POST
export const createCompanyStatusApi = async (
  data: any,
  module: string
): Promise<CompanyStatusData> => {
  const response = await api.post(`/companyStatus/${module}/`, data);
  return response.data;
};

// PATCH
export const updateCompanyStatusApi = async (
  id: number,
  data: any,
  module: string
): Promise<CompanyStatusData> => {
  const response = await api.patch(`/companyStatus/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteCompanyStatusApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/companyStatus/${module}/${id}/`);
};