import api from "../axiosInstance";

export interface ChangePasswordData {
    oldPassword: string;
    newPassword: string;
}

export const changePasswordApi = async (data: ChangePasswordData) => {
    const response = await api.post("/changePassword/", data);
    return response.data;
};

// --- NEW: Added getUsersApi to populate the Account Manager dropdown ---
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
    module: string = "user", 
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
        const response = await api.get(`/${module}/`, { params });
        return response.data;
    } catch (error) {
        // Safe fallback: If the backend doesn't have a /user/ endpoint yet, 
        // this catches the error silently and just leaves the AM dropdown empty.
        return { count: 0, next: null, previous: null, results: [] };
    }
};