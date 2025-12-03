import api from "../axiosInstance";

export interface VendorRateData {
  id?: number;
  country: number; // Country ID
  countryName?: string; // Read-only
  ratePlan: string;
  currencyCode: string; // String like "AUD"
  timeZone: number; // Timezone ID
  timeZoneName?: string; // Read-only
  MCC: number;
  rate: number | string; // API says int, but rates are usually decimal
  remark: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getVendorRatesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<VendorRateData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/vendorRate/${module}/`, { params });
  return response.data;
};

// POST
export const createVendorRateApi = async (
  data: any,
  module: string
): Promise<VendorRateData> => {
  const response = await api.post(`/vendorRate/${module}/`, data);
  return response.data;
};

// PATCH
export const updateVendorRateApi = async (
  id: number,
  data: any,
  module: string
): Promise<VendorRateData> => {
  const response = await api.patch(`/vendorRate/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteVendorRateApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/vendorRate/${module}/${id}/`);
};