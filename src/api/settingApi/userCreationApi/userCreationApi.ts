import api from "../../axiosInstance";

export type UserTypeEnum =
  | "ADMIN"
  | "SALES"
  | "SUPPORT"
  | "NOC"
  | "RATE"
  | "FINANCE"
  | "ACCOUNT_MANAGER";

export interface UserCreationData {
  id?: number;
  username: string;
  email: string;
  phone?: string;
  password?: string;
  confirm_password?: string;
  userType: UserTypeEnum | string;
  date_joined?: string;
  isDeleted?: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  phone: string;
  password?: string;
  confirm_password?: string;
  userType: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET Users List: /allUser/
export const getUsersApi = async (
  _module?: string,
  page: number = 1,
  pageSize: number = 50,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<UserCreationData>> => {
  const params: any = {
    page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/allUser/`, { params });
  return response.data;
};

// POST Register / Create User: /register/
export const createUserApi = async (
  data: UserCreationData,
  _module?: string,
): Promise<any> => {
  const payload: RegisterPayload = {
    username: data.username,
    email: data.email,
    phone: data.phone || "",
    password: data.password || "",
    confirm_password: data.confirm_password || "",
    userType: data.userType,
  };
  const response = await api.post(`/register/`, payload);
  return response.data;
};

// PATCH Update User: /user/edit/{id}/
export const updateUserApi = async (
  id: number,
  data: Partial<UserCreationData>,
  _module?: string,
): Promise<UserCreationData> => {
  const response = await api.patch(`/user/edit/${id}/`, data);
  return response.data;
};

// DELETE User: /user/delete/{id}/
export const deleteUserApi = async (
  id: number,
  _module?: string,
): Promise<void> => {
  await api.delete(`/user/delete/${id}/`);
};