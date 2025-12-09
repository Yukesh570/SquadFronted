import api from "../axiosInstance";

export interface MappingSetupData {
  id?: number;
  ratePlan: string;
  country: string;
  countryCode: string;
  timeZone: string;
  network: string;
  MCC: string;
  MNC: string;
  rate: string;
  dateTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getMappingSetupsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<MappingSetupData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/mappingSetup/${module}/`, { params });
  return response.data;
};

// POST
export const createMappingSetupApi = async (
  data: any,
  module: string
): Promise<MappingSetupData> => {
  const response = await api.post(`/mappingSetup/${module}/`, data);
  return response.data;
};

// PATCH
export const updateMappingSetupApi = async (
  id: number,
  data: any,
  module: string
): Promise<MappingSetupData> => {
  const response = await api.patch(`/mappingSetup/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteMappingSetupApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/mappingSetup/${module}/${id}/`);
};