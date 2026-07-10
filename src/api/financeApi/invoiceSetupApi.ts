import api from "../axiosInstance";

export interface InvoiceSetupData {
  id?: number;
  company: number;
  companyName?: string;
  billingAddressOverride?: string; 
  businessEntity: string | number;
  businessEntityName?: string; // ⚡️ FIX: Added entity name to interface
  invoiceFrequency: string;
  dueDays: number;
  tax?: string;
  isTaxApplied: boolean;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getInvoiceSetupsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<InvoiceSetupData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/invoiceSetup/${module}/`, { params });
  return response.data;
};

// POST
export const createInvoiceSetupApi = async (
  data: any,
  module: string
): Promise<InvoiceSetupData> => {
  const response = await api.post(`/invoiceSetup/${module}/`, data);
  return response.data;
};

// PUT
export const putInvoiceSetupApi = async (
  id: number,
  data: any,
  module: string
): Promise<InvoiceSetupData> => {
  const response = await api.put(`/invoiceSetup/${module}/${id}/`, data);
  return response.data;
};

// PATCH
export const updateInvoiceSetupApi = async (
  id: number,
  data: any,
  module: string
): Promise<InvoiceSetupData> => {
  const response = await api.patch(`/invoiceSetup/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteInvoiceSetupApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/invoiceSetup/${module}/${id}/`);
};