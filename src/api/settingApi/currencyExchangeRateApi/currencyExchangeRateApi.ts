import api from "../../axiosInstance";

export interface CurrencyExchangeRateData {
  id?: number;
  baseCurrency: string;
  targetCurrency: string;
  exchangeRate: string | number;
  isActive: boolean;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// GET
export const getCurrencyExchangeRatesApi = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CurrencyExchangeRateData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/currencyExchangeRate/${module}/`, {
    params,
  });
  return response.data;
};

// POST
export const createCurrencyExchangeRateApi = async (
  data: any,
  module: string,
): Promise<CurrencyExchangeRateData> => {
  const response = await api.post(`/currencyExchangeRate/${module}/`, data);
  return response.data;
};

// PUT
export const putCurrencyExchangeRateApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CurrencyExchangeRateData> => {
  const response = await api.put(
    `/currencyExchangeRate/${module}/${id}/`,
    data,
  );
  return response.data;
};

// PATCH
export const updateCurrencyExchangeRateApi = async (
  id: number,
  data: any,
  module: string,
): Promise<CurrencyExchangeRateData> => {
  const response = await api.patch(
    `/currencyExchangeRate/${module}/${id}/`,
    data,
  );
  return response.data;
};

// DELETE
export const deleteCurrencyExchangeRateApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/currencyExchangeRate/${module}/${id}/`);
};

// ⚡️ NEW: Fetch Live Exchange Rates
export const fetchExchangeRatesApi = async (
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<any> => {
  const payload = {
    base_currency: baseCurrency,
    target_currencies: targetCurrencies,
  };
  const response = await api.post(`/exchangeRates/fetch/`, payload);
  return response.data;
};