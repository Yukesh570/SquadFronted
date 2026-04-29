import api from "../../axiosInstance";

export interface GeneralSettingsData {
  id?: number;
  companyName: string;
  defaultLanguage: string;
  defaultTimezone: string;
  dateFormat: string;
  datetimeFormat: string;
  baseCurrency: string;
  updatedBy?: number;
  updatedAt?: string;
}

// GET
export const getGeneralSettingsApi = async (module: string): Promise<GeneralSettingsData> => {
  const response = await api.get(`/generalSettings/${module}/`);
  return response.data;
};

// PUT
export const putGeneralSettingsApi = async (
  data: Partial<GeneralSettingsData>,
  module: string
): Promise<GeneralSettingsData> => {
  const response = await api.put(`/generalSettings/${module}/`, data);
  return response.data;
};

// PATCH
export const updateGeneralSettingsApi = async (
  data: Partial<GeneralSettingsData>,
  module: string
): Promise<GeneralSettingsData> => {
  const response = await api.patch(`/generalSettings/${module}/`, data);
  return response.data;
};