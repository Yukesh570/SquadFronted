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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getSmtpServersApi = async (module: string, page: number = 1, pageSize: number = 10, searchParams?: Record<string, string>): Promise<PaginatedResponse<SmtpServerData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams
  };
  const response = await api.get(`/emailHost/${module}/`, { params });
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