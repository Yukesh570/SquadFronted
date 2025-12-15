import api from "../axiosInstance";

export interface LoginHistoryItem {
  ipAddress: string;
  browser: string;
  device: string;
  userAgent: string;
  loggedAt: string;
}

export interface UserLogData {
  id: number;
  username: string;
  email: string;
  phone: string;
  userType: string;
  last_login: string;
  loginHistory: LoginHistoryItem[];
}

export const getUserLogApi = async (
  searchParams?: Record<string, string>
): Promise<UserLogData> => {
  const response = await api.get(`/userLog/`, { params: searchParams });
  return response.data;
};