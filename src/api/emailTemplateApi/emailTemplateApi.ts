import api from "../axiosInstance";

export interface EmailTemplateData {
  id?: number;
  name: string;
  content: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getEmailTemplatesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<EmailTemplateData>> => {
  const response = await api.get(`/emailTemplate/${module}/?page=${page}&page_size=${pageSize}`);
  return response.data;
};

export const createEmailTemplateApi = async (
  data: Omit<EmailTemplateData, 'id'>,
  module: string
): Promise<EmailTemplateData> => {
  const response = await api.post(`/emailTemplate/${module}/`, data);
  return response.data;
};

export const updateEmailTemplateApi = async (
  id: number,
  data: Omit<EmailTemplateData, 'id'>,
  module: string
): Promise<EmailTemplateData> => {
  const response = await api.patch(`/emailTemplate/${module}/${id}/`, data);
  return response.data;
};

export const deleteEmailTemplateApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/emailTemplate/${module}/${id}/`);
};