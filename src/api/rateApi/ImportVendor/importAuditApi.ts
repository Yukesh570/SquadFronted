import api from "../../../api/axiosInstance";

export interface ImportAuditData {
  id?: number;
  action?: string;
  actionBy?: string;
  actionTime?: string;
  notes?: string;
  batch?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getImportAuditsApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ImportAuditData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRateImportAudit/`, { params });
  return response.data;
};

export const updateImportAuditApi = async (
  id: number,
  data: any,
  _module?: string
): Promise<ImportAuditData> => {
  const response = await api.patch(`/vendorRateImportAudit/${id}/`, data);
  return response.data;
};