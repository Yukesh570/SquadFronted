import api from "../axiosInstance";

export const getVendorRateImportRowsApi = async (module: string, page: number = 1, pageSize: number = 10, searchParams?: Record<string, any>) => {
  const response = await api.get(`/vendorRateImportRow/${module}/`, { params: { page, page_size: pageSize, ...searchParams } });
  return response.data;
};

export const updateVendorRateImportRowApi = async (id: number, data: any, module: string) => {
  const { isDeleted, ...payload } = data;
  const response = await api.patch(`/vendorRateImportRow/${module}/${id}/`, payload);
  return response.data;
};