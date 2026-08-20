import api from "../axiosInstance";

export interface CompanyData {
  id?: number;
  name: string;
  shortName: string;
  phone: string;
  companyEmail: string;
  supportEmail: string;
  billingEmail: string;
  amEmail: string;
  ratesEmail: string;
  lowBalanceAlertEmail: string;

  // Account Manager
  accountManager?: number | null;
  accountManagerName?: string;

  // Foreign Keys (IDs)
  country: number;
  category: number;
  status: number;
  currency: number;
  timeZone: number;

  // Finance
  customerCreditLimit: string;
  vendorCreditLimit: string;
  balanceAlertAmount: string;
  usedCustomerCredit: string;
  usedVendorCredit: string;
  referencNumber: string;

  // Address
  address: string;

  // Enums & Booleans
  validityPeriod: string;
  defaultEmail: string;
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
  pageSize: number = 10,
  searchParams?: Record<string, any>
): Promise<PaginatedResponse<CompanyData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams
  };
  const response = await api.get(`/company/${module}/`, { params });
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

// --- Add Credit API ---
// POST
export const addCreditApi = async (
  data: { company: number; creditType: string; creditAmount: number },
  module: string
) => {
  const response = await api.post(`/addCreditForCompnay/${module}/`, data);
  return response.data;
};

// GET Credit History
export const getCreditTransactionHistoryApi = async (
  module: string,
  companyId: number
) => {
  const response = await api.get(`/addCreditForCompnay/${module}/?company__id=${companyId}`);
  return response.data;
};