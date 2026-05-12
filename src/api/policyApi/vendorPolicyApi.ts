import api from "../axiosInstance";

export interface VendorPolicyData {
  id?: number;
  vendor: number;
  vendor_name?: string;
  sourceAddrTon?: number;
  sourceAddrNpi?: number;
  destAddrTon?: number;
  destAddrNpi?: number;
  addrTon?: number;
  addrNpi?: number;
  rateTps?: number;
  maxSession?: number; // FIX: Added maxSession to the interface mapping
  sendQueueLimit?: number;
  delayTime?: number;
  responseTimeout?: number;
  enquireLinkInterval?: number;
  connectionTimeout?: number;
  connectionRetryDelay?: number;
  connectionRetryCount?: number;
  bindRetryDelay?: number;
  bindRetryCount?: number;
  connectionRecoveryDelay?: number;
  logLevel?: string;
  tlvTag?: string;
  tlvValue?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getVendorPoliciesApi = async (
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<VendorPolicyData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorPolicy/`, { params });
  return response.data;
};

// POST
export const createVendorPolicyApi = async (
  data: any,
): Promise<VendorPolicyData> => {
  const response = await api.post(`/vendorPolicy/`, data);
  return response.data;
};

// PUT
export const putVendorPolicyApi = async (
  id: number,
  data: any,
): Promise<VendorPolicyData> => {
  const response = await api.put(`/vendorPolicy/${id}/`, data);
  return response.data;
};

// PATCH
export const updateVendorPolicyApi = async (
  id: number,
  data: any,
): Promise<VendorPolicyData> => {
  const response = await api.patch(`/vendorPolicy/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteVendorPolicyApi = async (id: number): Promise<void> => {
  await api.delete(`/vendorPolicy/${id}/`);
};