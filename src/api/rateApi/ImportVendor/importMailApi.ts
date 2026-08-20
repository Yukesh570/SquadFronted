import api from "../../axiosInstance";

export interface ImportMailData {
  id?: number;
  messageId?: string;
  senderEmail?: string;
  subject?: string;
  receivedAt?: string;
  rawMailPath?: string;
  dedupeHash?: string;
  status?: "RECEIVED" | "IDENTIFIED" | "DUPLICATE" | "MANUAL_REVIEW" | "FAILED";
  vendor?: number;
  failureReason?: string;
  sourceProfile?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getImportMailsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ImportMailData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRateImportMail/${module}/`, { params });
  return response.data;
};

export const updateImportMailApi = async (
  id: number,
  data: any,
  module: string
): Promise<ImportMailData> => {
  const response = await api.patch(`/vendorRateImportMail/${module}/${id}/`, data);
  return response.data;
};