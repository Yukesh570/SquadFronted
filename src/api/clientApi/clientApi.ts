import api from "../../api/axiosInstance";

export interface ClientData {
  id?: number;
  company: number; 
  companyName?: string; 
  name: string;
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  route: "DIRECT" | "HIGH QUALITY" | "SIM" | "WHOLESALE" | "FULL" | "SPAM";
  paymentTerms: "PREPAID" | "POSTPAID" | "NET7" | "NET15" | "NET30";
  creditLimit: string; 
  balanceAlertAmount: string; 
  allowNetting: boolean;

  ipWhitelist: string | string[]; 
  
  smppUsername?: string;
  smppPassword?: string; 
  internalNotes?: string; 
  createdAt?: string; 
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
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

// POST
export const createClientApi = async (
  data: any,
  module: string
): Promise<ClientData> => {
  const response = await api.post(`/client/${module}/`, data);
  return response.data;
};

// PUT
export const putClientApi = async (
  id: number,
  data: any,
  module: string
): Promise<ClientData> => {
  const response = await api.put(`/client/${module}/${id}/`, data);
  return response.data;
};

// PATCH
export const updateClientApi = async (
  id: number,
  data: any,
  module: string
): Promise<ClientData> => {
  const response = await api.patch(`/client/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteClientApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/client/${module}/${id}/`);
};