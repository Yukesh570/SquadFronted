import api from "../axiosInstance";

export interface ClientInvoiceData {
  id?: number;
  invoiceNumber?: string;
  client: number;
  clientName?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  invoiceDate?: string;
  totalAmount?: string | number;
  status?: string;
  invoicePdf?: string;
  downloadUrl?: string;
  createdAt?: string;
  createdByName?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET Table Data
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

// POST Generate or Preview
export const generateClientInvoiceApi = async (
  data: any,
  action: "PREVIEW" | "GENERATE" = "GENERATE"
): Promise<any> => {
  // FIXED: The backend expects the action inside the JSON body, NOT the URL!
  const payload = {
    ...data,
    action: action 
  };
  const response = await api.post(`/finance/generate-invoice/`, payload);
  return response.data;
};

// DELETE
export const deleteClientInvoiceApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/clientInvoice/${module}/${id}/`);
};