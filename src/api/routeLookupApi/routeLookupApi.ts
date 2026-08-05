import api from "../axiosInstance";

export interface TerminatingVendor {
  id: number;
  name: string;
  system_id: string;
  company_name: string;
}

export interface RouteItem {
  route_id: string | number;
  route_group?: string;
  mcc?: string;
  mnc?: string;
  client_cost: number;
  vendor_cost: number;
  traffic_percentage: number;
  terminating_vendor: TerminatingVendor;
  client?: ClientInfo;
}

export interface CountryInfo {
  id: number;
  name: string;
  code: string;
}

export interface ClientInfo {
  id: number;
  name: string;
  smpp_username: string;
}

export interface RouteLookupResponse {
  searched_number: string;
  normalized_number: string;
  country?: CountryInfo | null;
  mccmnc?: string | null;
  mcc?: string | null;
  mnc?: string | null;
  routing_basis?: string | null;
  client?: ClientInfo | null;
  route?: RouteItem[];
  routing_type?: string | null;
  error?: string | null;
}

export const getRouteLookupApi = async (
  moduleName: string,
  number: string,
  clientId?: string
): Promise<RouteLookupResponse> => {
  const params: Record<string, any> = { number };
  if (clientId) {
    params.client_id = clientId;
  }
  const response = await api.get(`/routeLookup/${moduleName}/`, { params });
  return response.data;
};