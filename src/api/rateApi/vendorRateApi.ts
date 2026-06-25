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
  dateTime?: string;
  remark: string;
  version?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status?: string;
}

// ⚡️ Added Vendor Rate Group Interface
export interface VendorRateGroupData {
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
// VENDOR RATE GROUP API (Outer Table)
// ==========================================

export const getVendorRateGroupsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<VendorRateGroupData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRateGroup/${module}/`, { params });
  return response.data;
};

export const createVendorRateGroupApi = async (
  data: any,
  module: string,
): Promise<VendorRateGroupData> => {
  const response = await api.post(`/vendorRateGroup/${module}/`, data);
  return response.data;
};

export const updateVendorRateGroupApi = async (
  id: number,
  data: any,
  module: string,
): Promise<VendorRateGroupData> => {
  const response = await api.patch(`/vendorRateGroup/${module}/${id}/`, data);
  return response.data;
};

export const deleteVendorRateGroupApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/vendorRateGroup/${module}/${id}/`);
};


// ==========================================
// VENDOR RATE API (Inner Table)
// ==========================================

export const getVendorRatesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<VendorRateData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRate/${module}/`, { params });
  return response.data;
};

export const createVendorRateApi = async (
  data: any,
  module: string,
): Promise<VendorRateData> => {
  const response = await api.post(`/vendorRate/${module}/`, data);
  return response.data;
};

export const updateVendorRateApi = async (
  id: number,
  data: any,
  module: string,
): Promise<VendorRateData> => {
  const response = await api.post(`/vendorRate/upgrade_rate/${module}/${id}/`, data);
  return response.data;
};

export const deleteVendorRateApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/vendorRate/${module}/${id}/`);
};


// ==========================================
// IMPORT & STATUS (Legacy - Will connect when needed)
// ==========================================

export const importVendorRatesApi = async (
  file: File,
  mappingId: string,
): Promise<{ task_id: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mapped", mappingId);

  const response = await api.post(`/vendor-rate/import/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getImportStatusApi = async (taskId: string): Promise<any> => {
  const response = await api.get(`/status/${taskId}/`);
  return response.data;
};