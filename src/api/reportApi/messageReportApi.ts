import api from "../../api/axiosInstance";
import { actionHelper } from "../sidebarApi/sideBarApi";

export interface MessageLogData {
  id: number;
  destination: string;
  text: string;
  status: "queued" | "sent" | "failed" | "delivered";
  message_id: string;
  encoding?: string;
  segmentNumber?: string;
  characterCount?: string;

  clientName?: string;
  vendorName?: string;
  smppName?: string;
  systemId?: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getMessageLogsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<MessageLogData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/smppSMS/${module}/`, { params });
  return response.data;
};

export const exportMessageLogsApi = async (
  module: string,
  searchParams?: Record<string, any>,
) => {
  const response = await api.get(`/smppSMS/${module}/export/`, {
    params: searchParams,
    responseType: "blob",
  });
  actionHelper(
    "Message Logs",
    "Message Logs exported successfully!",
    "Message Logs",
    "Message Logs exported successfully!",
  );
  return response.data;
};
