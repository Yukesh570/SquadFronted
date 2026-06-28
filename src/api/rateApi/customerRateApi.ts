import api from "../axiosInstance";

export interface CustomerRateData {
  id?: number;
  country: number;
  countryName?: string;
  MCC: number;
  MNC?: number; 
  countryCode: number;
  rate: number;
  remark: string;
  dateTime?: string;
  version?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status?: string;
}

// ⚡️ Added Customer Rate Group Interface
export interface CustomerRateGroupData {
  id?: number;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==========================================
// CUSTOMER RATE GROUP API (Outer Table)
// ==========================================

export const getCustomerRateGroupsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CustomerRateGroupData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/customerRateGroup/${module}/`, { params });
  return response.data;
};

export const createCustomerRateGroupApi = async (
  data: any,
  module: string,
): Promise<CustomerRateGroupData> => {
  const response = await api.post(`/customerRateGroup/${module}/`, data);
  return response.data;
};

export const updateCustomerRateGroupApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CustomerRateGroupData> => {
  const response = await api.patch(`/customerRateGroup/${module}/${id}/`, data);
  return response.data;
};

export const deleteCustomerRateGroupApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/customerRateGroup/${module}/${id}/`);
};


// ==========================================
// CUSTOMER RATE API (Inner Table)
// ==========================================

export const getCustomerRatesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CustomerRateData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/customerRate/${module}/`, { params });
  return response.data;
};

export const createCustomerRateApi = async (
  data: any,
  module: string,
): Promise<CustomerRateData> => {
  const response = await api.post(`/customerRate/${module}/`, data);
  return response.data;
};

// POST Upgrade (Replaced PATCH/PUT with Upgrade Rate API as requested)
export const updateCustomerRateApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CustomerRateData> => {
  const response = await api.post(`/customerRate/upgrade_rate/${module}/${id}/`, data);
  return response.data;
};

export const deleteCustomerRateApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/customerRate/${module}/${id}/`);
};