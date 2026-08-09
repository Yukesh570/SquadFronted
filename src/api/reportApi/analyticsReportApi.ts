import axiosInstance from "../axiosInstance";

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  group_by?: string;
  client_name?: string;
  vendor_name?: string;
  client_company?: string;
  vendor_company?: string;
  country_name?: string;
  account_manager?: string;
  page_size?: number;
  page?: number;
}

/**
 * Fetch dates list for Level 0
 * GET /api/reports/analytics/dates/
 */
export const getAnalyticsDatesApi = async (params?: AnalyticsParams) => {
  const response = await axiosInstance.get("/api/reports/analytics/dates/", { params });
  return response.data;
};

/**
 * Fetch analytics data aggregated by group_by & filters
 * GET /api/reports/analytics/
 */
export const getAnalyticsDataApi = async (params?: AnalyticsParams) => {
  const response = await axiosInstance.get("/api/reports/analytics/", { params });
  return response.data;
};