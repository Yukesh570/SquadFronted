import api from "../../../api/axiosInstance";

export interface ImportBatchData {
  id?: number;
  sourceType?: string;
  parserProfileId?: number;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  unmappedRows?: number;
  updatedRows?: number;
  newRows?: number;
  currency?: string;
  effectiveDate?: string;
  batchStatus?: "PARSING" | "PARSED" | "READY_FOR_REVIEW" | "AUTO_APPROVED" | "MANUAL_APPROVED" | "PUBLISHED" | "ROLLED_BACK";
  approvalStatus?: "PENDING" | "AUTO_APPROVED" | "MANUAL_APPROVED" | "REJECTED";
  publishedAt?: string;
  vendor?: number;
  mail?: number;
  attachment?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getImportBatchesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ImportBatchData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRateImportBatch/${module}/`, { params });
  return response.data;
};

export const updateImportBatchApi = async (
  id: number,
  data: any,
  module: string
): Promise<ImportBatchData> => {
  const response = await api.patch(`/vendorRateImportBatch/${module}/${id}/`, data);
  return response.data;
};

export const approveAndPublishBatchApi = async (
  batch_id: number
): Promise<any> => {
  const response = await api.post(`/approveAndPublishBatch/${batch_id}/`);
  return response.data;
};