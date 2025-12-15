import api from "../axiosInstance";

// --- Types ---

export interface LoginHistoryItem {
  ipAddress: string;
  browser: string;
  device: string;
  userAgent: string;
  loggedAt: string;
}

export interface UserInformationData {
  id: number;
  username: string;
  email: string;
  phone: string;
  userType: string;
  last_login: string;
}

export interface PaginatedLogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LoginHistoryItem[];
}


export const getUserInformationApi = async (): Promise<UserInformationData> => {
  const response = await api.get(`/userInformation/`);
  return response.data;
};

export const getUserLogApi = async (
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, string>
): Promise<PaginatedLogResponse> => {
  const params = {
    page,
    page_size: pageSize,
    ...searchParams,
  };
  
  const response = await api.get(`/userLog/`, { params });
  return response.data;
};