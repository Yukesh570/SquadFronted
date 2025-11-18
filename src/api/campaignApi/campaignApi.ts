import api from "../axiosInstance";

export interface templateData {
  id?: number;
  name: string;
  content: string;
}



export const getTemplatesApi = async (): Promise<templateData[]> => {
  const response = await api.get("/template/");
  return response.data;
};

export const createTemplate = async (
  data: templateData,
  module: string
): Promise<templateData> => {
  const response = await api.post(`/template/${module}/`, data);
  return response.data;
};

export const updateTemplateApi = async (
  id: number,
  data: templateData,
  module: string
): Promise<templateData> => {
  const response = await api.patch(`/template/${module}/${id}/`, data);
  return response.data;
};

export const deleteTemplateApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/template/${module}/${id}/`);
};

export interface CampaignFormData {
  id?: number;
  name: string;
  objective: string;
  schedule: string;
  content: string;
  template: string;
  is_active: boolean;
}

export const getCampaignsApi = async (module: string): Promise<CampaignFormData[]> => {
  const response = await api.get(`/campaign/${module}/`);
  return response.data;
};

export const createCampaignApi = async (data: FormData, module: string) => {
  const response = await api.post(`/campaign/${module}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateCampaignApi = async (id: number, data: FormData, module: string) => {
  const response = await api.patch(`/campaign/${module}/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCampaignApi = async (id: number, module: string): Promise<void> => {
  await api.delete(`/campaign/${module}/${id}/`);
};

export const uploadCampaignCsvApi = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/campaigns/upload-csv/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};