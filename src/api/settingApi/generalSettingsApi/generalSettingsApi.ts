import api from "../../axiosInstance";

export interface GeneralSettingsData {
  id?: number;
  companyName: string;
  defaultLanguage: string;
  defaultTimezone: string;
  dateFormat: string;
  datetimeFormat: string;
  baseCurrency: number | string; // ⚡️ FIX: Now accepts numeric ID
  baseCurrency_name?: string;    // ⚡️ FIX: Added response mapping
  baseCurrency_code?: string;
  currencyApi?: string;
  apiKey?: string;
  updatedBy?: number;
  updatedAt?: string;
}

export interface DashboardImageData {
  id?: number;
  image: string;
  updatedBy?: number;
  updatedAt?: string;
}

// GET (Authenticated)
export const getGeneralSettingsApi = async (module: string): Promise<GeneralSettingsData> => {
  const response = await api.get(`/generalSettings/${module}/`);
  return response?.data;
};

// POST (Authenticated)
export const createGeneralSettingsApi = async (
  data: Partial<GeneralSettingsData>,
  module: string
): Promise<GeneralSettingsData> => {
  const response = await api.post(`/generalSettings/${module}/`, data);
  return response?.data;
};

// PUT (Authenticated)
export const putGeneralSettingsApi = async (
  data: Partial<GeneralSettingsData>,
  module: string
): Promise<GeneralSettingsData> => {
  const response = await api.put(`/generalSettings/${module}/`, data);
  return response?.data;
};

// PATCH (Authenticated)
export const updateGeneralSettingsApi = async (
  data: Partial<GeneralSettingsData>,
  module: string
): Promise<GeneralSettingsData> => {
  const response = await api.patch(`/generalSettings/${module}/`, data);
  return response?.data;
};

// GET Dashboard Image (Authenticated)
export const getDashboardImageApi = async (): Promise<DashboardImageData> => {
  const response = await api.get(`/dashboardImage/`);
  return response?.data;
};

// PUT Dashboard Image
export const putDashboardImageApi = async (data: FormData): Promise<DashboardImageData> => {
  const response = await api.put(`/dashboardImage/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data;
};

// ==========================================
// PUBLIC API CALLS
// ==========================================

export const getPublicGeneralSettingsApi = async (): Promise<GeneralSettingsData> => {
  let baseURL = api.defaults.baseURL?.replace(/\/$/, "") || "";

  if (baseURL.endsWith("/api")) {
    baseURL = baseURL.slice(0, -4);
  }

  const response = await fetch(`${baseURL}/displayGeneralSettings/`);

  if (!response.ok) throw new Error("Backend returned " + response.status);
  return response.json();
};

export const getPublicDashboardImageApi = async (): Promise<DashboardImageData> => {
  const baseURL = api.defaults.baseURL?.replace(/\/$/, "") || "";
  const response = await fetch(`${baseURL}/dashboardImage/`);

  if (!response.ok) throw new Error("Backend returned " + response.status);
  return response.json();
};