import api from "../../axiosInstance";

export interface CurrencyExchangeRateData {
  id?: number;
  baseCurrency: string;
  baseCurrency_name?: string;
  targetCurrency: string;
  targetCurrency_name?: string;
  targetCurrency_symbol?: string;
  effectiveFrom: string;
  effectiveto: string;
  source: string;
  version: string;
  exchangeRate: string | number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
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
  _module?: string,
  page: number = 1,
  pageSize: number = 10,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<CurrencyExchangeRateData>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };
  const response = await api.get(`/currencyExchangeRate/`, {
    params,
  });
  return response.data;
};

// GET HISTORY
export const getCurrencyExchangeRateHistoryApi = async (
  _module?: string,
  id?: number,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<CurrencyExchangeRateData>> => {
  const response = await api.get(`/currencyExchangeRateHistory/${id}`, {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

// POST
export const createCurrencyExchangeRateApi = async (
  data: any,
  _module?: string,
): Promise<CurrencyExchangeRateData> => {
  const response = await api.post(`/currencyExchangeRate/`, data);
  return response.data;
};

// PUT
export const putCurrencyExchangeRateApi = async (
  id: number,
  data: any,
  _module?: string,
): Promise<CurrencyExchangeRateData> => {
  const response = await api.put(
    `/currencyExchangeRate/${id}/`,
    data,
  );
  return response.data;
};

// PATCH
export const updateCurrencyExchangeRateApi = async (
  id: number,
  data: any,
  _module?: string,
): Promise<CurrencyExchangeRateData> => {
  const response = await api.patch(
    `/currencyExchangeRate/${id}/`,
    data,
  );
  return response.data;
};

// DELETE
export const deleteCurrencyExchangeRateApi = async (
  id: number,
  _module?: string,
): Promise<void> => {
  await api.delete(`/currencyExchangeRate/${id}/`);
};

// ⚡️ NEW: Fetch Live Exchange Rates
export const fetchExchangeRatesApi = async (
  baseCurrency: string,
  targetCurrencies: string[],
  exchangeRate: string | number
): Promise<any> => {
  const payload = {
    base_currency: baseCurrency,
    target_currencies: targetCurrencies,
    exchangeRate: exchangeRate,
  };
  const response = await api.post(`/exchangeRates/fetch/`, payload);
  return response.data;
};