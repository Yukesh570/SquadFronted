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
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<ClientPolicyData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/clientPolicy/`, { params });
  return response.data;
};

// POST
export const createClientPolicyApi = async (
  data: any,
): Promise<ClientPolicyData> => {
  const response = await api.post(`/clientPolicy/`, data);
  return response.data;
};

// PUT
export const putClientPolicyApi = async (
  id: number,
  data: any,
): Promise<ClientPolicyData> => {
  const response = await api.put(`/clientPolicy/${id}/`, data);
  return response.data;
};

// PATCH
export const updateClientPolicyApi = async (
  id: number,
  data: any,
): Promise<ClientPolicyData> => {
  const response = await api.patch(`/clientPolicy/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteClientPolicyApi = async (id: number): Promise<void> => {
  await api.delete(`/clientPolicy/${id}/`);
};
