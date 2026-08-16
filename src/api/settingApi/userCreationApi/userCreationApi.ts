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

// GET Users List: /allUser/{module}/
export const getUsersApi = async (
  module: string = "userCreation",
  page: number = 1,
  pageSize: number = 50,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<UserCreationData>> => {
  const params: any = {
    page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/allUser/${module}/`, { params });
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

// PATCH Update User: /user/edit/{module}/{id}/
export const updateUserApi = async (
  id: number,
  data: Partial<UserCreationData>,
  module: string = "userCreation",
): Promise<UserCreationData> => {
  const response = await api.patch(`/user/edit/${module}/${id}/`, data);
  return response.data;
};

// DELETE User: /user/delete/{module}/{id}/
export const deleteUserApi = async (
  id: number,
  module: string = "userCreation",
): Promise<void> => {
  await api.delete(`/user/delete/${module}/${id}/`);
};