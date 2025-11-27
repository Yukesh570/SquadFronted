import api from "../axiosInstance";

export interface ClientData {
  id?: number;
  // Identity
  company: number; // Integer as per Schema
  companyName?: string; // Read-only string
  name: string;
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  route: "DIRECT" | "HIGH QUALITY" | "SIM" | "WHOLESALE" | "FULL" | "SPAM";

  // Commercials & Credit
  paymentTerms: "PREPAID" | "POSTPAID" | "NET7" | "NET15" | "NET30";
  creditLimit: string; // String/Decimal
  balanceAlertAmount: string; // String/Decimal
  allowNetting: boolean;

  // Connectivity & Security
  ipWhitelist: string;
  smppUsername?: string;
  smppPassword?: string; // Write-only generally, but part of request body

  // Notes
  internalNotes?: string; // Matched strictly to "internalNotes"

  // System
  createdAt?: string; // Added based on response schema
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET /client/{module}/
export const getClientsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ClientData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/client/${module}/`, { params });
  return response.data;
};

// POST /client/{module}/
export const createClientApi = async (
  data: any,
  module: string
): Promise<ClientData> => {
  const response = await api.post(`/client/${module}/`, data);
  return response.data;
};

// PUT /client/{module}/{id}/
export const putClientApi = async (
  id: number,
  data: any,
  module: string
): Promise<ClientData> => {
  const response = await api.put(`/client/${module}/${id}/`, data);
  return response.data;
};

// PATCH /client/{module}/{id}/
export const updateClientApi = async (
  id: number,
  data: any,
  module: string
): Promise<ClientData> => {
  const response = await api.patch(`/client/${module}/${id}/`, data);
  return response.data;
};

// DELETE /client/{module}/{id}/
export const deleteClientApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/client/${module}/${id}/`);
};