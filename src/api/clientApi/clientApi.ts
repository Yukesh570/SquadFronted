import api from "../../api/axiosInstance";

export interface ClientPolicyData {
  id?: number;
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
}

export interface ClientData {
  id?: number;
  company: number;
  companyName?: string;
  routeGroup?: number;
  routeGroupName?: string;
  customerRateGroup?: number;
  customerRateGroupName?: string;
  name: string;
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  bindStatus: "ONLINE" | "OFFLINE";
  route: "DIRECT" | "HIGH QUALITY" | "SIM" | "WHOLESALE" | "FULL" | "SPAM";
  paymentTerms: "PREPAID" | "POSTPAID" | "NET7" | "NET15" | "NET30";
  invoicePolicy: "ON_ATTEMPT" | "ON_SUBMIT" | "ON_DELIVERED" | string;
  allowNetting: boolean;
  enableDlr: boolean;
  session: string;
  smppUsername?: string;
  smppPassword?: string;
  internalNotes?: string;
  createdAt?: string;
  clientPolicy?: ClientPolicyData; 
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
  searchParams?: Record<string, any>,
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
  module: string,
): Promise<ClientData> => {
  const response = await api.post(`/client/${module}/`, data);
  return response.data;
};

// PUT
export const putClientApi = async (
  id: number,
  data: any,
  module: string,
): Promise<ClientData> => {
  const response = await api.put(`/client/${module}/${id}/`, data);
  return response.data;
};

// PATCH
export const updateClientApi = async (
  id: number,
  data: any,
  module: string,
): Promise<ClientData> => {
  const response = await api.patch(`/client/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteClientApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/client/${module}/${id}/`);
};

// --- NEW: Generate Credentials API ---
export const generateCredentialsApi = async (): Promise<{ username: string; password: string }> => {
  const response = await api.get(`/generate-credentials`);
  return response.data;
};

// --- NEW: Send Details Email API ---
export const sendClientDetailsEmailApi = async (data: {
  templateName: string;
  clientId: number;
}) => {
  const response = await api.post(`/sendMailToClient/`, data);
  return response.data;
};

// --- NEW: Client Rate Overview API ---
export const getClientRateOverViewApi = async (params: {
  client: number;
  routeGroup: string;
  customerRateGroup: string; 
}) => {
  const response = await api.get(`/clientRateOverView/`, { params });
  return response.data;
};