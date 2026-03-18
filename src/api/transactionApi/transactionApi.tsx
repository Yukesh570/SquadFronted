import api from "../axiosInstance";

export interface VendorTransactionData {
  id: number;
  vendor: number;
  vendorProfileName: string;
  message: number;
  message_id: string;
  transactionType: string;
  segments: number;
  ratePerSegment: string | number;
  amount: string | number;
  balanceSpent: string | number;
  description: string;
  createdAt: string;
}

export interface ClientTransactionData {
  id: number;
  client: number;
  clientName: string;
  message: number;
  message_id: string;
  transactionType: string;
  segments: number;
  ratePerSegment: string | number;
  amount: string | number;
  balanceSpent: string | number;
  description: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getVendorTransactionsApi = async (
  module: string = "all",
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<VendorTransactionData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorTransaction/${module}/`, { params });
  return response.data;
};

export const getClientTransactionsApi = async (
  module: string = "all",
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ClientTransactionData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/clientTransaction/${module}/`, { params });
  return response.data;
};