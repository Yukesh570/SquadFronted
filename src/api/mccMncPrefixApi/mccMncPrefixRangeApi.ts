import api from "../axiosInstance";

export interface MccMncPrefixRangeData {
  id?: number;
  externalPrefixId?: number;
  operatorName?: string;
  operatorPrefixStartRange?: number;
  operatorPrefixEndRange?: number;
  status?: "ACTIVE" | "INACTIVE";
  sourceFileName?: string;
  remark?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  operator?: number;
  importBatch?: number;
  createdBy?: number;
  updatedBy?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getMccMncPrefixRangesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<MccMncPrefixRangeData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/mccMncPrefixRange/${module}/`, { params });
  return response.data;
};

export const updateMccMncPrefixRangeApi = async (
  id: number,
  data: any,
  module: string
): Promise<MccMncPrefixRangeData> => {
  const response = await api.patch(`/mccMncPrefixRange/${module}/${id}/`, data);
  return response.data;
};

export const createMccMncPrefixRangeApi = async (
  data: any,
  module: string
): Promise<MccMncPrefixRangeData> => {
  const response = await api.post(`/mccMncPrefixRange/${module}/`, data);
  return response.data;
};