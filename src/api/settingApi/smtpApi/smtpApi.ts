import api from "../../axiosInstance";

export interface SmtpServerData {
  id?: number;
  name: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  security: "TLS" | "SSL";
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getSmtpServersApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, string>,
): Promise<PaginatedResponse<SmtpServerData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/emailHost/`, { params });
  return response.data;
};

export const createSmtpServerApi = async (
  data: Omit<SmtpServerData, "id">,
  _module?: string,
): Promise<SmtpServerData> => {
  const response = await api.post(`/emailHost/`, data);
  return response.data;
};

export const updateSmtpServerApi = async (
  id: number,
  data: Omit<SmtpServerData, "id">,
  _module?: string,
): Promise<SmtpServerData> => {
  const response = await api.patch(`/emailHost/${id}/`, data);
  return response.data;
};

export const deleteSmtpServerApi = async (
  id: number,
  _module?: string,
): Promise<void> => {
  await api.delete(`/emailHost/${id}/`);
};

// --- NEW: Test Email API ---
export interface TestEmailPayload {
  emailHost: number;
  fromEmail: string;
  recipientEmail: string;
  subject: string;
  content: string;
}

export const sendTestEmailApi = async (data: FormData | Record<string, any>): Promise<any> => {
  const response = await api.post(`/email/`, data);
  return response.data;
};