import api from "../axiosInstance";
import { type CampaignFormData } from "../../pages/Campaign/Campaign";

export const getTemplatesApi = async (): Promise<{ id: number, name: string }[]> => {
    const response = await api.get("/template/");
    return response.data;
};


export const createCampaignApi = async (data: FormData) => {
    const response = await api.post("/campaign/", data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};


export const uploadCampaignCsvApi = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post("/campaigns/upload-csv/", formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};