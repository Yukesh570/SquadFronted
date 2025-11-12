import api from "../axiosInstance";

// --- Template Types ---
export interface templateData {
  id?: number;
  name: string;
  content: string;
}

// --- Template API Functions ---
export const getTemplatesApi = async (): Promise<templateData[]> => {
  const response = await api.get("/template/");
  console.log("=========!!!!", response.data);
  return response.data;
};

export const createTemplate = async (
  data: templateData
): Promise<templateData> => {
  const response = await api.post("/template/", data);
  return response.data;
};

// --- Campaign API Functions ---
export const createCampaignApi = async (data: FormData) => {
  const response = await api.post("/campaign/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// This function is for the separate "Upload CSV" button logic
export const uploadCampaignCsvApi = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/campaigns/upload-csv/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};