import api from "../axiosInstance";

export interface ClientPolicyData {
  id?: number;
  client: number;
  client_name?: string;
  maxTps?: number;
  maxQueueDepth?: number;
  maxWindowPerSession?: number;
  maxWindowGlobal?: number;
  maxSessions?: number;
  idleTimeoutSec?: number;
  submitTimeoutSec?: number;
  senderIdPolicy?: string;
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
export const getClientPoliciesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ClientPolicyData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/clientPolicy/${module}/`, { params });
  return response.data;
};

// POST
export const createClientPolicyApi = async (
  data: any,
  module: string
): Promise<ClientPolicyData> => {
  const response = await api.post(`/clientPolicy/${module}/`, data);
  return response.data;
};

// PUT
export const putClientPolicyApi = async (
  id: number,
  data: any,
  module: string
): Promise<ClientPolicyData> => {
  const response = await api.put(`/clientPolicy/${module}/${id}/`, data);
  return response.data;
};

// PATCH
export const updateClientPolicyApi = async (
  id: number,
  data: any,
  module: string
): Promise<ClientPolicyData> => {
  const response = await api.patch(`/clientPolicy/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteClientPolicyApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/clientPolicy/${module}/${id}/`);
};