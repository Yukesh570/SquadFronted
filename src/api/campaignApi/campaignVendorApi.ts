import api from "../axiosInstance";

export interface templateData {
  id?: number;
  name: string;
  content: string;
}

export interface CampaignVendorFormData {
  id?: number;
  name: string;
  vendor?: number;
  vendorName?: string;
  objective: string;
  schedule: string;
  content: string;
  template?: number | string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  module?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getTemplatesApi = async (
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<templateData> | templateData[]> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/template/`, { params });
  return response.data;
};

export const getCampaignVendorsApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CampaignVendorFormData> | CampaignVendorFormData[]> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/campaignVendor/${module}/`, { params });
  return response.data;
};

export const createCampaignVendorApi = async (data: FormData, module: string) => {
  const response = await api.post(`/campaignVendor/${module}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateCampaignVendorApi = async (
  id: number,
  data: FormData,
  module: string,
) => {
  const response = await api.patch(`/campaignVendor/${module}/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCampaignVendorApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/campaignVendor/${module}/${id}/`);
};