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
  network?: string;
  currencyCode?: string;
  rateBase?: number;
  baseCurrencyCode?: string;
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

export const getCustomerRatesPerMNCMCCApi = async (
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
  const response = await api.get(`/customerRatePerQuery/${module}/`, { params });
  return response.data;
};

// ⚡️ Added: Looks up the matching active customer rate for a given RouteGroup + MCC + MNC
export const findCustomerRateApi = async (
  searchParams: { routeGroupName: string; MCC: string | number; MNC: string | number },
): Promise<PaginatedResponse<CustomerRateData>> => {
  const response = await api.get(`/findCustomerRate/customerRate/`, { params: searchParams });
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

export const importCustomerRatesApi = async (
  file: File,
  mappingId: string,
  rateGroupId: number,
): Promise<{ task_id: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mapped", mappingId);

  const response = await api.post(`/customer-rate/import/${rateGroupId}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ⚡️ Correct API: /customerRateGroup/<str:module>/<int:pk>/export_rates_email/
export const exportCustomerRatesEmailApi = async (
  rateGroupId: number,
  data: { exportOnlyNew: boolean; emailTemplateId: number },
  module: string = "customerRateGroup",
): Promise<any> => {
  const response = await api.post(`/customerRateGroup/${module}/${rateGroupId}/export_rates_email/`, data);
  return response.data;
};