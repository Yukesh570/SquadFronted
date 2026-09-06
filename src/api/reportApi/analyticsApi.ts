import api from "../axiosInstance";

export interface VendorAnalytics {
  id: string;
  vendorName: string;
  attempts: number;
  successful: number;
  submitted: number;
  dlrPct: number;
  marginUsd: number;
  revenueUsd: number;
  delivered: number;
  avgDeliveryTime: number;
  marginPct: number;
  vendorCost: number;
}

export interface ClientAnalytics {
  id: string;
  clientName: string;
  attempts: number;
  successful: number;
  submitted: number;
  dlrPct: number;
  marginUsd: number;
  revenueUsd: number;
  delivered: number;
  avgDeliveryTime: number;
  marginPct: number;
  vendorCost: number;
  vendors?: VendorAnalytics[];
}

export interface DateAnalytics {
  id: string;
  date: string;
  attempts: number;
  successful: number;
  submitted: number;
  dlrPct: number;
  marginUsd: number;
  revenueUsd: number;
  delivered: number;
  avgDeliveryTime: number;
  marginPct: number;
  vendorCost: number;
  clients?: ClientAnalytics[];
}

export interface AnalyticsFilterParams {
  fromDate?: string;
  toDate?: string;
  groupBy?: string;
}

export const getAnalyticsReportApi = async (
  _moduleName?: string,
  params?: AnalyticsFilterParams
): Promise<DateAnalytics[]> => {
  const response = await api.get(`/report/analytics/`, { params });
  return response.data;
};