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
  exchangeRateToBase: string | number;
  amount: string | number;
  baseAmount: string | number;

  balanceSpent: string | number;
  description: string;
  createdAt: string;
  chargePolicy?: string;
  status?: string;
  currency?: string;
  currencyCode?: string;
  baseCurrencyCode?: string;
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
  exchangeRateToBase: string | number;
  amount: string | number;
  baseAmount: string | number;

  balanceSpent: string | number;
  description: string;
  createdAt: string;
  chargePolicy?: string;
  status?: string;
  currency?: string;
  currencyCode?: string;
  baseCurrencyCode?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getVendorTransactionsApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<VendorTransactionData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorTransaction/`, { params });
  return response.data;
};

export const getClientTransactionsApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ClientTransactionData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/clientTransaction/`, { params });
  return response.data;
};