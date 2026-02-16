import api from "../axiosInstance";

export interface NotificationData {
  id?: number;
  title: string;
  description: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getNotificationApi = async (
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<NotificationData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/notification/`, { params });
  return response.data;
};

// POST
export const createNotificationApi = async (
  data: any,
): Promise<NotificationData> => {
  const response = await api.post(`/notification/`, data);

  return response.data;
};

// PATCH
export const updateTimezoneApi = async (
  id: number,
  data: any,
  module: string,
): Promise<NotificationData> => {
  const response = await api.patch(`/timeZone/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteTimezoneApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/timeZone/${module}/${id}/`);
};
