import api from "../axiosInstance";


export const sendEmailApi = async (data: FormData): Promise<any> => {
  const response = await api.post("/email/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};