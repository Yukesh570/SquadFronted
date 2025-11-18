import api from "../axiosInstance";

export interface EmailTemplateData {
  id?: number;
  name: string;
  content: string;
  is_active: boolean;
}

export const getEmailTemplatesApi = async (module: string): Promise<EmailTemplateData[]> => {
  const response = await api.get(`/emailTemplate/${module}/`);
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