import api from "../axiosInstance";

export interface MessageAttemptData {
  id?: number;
  message?: number | null;
  segment?: number | null;
  attempt_number: number;
  provider?: string | null;
  provider_message_id?: string | null;
  status: string;
  request_payload?: any;
  response_payload?: any;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getMessageAttemptApi = async (
  moduleName: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<MessageAttemptData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/messageAttempt/${moduleName}/`, { params });
  return response.data;
};