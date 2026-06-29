import api from "../axiosInstance";

export interface CustomRouteData {
  id?: number;
  name: string;
  routeGroup?: string;

  // Header
  priority?: string | number;
  trafficPercentage?: string | number; // ⚡️ FIX: Added trafficPercentage
  status: "ACTIVE" | "INACTIVE";

  // Destination
  country?: number;
  countryName?: string;
  operator?: number;
  operatorName?: string;

  // Vendor
  terminatingVendor?: number;
  terminatingVendorProfileName?: string;
  vendorRate?: string | null;

  // Route fields
  MCC?: string;
  MNC?: string;

  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET GROUPED ROUTES (For Main Table)
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

// POST ROUTE GROUP
export const createRouteGroupApi = async (
  data: any,
  module: string,
): Promise<any> => {
  const response = await api.post(`/routeGroup/${module}/`, data);
  return response.data;
};

// PATCH GROUPED ROUTES (For Inline Status Edit)
export const updateRouteGroupApi = async (
  id: number,
  data: any,
  module: string,
): Promise<any> => {
  const response = await api.patch(`/routeGroup/${module}/${id}/`, data);
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
  data: any, // ⚡️ Can accept single object OR Array of objects
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

// BULK UPDATE (Add new route to existing group)
export const bulkUpdateCustomRouteApi = async (
  data: any,
  module: string,
): Promise<CustomRouteData> => {
  const response = await api.put(`/customRoute/bulkUpdate/${module}/`, data);
  return response.data;
};

// ── RouteGroupCountry ────────────────────────────────────────────────────────

export interface RouteGroupCountryData {
  id?: number;
  routeGroup: number;
  routeGroupName?: string;
  country: number;
  countryName?: string;
  routingType: "PRIORITY" | "PERCENTAGE";
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export const getRouteGroupCountriesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<RouteGroupCountryData>> => {
  const params = { page, page_size: pageSize, ...searchParams };
  const response = await api.get(`/routeGroupCountry/${module}/`, { params });
  return response.data;
};

export const createRouteGroupCountryApi = async (
  data: Partial<RouteGroupCountryData>,
  module: string,
): Promise<RouteGroupCountryData> => {
  const response = await api.post(`/routeGroupCountry/${module}/`, data);
  return response.data;
};

export const updateRouteGroupCountryApi = async (
  id: number,
  data: Partial<RouteGroupCountryData>,
  module: string,
): Promise<RouteGroupCountryData> => {
  const response = await api.patch(`/routeGroupCountry/${module}/${id}/`, data);
  return response.data;
};

export const deleteRouteGroupCountryApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/routeGroupCountry/${module}/${id}/`);
};