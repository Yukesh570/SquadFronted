import api from "../../axiosInstance";
import { actionHelper } from "../../sidebarApi/sideBarApi";

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
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CountryData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/country/${module}/`, { params });
  return response.data;
};

export const createCountryApi = async (
  data: any,
  module: string,
): Promise<CountryData> => {
  const response = await api.post(`/country/${module}/`, data);
  actionHelper(
    "Country",
    "Country created successfully!",
    "Country",
    "Country created successfully!",
  );
  return response.data;
};

export const updateCountryApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CountryData> => {
  const response = await api.patch(`/country/${module}/${id}/`, data);
  actionHelper(
    "Country",
    "Country updated successfully!",
    "Country",
    "Country updated successfully!",
  );
  return response.data;
};

export const deleteCountryApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/country/${module}/${id}/`);
  actionHelper("Country", "Country deleted!", "Country", "Country deleted!");
};

// Import API
export const importCountryApi = async (formData: FormData): Promise<any> => {
  const response = await api.post(`/country/import`, formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
  actionHelper(
    "Country",
    "Country imported successfully!",
    "Country",
    "Country imported successfully!",
  );
  return response.data;
};

// Status API
export const getImportStatusApi = async (taskId: string): Promise<any> => {
  const response = await api.get(`/status/${taskId}/`);
  return response.data;
};
