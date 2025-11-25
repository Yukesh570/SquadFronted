import api from "../axiosInstance";

export interface VendorData {
  id?: number;
  company?: number;
  companyName: string; 
  profileName: string;
  connectionType: 'SMPP' | 'HTTP';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getVendorsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, string>
): Promise<PaginatedResponse<VendorData>> => {
  const params : any = {
    page: page,
    page_size: pageSize,
    ...searchParams
  }
  const response = await api.get(`/vendor/${module}/`, { params });
  return response.data;
};

// POST
export const createVendorApi = async (
  data: any, 
  module: string
): Promise<VendorData> => {
  const response = await api.post(`/vendor/${module}/`, data);
  return response.data;
};

// PATCH
export const updateVendorApi = async (
  id: number,
  data: any,
  module: string
): Promise<VendorData> => {
  const response = await api.patch(`/vendor/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteVendorApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/vendor/${module}/${id}/`);
};