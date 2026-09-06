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
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<InvoiceSetupData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/invoiceSetup/`, { params });
  return response.data;
};

// POST
export const createInvoiceSetupApi = async (
  data: any,
  _module?: string
): Promise<InvoiceSetupData> => {
  const response = await api.post(`/invoiceSetup/`, data);
  return response.data;
};

// PUT
export const putInvoiceSetupApi = async (
  id: number,
  data: any,
  _module?: string
): Promise<InvoiceSetupData> => {
  const response = await api.put(`/invoiceSetup/${id}/`, data);
  return response.data;
};

// PATCH
export const updateInvoiceSetupApi = async (
  id: number,
  data: any,
  _module?: string
): Promise<InvoiceSetupData> => {
  const response = await api.patch(`/invoiceSetup/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteInvoiceSetupApi = async (
  id: number,
  _module?: string
): Promise<void> => {
  await api.delete(`/invoiceSetup/${id}/`);
};