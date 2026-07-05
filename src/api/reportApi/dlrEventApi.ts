import api from "../axiosInstance";

export interface DLREventData {
  id?: number;
  message?: number | null;
  segment?: number | null;
  vendorMessageId?: string | null;
  event_type: string;
  segment_number?: number | null;
  status_code?: string | null;
  status_description?: string | null;
  raw_payload?: any;
  received_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getDLREventApi = async (
  moduleName: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<DLREventData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/dlrEvent/${moduleName}/`, { params });
  return response.data;
};