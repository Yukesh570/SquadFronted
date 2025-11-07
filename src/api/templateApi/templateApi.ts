import api from "../axiosInstance";

export interface templateData {
  id?: number;
  name: string;
  content: string;

}

export const getTemplateApi = async (): Promise<templateData[]> => {
  const response = await api.get("/template/");
  return response.data;
};

export const createTemplate = async (
  data: templateData
): Promise<templateData> => {
  const response = await api.post("/template/", data);
  return response.data;
};