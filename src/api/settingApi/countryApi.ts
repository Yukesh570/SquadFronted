import api from "../axiosInstance";

export interface CountryData {
  id?: number;
  name: string;
  code: string;
  mcc: string;
}

export const getCountriesApi = async (module: string): Promise<CountryData[]> => {
  const response = await api.get(`/country/${module}/`);
  return response.data;
};

export const createCountryApi = async (
  data: Omit<CountryData, 'id'>,
  module: string
): Promise<CountryData> => {
  const response = await api.post(`/country/${module}/`, data);
  return response.data;
};

export const updateCountryApi = async (
  id: number,
  data: Omit<CountryData, 'id'>,
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