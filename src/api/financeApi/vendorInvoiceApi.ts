import api from "../axiosInstance";

export interface VendorInvoiceData {
  id?: number;
  accountManager?: number;
  accountManagerName?: string;
  invoiceNumber?: string;
  vendor: number;
  companyName?: string;
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

export const getVendorInvoicesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<VendorInvoiceData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorCompanyInvoice/${module}/`, { params });
  return response.data;
};

export const generateVendorInvoiceApi = async (
  data: any,
  action: "PREVIEW" | "GENERATE" = "GENERATE"
): Promise<any> => {
  const payload = {
    ...data,
    action: action 
  };
  
  const config = action === "PREVIEW" ? { responseType: 'blob' as const } : {};
  
  const response = await api.post(`/finance/generate-vendorInvoice/`, payload, config);
  return response.data;
};

export const deleteVendorInvoiceApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/vendorCompanyInvoice/${module}/${id}/`);
};

export const getVendorsApi = async (
  module: string = "vendor",
  page: number = 1,
  pageSize: number = 1000,
  searchParams?: Record<string, any>
): Promise<any> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  // FIXED: Changed `/${module}/` to `/vendor/${module}/` to match Django's vendor/<str:module>/ pattern
  const response = await api.get(`/vendor/${module}/`, { params });
  return response.data;
};
export const generateVendorCompanyInvoiceApi = async (
  data: any,
  action: "PREVIEW" | "GENERATE" = "GENERATE"
): Promise<any> => {
  const payload = {
    ...data,
    action: action 
  };
  
  const config = action === "PREVIEW" ? { responseType: "blob" as const } : {};
  
  const response = await api.post(`/finance/generate-vendorCompanyInvoice/`, payload, config);
  return response.data;
};
