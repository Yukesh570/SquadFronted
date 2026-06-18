import api from "../axiosInstance";

export const getVendorRateImportBatchesApi = async (module: string, page: number = 1, pageSize: number = 10, searchParams?: Record<string, any>) => {
  const response = await api.get(`/vendorRateImportBatch/${module}/`, { params: { page, page_size: pageSize, ...searchParams } });
  return response.data;
};

export const updateVendorRateImportBatchApi = async (id: number, data: any, module: string) => {
  const { isDeleted, ...payload } = data;
  const response = await api.patch(`/vendorRateImportBatch/${module}/${id}/`, payload);
  return response.data;
};