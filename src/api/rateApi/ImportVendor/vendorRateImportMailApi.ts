import api from "../axiosInstance";

export const getVendorRateImportMailsApi = async (module: string, page: number = 1, pageSize: number = 10, searchParams?: Record<string, any>) => {
  const response = await api.get(`/vendorRateImportMail/${module}/`, { params: { page, page_size: pageSize, ...searchParams } });
  return response.data;
};

export const updateVendorRateImportMailApi = async (id: number, data: any, module: string) => {
  const { isDeleted, ...payload } = data;
  const response = await api.patch(`/vendorRateImportMail/${module}/${id}/`, payload);
  return response.data;
};