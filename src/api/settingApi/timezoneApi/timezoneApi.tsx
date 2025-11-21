import api from "../../axiosInstance";

export interface TimezoneData {
  id?: number;
  name: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getTimezoneApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<TimezoneData>> => {
  const response = await api.get(
    `/timeZone/${module}/?page=${page}&page_size=${pageSize}`
  );
  return response.data;
};

// POST
export const createTimezoneApi = async (
  data: any,
  module: string
): Promise<TimezoneData> => {
  const response = await api.post(`/timeZone/${module}/`, data);
  return response.data;
};

// PATCH
export const updateTimezoneApi = async (
  id: number,
  data: any,
  module: string
): Promise<TimezoneData> => {
  const response = await api.patch(`/timeZone/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteTimezoneApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/timeZone/${module}/${id}/`);
};
