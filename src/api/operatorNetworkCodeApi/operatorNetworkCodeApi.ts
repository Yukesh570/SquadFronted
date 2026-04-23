import api from "../axiosInstance";

export interface OperatorNetworkCodeData {
  id?: number;
  operator: number;
  operator_name?: string;
  country: number;
  country_name?: string;
  country_iso?: string;
  MCC: string;
  MNC: string;
  networkName: string;
  networkType: "GSM" | "LTE" | "5G" | "CDMA" | "UNKNOWN";
  isPrimary: boolean;
  status: "ACTIVE" | "INACTIVE";
  effectiveFrom?: string;
  effectiveTo?: string;
  notes?: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getOperatorNetworkCodesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<OperatorNetworkCodeData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/operatorNetworkCode/${module}/`, { params });
  return response.data;
};

// POST
export const createOperatorNetworkCodeApi = async (
  data: any,
  module: string
): Promise<OperatorNetworkCodeData> => {
  const response = await api.post(`/operatorNetworkCode/${module}/`, data);
  return response.data;
};

// PUT
export const putOperatorNetworkCodeApi = async (
  id: number,
  data: any,
  module: string
): Promise<OperatorNetworkCodeData> => {
  const response = await api.put(`/operatorNetworkCode/${module}/${id}/`, data);
  return response.data;
};

// PATCH
export const updateOperatorNetworkCodeApi = async (
  id: number,
  data: any,
  module: string
): Promise<OperatorNetworkCodeData> => {
  const response = await api.patch(`/operatorNetworkCode/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteOperatorNetworkCodeApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/operatorNetworkCode/${module}/${id}/`);
};