import api from "../axiosInstance";

export interface ClientInvoiceData {
  id?: number;
  accountManager?: number;
  accountManagerName?: string;
  invoiceNumber?: string;
  client: number;
  clientName?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  invoiceDate?: string;
  totalAmount?: string | number;
  totalSegments?: number;
  status?: string;
  invoicePdf?: string;
  downloadUrl?: string;
  createdAt?: string;
  currencyCode?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getClientInvoicesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ClientInvoiceData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/clientInvoice/${module}/`, { params });
  return response.data;
};

export const generateClientInvoiceApi = async (
  data: any,
  action: "PREVIEW" | "GENERATE" = "GENERATE"
): Promise<any> => {
  const payload = {
    ...data,
    action: action 
  };
  
  // FIXED: If we are previewing, tell Axios we are receiving a raw PDF file (blob)
  const config = action === "PREVIEW" ? { responseType: 'blob' as const } : {};
  
  const response = await api.post(`/finance/generate-clientInvoice/`, payload, config);
  return response.data;
};

export const deleteClientInvoiceApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/clientInvoice/${module}/${id}/`);
};