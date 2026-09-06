import api from "../../../api/axiosInstance";

export interface EmailSourceData {
  id?: number;
  uniqueId?: string;
  allowedEmail?: string;
  allowedDomain?: string;
  strictDomainMatch?: boolean;
  subjectPattern?: string;
  active?: boolean;
  vendor?: number;
  mappingSetup?: number; // Added field
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getEmailSourcesApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<EmailSourceData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRateEmailSource/`, { params });
  return response.data;
};

export const createEmailSourceApi = async (
  data: any,
  _module?: string
): Promise<EmailSourceData> => {
  const response = await api.post(`/vendorRateEmailSource/`, data);
  return response.data;
};

export const updateEmailSourceApi = async (
  id: number,
  data: any,
  _module?: string
): Promise<EmailSourceData> => {
  const response = await api.patch(`/vendorRateEmailSource/${id}/`, data);
  return response.data;
};

export const deleteEmailSourceApi = async (
  id: number,
  _module?: string
): Promise<void> => {
  await api.delete(`/vendorRateEmailSource/${id}/`);
};