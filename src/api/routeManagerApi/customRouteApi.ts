import api from "../axiosInstance";

export interface CustomRouteData {
  id?: number;
  name: string;
  routeGroup?: string;

  // Header

  priority: string;
  status: "ACTIVE" | "INACTIVE";

  // Destination
  country?: number;
  countryName?: string;
  operator?: number;
  operatorName?: string;

  // Vendor
  terminatingCompany?: number;
  terminatingCompanyName?: string;
  terminatingVendor?: number;
  terminatingVendorProfileName?: string;

  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// NEW: GET GROUPED ROUTES (For Main Table)
export const getGroupedCustomRoutesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<any>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/routeGroup/${module}/`, { params });
  return response.data;
};

// GET DETAILED ROUTES (For Sub-Table inside Modal)
export const getCustomRoutesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CustomRouteData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/customRoute/${module}/`, { params });
  return response.data;
};

// POST
export const createCustomRouteApi = async (
  data: any,
  module: string,
): Promise<CustomRouteData> => {
  const response = await api.post(`/customRoute/${module}/`, data);
  return response.data;
};

// PUT
export const putCustomRouteApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CustomRouteData> => {
  const response = await api.put(`/customRoute/${module}/${id}/`, data);
  return response.data;
};

// PATCH
export const updateCustomRouteApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CustomRouteData> => {
  const response = await api.patch(`/customRoute/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteCustomRouteApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/customRoute/${module}/${id}/`);
};
