import api from "../axiosInstance";
import { actionHelper } from "../sidebarApi/sideBarApi";

export const sendEmailApi = async (data: FormData): Promise<any> => {
  const response = await api.post("/email/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  actionHelper(
    "Email",
    "Email sent successfully!",
    "Email",
    "Email sent successfully!",
  );
  return response.data;
};
