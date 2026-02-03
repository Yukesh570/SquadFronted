import api from "../../api/axiosInstance";

export interface MessageLogData {
  id?: number;
  destination: string;
  text: string;
  status: "queued" | "sent" | "failed" | "delivered";
  // Read-only fields from GET response
  clientName?: string;
  vendorName?: string;
  smppName?: string;
  // Writable fields for POST/PUT
  systemId: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
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
  const response = await api.get(`/smppSMS/${module}/`, { params });
  return response.data;
};

// POST
export const createMessageLogApi = async (
  data: any,
  module: string
): Promise<MessageLogData> => {
  const response = await api.post(`/smppSMS/${module}/`, data);
  return response.data;
};

// PATCH (Update)
export const updateMessageLogApi = async (
  id: number,
  data: any,
  module: string
): Promise<MessageLogData> => {
  const response = await api.patch(`/smppSMS/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteMessageLogApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/smppSMS/${module}/${id}/`);
};

// EXPORT
export const exportMessageLogsApi = async (
  module: string,
  searchParams?: Record<string, any>
) => {
  const response = await api.get(`/smppSMS/${module}/export/`, {
    params: searchParams,
    responseType: "blob",
  });
  return response.data;
};