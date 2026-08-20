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
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, string>,
): Promise<PaginatedResponse<ImapServerData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/imapHost/${module}/`, { params });
  return response.data;
};

export const createImapServerApi = async (
  data: Omit<ImapServerData, "id">,
  module: string,
): Promise<ImapServerData> => {
  const response = await api.post(`/imapHost/${module}/`, data);
  return response.data;
};

export const updateImapServerApi = async (
  id: number,
  data: Omit<ImapServerData, "id">,
  module: string,
): Promise<ImapServerData> => {
  const response = await api.patch(`/imapHost/${module}/${id}/`, data);
  return response.data;
};

export const deleteImapServerApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/imapHost/${module}/${id}/`);
};
