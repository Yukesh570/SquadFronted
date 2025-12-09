import api from "../axiosInstance";

export interface CustomerRateData {
  id?: number;
  country: number; 
  countryName?: string; 
  ratePlan: string;
  currencyCode: string;
  timeZone: number;
  timeZoneName?: string; 
  MCC: number;
  countryCode: number; 
  rate: number;
  remark: string;
  dateTime?: string; 
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getCustomerRatesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<CustomerRateData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/customerRate/${module}/`, { params });
  return response.data;
};

// POST
export const createCustomerRateApi = async (
  data: any,
  module: string
): Promise<CustomerRateData> => {
  const response = await api.post(`/customerRate/${module}/`, data);
  return response.data;
};

// PATCH
export const updateCustomerRateApi = async (
  id: number,
  data: any,
  module: string
): Promise<CustomerRateData> => {
  const response = await api.patch(`/customerRate/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteCustomerRateApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/customerRate/${module}/${id}/`);
};