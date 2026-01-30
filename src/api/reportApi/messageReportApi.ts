import api from "../../api/axiosInstance";

export interface MessageLogData {
  id: number;
  text: string;
  status: "Queued" | "Sent" | "Delivered" | "Failed";
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET Message Logs
export const getMessageLogsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<MessageLogData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  // Assumes backend endpoint is /report/{module}/message/
  const response = await api.get(`/report/${module}/message/`, { params });
  return response.data;
};

// Export CSV
export const exportMessageLogsApi = async (
  module: string,
  searchParams?: Record<string, any>
) => {
  const response = await api.get(`/report/${module}/message/export/`, {
    params: searchParams,
    responseType: "blob",
  });
  return response.data;
};