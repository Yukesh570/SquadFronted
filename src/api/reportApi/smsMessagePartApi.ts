import api from "../axiosInstance";

export interface SmsMessagePartData {
  id?: number;
  message?: number | null;
  parent_message_destination?: string | null;
  text?: string | null;
  part_no?: number;
  part_total?: number;
  udh_ref?: number;
  udh_hex?: string | null;
  esm_class?: number;
  short_message?: string | null;
  submit_status?: string;
  vendor_msg_id?: string | null;
  vendor_submit_status?: number | null;
  submit_attempts?: number;
  failure_reason?: string | null;
  submitted_at?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  last_submit_at?: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getSmsMessagePartApi = async (
  moduleName: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<SmsMessagePartData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/smsMessagePart/${moduleName}/`, { params });
  return response.data;
};