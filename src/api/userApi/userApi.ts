import api from "../axiosInstance";

export interface ChangePasswordData {
    oldPassword: string;
    newPassword: string;
}

export const changePasswordApi = async (data: ChangePasswordData) => {
    const response = await api.post("/changePassword/", data);
    return response.data;
};

export interface UserData {
    id?: number;
    username?: string;
    name?: string;
    email?: string;
    role?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const getUsersApi = async (
    _module?: string,
    page: number = 1,
    pageSize: number = 1000,
    searchParams?: Record<string, any>
): Promise<PaginatedResponse<UserData>> => {
    const params: any = {
        page: page,
        page_size: pageSize,
        ...searchParams,
    };
    try {
        const response = await api.get(`/user/`, { params });
        return response.data;
    } catch (error) {
        return { count: 0, next: null, previous: null, results: [] };
    }
};

// FIXED: Updated endpoint to allAMUser based on backend instructions
export const getallAMUserApi = async () => {
    const response = await api.get("/allAMUser/");
    return response.data;
};