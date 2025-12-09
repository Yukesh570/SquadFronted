import api from "../axiosInstance";

export interface VendorRateData {
  id?: number;
  country: number | string;
  countryName?: string; 
  ratePlan: string;
  currencyCode: string; 
  countryCode: number;
  timeZone: number | string;
  timeZoneName?: string; 
  network: string;
  MCC: number;
  MNC: number;
  rate: number | string; 
  dateTime: string;
  remark: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getVendorRatesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<VendorRateData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRate/${module}/`, { params });
  return response.data;
};

// POST
export const createVendorRateApi = async (
  data: any,
  module: string
): Promise<VendorRateData> => {
  const response = await api.post(`/vendorRate/${module}/`, data);
  return response.data;
};

// PATCH
export const updateVendorRateApi = async (
  id: number,
  data: any,
  module: string
): Promise<VendorRateData> => {
  const response = await api.patch(`/vendorRate/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteVendorRateApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/vendorRate/${module}/${id}/`);
};

// IMPORT
export const importVendorRatesApi = async (
  file: File,
  mappingId: string
): Promise<{ task_id: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mapped", mappingId); 

  const response = await api.post(`/vendor-rate/import/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// STATUS
export const getImportStatusApi = async (taskId: string): Promise<any> => {
  const response = await api.get(`/vendor-rate/import/status/${taskId}/`);
  return response.data;
};