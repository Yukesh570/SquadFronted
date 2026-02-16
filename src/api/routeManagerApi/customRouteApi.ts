import api from "../axiosInstance";
import { actionHelper } from "../sidebarApi/sideBarApi";

export interface CustomRouteData {
  id?: number;
  name: string;
  // Header
  orginatingCompany?: number;
  orginatingCompanyName?: string;
  orginatingClient?: number;
  orginatingClientName?: string;
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

// GET
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
  actionHelper(
    "Custom Route",
    "Custom Route created successfully!",
    "Custom Route",
    "Custom Route created successfully!",
  );
  return response.data;
};

// PUT
export const putCustomRouteApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CustomRouteData> => {
  const response = await api.put(`/customRoute/${module}/${id}/`, data);
  actionHelper(
    "Custom Route",
    "Custom Route updated successfully!",
    "Custom Route",
    "Custom Route updated successfully!",
  );
  return response.data;
};

// PATCH
export const updateCustomRouteApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CustomRouteData> => {
  const response = await api.patch(`/customRoute/${module}/${id}/`, data);
  actionHelper(
    "Custom Route",
    "Custom Route updated successfully!",
    "Custom Route",
    "Custom Route updated successfully!",
  );
  return response.data;
};

// DELETE
export const deleteCustomRouteApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/customRoute/${module}/${id}/`);
  actionHelper(
    "Custom Route",
    "Custom Route deleted!",
    "Custom Route",
    "Custom Route deleted!",
  );
};
