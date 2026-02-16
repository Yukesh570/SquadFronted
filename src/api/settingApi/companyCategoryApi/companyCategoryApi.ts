import api from "../../axiosInstance";
import { actionHelper } from "../../sidebarApi/sideBarApi";

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
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CompanyCategoryData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/companyCategory/${module}/`, { params });
  return response.data;
};

// POST
export const createCompanyCategoryApi = async (
  data: any,
  module: string,
): Promise<CompanyCategoryData> => {
  const response = await api.post(`/companyCategory/${module}/`, data);
  actionHelper(
    "Company Category Status",
    "Company Category Status created successfully!",
    "Company Category Status",
    "Company Category Status created successfully!",
  );
  return response.data;
};

// PATCH
export const updateCompanyCategoryApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CompanyCategoryData> => {
  const response = await api.patch(`/companyCategory/${module}/${id}/`, data);
  actionHelper(
    "Company Category Status",
    "Company Category Status updated successfully!",
    "Company Category Status",
    "Company Category Status updated successfully!",
  );
  return response.data;
};

// DELETE
export const deleteCompanyCategoryApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/companyCategory/${module}/${id}/`);
  actionHelper(
    "Company Category Status",
    "Company Category Status deleted!",
    "Company Category Status",
    "Company Category Status deleted!",
  );
};
