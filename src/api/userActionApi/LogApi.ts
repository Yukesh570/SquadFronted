import api from "../axiosInstance";

export interface UserActionData {
  id?: number;
  username?: string;
  title: string;
  action: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getUserActionApi = async (
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<UserActionData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/userActionLog/`, { params });
  console.log("11111111111111111111111", response.data);
  return response.data;
};

// POST
export const createUserActionApi = async (
  data: any,
): Promise<UserActionData> => {
  const response = await api.post(`/userActionLog/`, data);

  return response.data;
};

// PATCH
export const updateTimezoneApi = async (
  id: number,
  data: any,
  module: string,
): Promise<UserActionData> => {
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
