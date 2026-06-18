import api from "../../../api/axiosInstance";

export interface ImportAttachmentData {
  id?: number;
  fileName?: string;
  fileType?: string;
  fileHash?: string;
  localPath?: string;
  parseStatus?: "PENDING" | "PARSED" | "FAILED" | "MANUAL_REVIEW";
  mail?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getImportAttachmentsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ImportAttachmentData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRateImportAttachment/${module}/`, { params });
  return response.data;
};

export const updateImportAttachmentApi = async (
  id: number,
  data: any,
  module: string
): Promise<ImportAttachmentData> => {
  const response = await api.patch(`/vendorRateImportAttachment/${module}/${id}/`, data);
  return response.data;
};