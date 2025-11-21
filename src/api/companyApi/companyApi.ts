import api from "../axiosInstance";

export interface CompanyData {
  id?: number;
  name: string;
  shortName: string;
  phone: string;
  companyEmail: string;
  supportEmail: string;
  billingEmail: string;
  ratesEmail: string;
  lowBalanceAlertEmail: string;
  
  // Foreign Keys (IDs)
  country: number;
  state: number;
  category: number;
  status: number;
  currency: number;
  timeZone: number;
  businessEntity: number;
  
  // Finance
  customerCreditLimit: string; // Decimal as string
  vendorCreditLimit: string;
  balanceAlertAmount: string;
  referencNumber: string;
  vatNumber: string;
  
  // Address
  address: string;
  
  // Enums & Booleans
  validityPeriod: string; // 'LTD' or 'UNL'
  defaultEmail: string;   // 'CMP' or 'SUP'
  onlinePayment: boolean;
  companyBlocked: boolean;
  allowWhiteListedCards: boolean;
  sendDailyReports: boolean;
  allowNetting: boolean;
  showHlrApi: boolean;
  enableVendorPanel: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getCompaniesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<CompanyData>> => {
  const response = await api.get(`/company/${module}/?page=${page}&page_size=${pageSize}`);
  return response.data;
};

// POST
export const createCompanyApi = async (
  data: any, 
  module: string
): Promise<CompanyData> => {
  const response = await api.post(`/company/${module}/`, data);
  return response.data;
};

// PATCH
export const updateCompanyApi = async (
  id: number,
  data: any,
  module: string
): Promise<CompanyData> => {
  const response = await api.patch(`/company/${module}/${id}/`, data);
  return response.data;
};

// DELETE
export const deleteCompanyApi = async (
  id: number,
  module: string
): Promise<void> => {
  await api.delete(`/company/${module}/${id}/`);
};