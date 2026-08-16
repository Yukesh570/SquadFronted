import api from "../axiosInstance";

export interface RejectedSMSLogData {
  id?: number;
  timestamp: string;
  client?: number | null;
  client_name?: string | null;
  system_id?: string | null;
  source_addr?: string | null;
  destination_addr?: string | null;
  message_id?: string | null;
  reason?: string | null;
  required_amount?: string | number | null;
  available_credit?: string | number | null;
  credit_limit?: string | number | null;
  used_credit?: string | number | null;
  smpp_command_status?: number | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getRejectedSMSLogApi = async (
  moduleName: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<RejectedSMSLogData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/rejectedSMSLog/${moduleName}/`, { params });
  return response.data;
};
