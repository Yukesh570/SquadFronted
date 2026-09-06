import api from "../axiosInstance";

export interface SmppData {
  id?: number;
  smppHost: string;
  smppPort: number;
  systemID: string;
  password?: string;
  bindMode: 'TRANSMITTER' | 'RECEIVER' | 'TRANSCEIVER';
  sourceTON: number; 
  sourceNPI: number; 
  destTON: number;   
  destNPI: number;   
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET LIST
export const getSmppApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, string>
): Promise<PaginatedResponse<SmppData>> => {
  const params : any = {
    page: page,
    page_size: pageSize,
    ...searchParams
  };
  const response = await api.get(`/smpp/`, { params });
  return response.data;
};

export const getSmppByIdApi = async (
  id: number,
  _module?: string
): Promise<SmppData> => {
  const response = await api.get(`/smpp/${id}/`);
  return response.data;
};

// POST
export const createSmppApi = async (
  data: any, 
  _module?: string
): Promise<SmppData> => {
  const response = await api.post(`/smpp/`, data);
  return response.data;
};

// PATCH
export const updateSmppApi = async (
  id: number, 
  data: any, 
  _module?: string
): Promise<SmppData> => {
  const response = await api.patch(`/smpp/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteSmppApi = async (
  id: number, 
  _module?: string
): Promise<void> => {
  await api.delete(`/smpp/${id}/`);
};