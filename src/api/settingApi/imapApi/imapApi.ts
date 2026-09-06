import api from "../../axiosInstance";

export interface ImapServerData {
  id?: number;
  name: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword?: string; // Optional on frontend to prevent displaying plaintext
  security: "TLS" | "SSL" | "NONE";
  active?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getImapServersApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, string>,
): Promise<PaginatedResponse<ImapServerData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/imapHost/`, { params });
  return response.data;
};

export const createImapServerApi = async (
  data: Omit<ImapServerData, "id">,
  _module?: string,
): Promise<ImapServerData> => {
  const response = await api.post(`/imapHost/`, data);
  return response.data;
};

export const updateImapServerApi = async (
  id: number,
  data: Omit<ImapServerData, "id">,
  _module?: string,
): Promise<ImapServerData> => {
  const response = await api.patch(`/imapHost/${id}/`, data);
  return response.data;
};

export const deleteImapServerApi = async (
  id: number,
  _module?: string,
): Promise<void> => {
  await api.delete(`/imapHost/${id}/`);
};