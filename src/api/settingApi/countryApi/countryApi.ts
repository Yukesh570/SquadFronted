import api from "../../axiosInstance";

export interface CountryData {
  id?: number;
  name: string;
  countryCode: string;
  MCC: string;
}
export interface StateData {
  id?: number;
  name: string;
  country: number;
  countryName?: string;
}
export interface StatePaginatedData {
  count: number;
  next: string | null;
  previous: string | null;
  results: StateData[];
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




export const getStateApi = async (module: string): Promise<StatePaginatedData> => {
  const response = await api.get(`/state/${module}/`);
  return response.data;
};

export const createStateApi = async (
  data: Omit<StateData, 'id'>,
  module: string
): Promise<StateData> => {
  const response = await api.post(`/state/${module}/`, data);
  return response.data;
};

export const updateStateApi = async (
  id: number,
  data: Omit<StateData, 'id'>,
  module: string
): Promise<StateData> => {
  const response = await api.patch(`/state/${module}/${id}/`, data);
  return response.data;
};

export const deleteStateApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/state/${module}/${id}/`);
};