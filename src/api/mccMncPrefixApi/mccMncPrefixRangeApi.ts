import api from "../axiosInstance";

export interface MccMncPrefixRangeData {
  id?: number;
  countryName?: string; // read-only, response only — derived from `country` FK, never sent in POST/PATCH/PUT
  mccmnc?: string;
  externalPrefixId?: number;
  operatorPrefixStartRange?: number;
  operatorPrefixEndRange?: number;
  status?: "ACTIVE" | "INACTIVE";
  sourceFileName?: string;
  remark?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  country?: number;
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
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<MccMncPrefixRangeData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/mccMncPrefixRange/`, { params });
  return response.data;
};

export const updateMccMncPrefixRangeApi = async (
  id: number,
  data: any,
  _module?: string
): Promise<MccMncPrefixRangeData> => {
  const response = await api.patch(`/mccMncPrefixRange/${id}/`, data);
  return response.data;
};

export const createMccMncPrefixRangeApi = async (
  data: any,
  _module?: string
): Promise<MccMncPrefixRangeData> => {
  const response = await api.post(`/mccMncPrefixRange/`, data);
  return response.data;
};

export const deleteMccMncPrefixRangeApi = async (
  id: number,
  _module?: string
): Promise<void> => {
  await api.delete(`/mccMncPrefixRange/${id}/`);
};