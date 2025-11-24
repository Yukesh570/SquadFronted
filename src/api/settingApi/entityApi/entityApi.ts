import api from "../../axiosInstance";

export interface EntityData {
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
export const getEntityApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<EntityData>> => {
    const params: any = {
      page: page,
    page_size: pageSize,
    ...searchParams
    };
  const response = await api.get(`/entity/${module}/`, { params });
  return response.data;
};

// POST
export const createEntityApi = async (
  data: any,
  module: string
): Promise<EntityData> => {
  const response = await api.post(`/entity/${module}/`, data);
  return response.data;
};

// PATCH
export const updateEntityApi = async (
  id: number,
  data: any,
  module: string
): Promise<EntityData> => {
  const response = await api.patch(`/entity/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteEntityApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/entity/${module}/${id}/`);
};