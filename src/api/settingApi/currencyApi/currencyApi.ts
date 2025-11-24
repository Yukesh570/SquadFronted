import api from "../../axiosInstance";

export interface CurrencyData {
  id?: number;
  name: string;
  country: number;
  countryName?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getCurrenciesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<CurrencyData>> => {
    const params: any = {
      page: page,
    page_size: pageSize,
    ...searchParams
    };
  const response = await api.get(`/currency/${module}/`, { params });
  return response.data;
};

// POST
export const createCurrencyApi = async (
  data: any,
  module: string
): Promise<CurrencyData> => {
  const response = await api.post(`/currency/${module}/`, data);
  return response.data;
};

// PATCH
export const updateCurrencyApi = async (
  id: number,
  data: any,
  module: string
): Promise<CurrencyData> => {
  const response = await api.patch(`/currency/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteCurrencyApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/currency/${module}/${id}/`);
};