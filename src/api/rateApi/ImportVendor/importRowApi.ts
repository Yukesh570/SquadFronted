import api from "../../../api/axiosInstance";

export interface ImportRowData {
  id?: number;
  rowNo?: number;
  rawRatePlan?: string;
  rawDestination?: string;
  rawOperator?: string;
  rawMcc?: string;
  rawMnc?: string;
  rawTimeZone?: string;
  rawCountryCode?: string;
  importedCountryCode?: number;
  normalizedTimeZoneId?: number;
  normalizedCountryId?: number;
  normalizedOperatorId?: number;
  normalizedMcc?: string;
  normalizedMnc?: string;
  destinationKey?: string;
  importedRate?: string | number;
  currency?: string;
  rowStatus?: "VALID" | "INVALID" | "UNMAPPED" | "UNCHANGED" | "UPDATED" | "NEW";
  diffType?: "VALID" | "INVALID" | "UNMAPPED" | "UNCHANGED" | "UPDATED" | "NEW";
  validationError?: string;
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

export const getImportRowsApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<ImportRowData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRateImportRow/`, { params });
  return response.data;
};

export const updateImportRowApi = async (
  id: number,
  data: any,
  _module?: string
): Promise<ImportRowData> => {
  const response = await api.patch(`/vendorRateImportRow/${id}/`, data);
  return response.data;
};