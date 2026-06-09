import api from "../axiosInstance";

export interface SmsStatsData {
  count: number;
  deliveredCount: number;
  failedCount: number;
  deliveryRate: number;
}

export interface SmsHourlyData {
  hour: string;
  count: number;
}

export interface DlrStatsData {
  deliveredPercent: number;
  failedPercent: number;
  pendingPercent: number;
  rejectedPercent: number;
}

export const getSmsStatsApi = async (
  searchParams?: Record<string, any>
): Promise<SmsStatsData> => {
  const response = await api.get("/smppSMSCounts/", { params: searchParams });
  return response.data;
};

export const getSmsHourlyApi = async (
  searchParams?: Record<string, any>
): Promise<SmsHourlyData[]> => {
  const response = await api.get("/smppSMSHourly/", { params: searchParams });
  return response.data;
};

export const getDlrStatsApi = async (
  searchParams?: Record<string, any>
): Promise<DlrStatsData> => {
  const response = await api.get("/smppSMSDlrStats/", { params: searchParams });
  return response.data;
};

export interface RevenueData {
  total_revenue: number;
  total_cost: number;
  gross_margin: number;
  margin_pct: number;
}

export const getRevenueApi = async (
  searchParams?: Record<string, any>
): Promise<RevenueData> => {
  const response = await api.get("/smppSMSRevenue/", { params: searchParams });
  return response.data;
};