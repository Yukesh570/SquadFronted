import api from "../../axiosInstance";

export interface SmtpServerData {
  id?: number;
  name: string;      
  smtpHost: string; 
  smtpPort: number;
  smtpUser: string; 
  smtpPassword: string;
  security: 'TLS' | 'SSL';
}

export const getSmtpServersApi = async (module: string): Promise<SmtpServerData[]> => {
  const response = await api.get(`/emailHost/${module}/`);
  return response.data;
};

export const createSmtpServerApi = async (
  data: Omit<SmtpServerData, 'id'>,
  module: string
): Promise<SmtpServerData> => {
  const response = await api.post(`/emailHost/${module}/`, data);
  return response.data;
};

export const updateSmtpServerApi = async (
  id: number,
  data: Omit<SmtpServerData, 'id'>,
  module: string
): Promise<SmtpServerData> => {
  const response = await api.patch(`/emailHost/${module}/${id}/`, data);
  return response.data;
};

export const deleteSmtpServerApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/emailHost/${module}/${id}/`);
};