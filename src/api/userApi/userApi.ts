import api from "../axiosInstance";

export interface ChangePasswordData {
    oldPassword: string;
    newPassword: string;
}

export const changePasswordApi = async (data: ChangePasswordData) => {
    const response = await api.post("/changePassword/", data);
    return response.data;
};