import api from "../../axiosInstance";

export interface EntityData {
  id?: number;
  companyName: string;
  legalEntityName?: string;
  weekCommencing: string;
  vatRegistrationNumber?: string;
  phone?: string;
  emailAddress?: string;
  businessAddress?: string;
  bankAccountDetail?: string;
  companyLogo?: string;
  companyLogoPath?: string;
  isDeleted?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getEntityApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<EntityData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/entity/`, { params });
  return response.data;
};

export const createEntityApi = async (
  data: any,
  _module?: string,
): Promise<EntityData> => {
  // FIXED: If data is FormData (contains a file), set the correct multipart headers
  const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const response = await api.post(`/entity/`, data, config);
  return response.data;
};

export const updateEntityApi = async (
  id: number,
  data: any,
  _module?: string,
): Promise<EntityData> => {
  // FIXED: If data is FormData (contains a file), set the correct multipart headers
  const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const response = await api.patch(`/entity/${id}/`, data, config);
  return response.data;
};

export const deleteEntityApi = async (
  id: number,
  _module?: string,
): Promise<void> => {
  await api.delete(`/entity/${id}/`);
};