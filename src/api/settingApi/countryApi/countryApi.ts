import api from "../../axiosInstance";

export interface CountryData {
  id?: number;
  name: string;
  countryCode: string;
  MCC: string;
} 

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getCountriesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<CountryData>> => {
    const params: any = {
      page: page,
    page_size: pageSize,
    ...searchParams
    };
  const response = await api.get(`/country/${module}/`, { params });
  return response.data;
};

export const createCountryApi = async (
  data: any,
  module: string
): Promise<CountryData> => {
  const response = await api.post(`/country/${module}/`, data);
  return response.data;
};

export const updateCountryApi = async (
  id: number,
  data: any,
  module: string
): Promise<CountryData> => {
  const response = await api.patch(`/country/${module}/${id}/`, data);
  return response.data;
};

export const deleteCountryApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/country/${module}/${id}/`);
};