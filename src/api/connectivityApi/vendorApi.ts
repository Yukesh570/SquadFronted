import api from "../axiosInstance";

// ⚡️ FIX: Added VendorPolicy sub-interface to match backend response exactly
export interface VendorPolicyData {
  id?: number;
  vendor_name?: string;
  rateTps?: number;
  sendQueueLimit?: number;
  delayTime?: number;
  maxSession?: number;
  responseTimeout?: number;
  enquireLinkInterval?: number;
  connectionTimeout?: number;
  maxMessageRetries?: number;
  connectionRetryDelay?: number;
  connectionRetryCount?: number;
  bindRetryDelay?: number;
  bindRetryCount?: number;
  connectionRecoveryDelay?: number;
  logLevel?: string;
  tlvTag?: string;
  tlvValue?: string;
  isDeleted?: boolean;
}

export interface VendorData {
  id?: number;
  company?: number;
  companyName?: string;
  profileName: string;
  vendorRateGroup?: number;
  vendorRateGroupName?: string;
  connectionType: "SMPP" | "HTTP";
  invoicePolicy?: string;
  smpp?: number;
  smppName?: string;
  bindStatus?: string;
  active_session_count?: number;
  max_allowed_sessions?: number;
  maxSession?: number;
  vendorPolicy?: VendorPolicyData;
}

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

// GET - Vendors
export const getVendorsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<VendorData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendor/${module}/`, { params });
  return response.data;
};

// POST - Vendors
export const createVendorApi = async (
  data: any,
  module: string,
): Promise<VendorData> => {
  const response = await api.post(`/vendor/${module}/`, data);
  return response.data;
};

// PATCH - Vendors
export const updateVendorApi = async (
  id: number,
  data: any,
  module: string,
): Promise<VendorData> => {
  const response = await api.patch(`/vendor/${module}/${id}/`, data);
  return response.data;
};

// DELETE - Vendors
export const deleteVendorApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/vendor/${module}/${id}/`);
};

// GET - Vendor Rate Groups
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