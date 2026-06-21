import api from "../../api/axiosInstance";

export interface InfrastructureData {
  database: string;
  redis: string;
  rabbitmqPortStatus: string; // ⚡️ FIX: Updated to match backend change
  celery_workers: string;
  active_celery_nodes: number;
  pending_tasks?: number; // ⚡️ Added pending_tasks as per backend schema
}

export interface HardwareData {
  server_uptime: string;
  cpu_usage_percent: number;
  ram_usage_percent: number;
  ram_details: string;
  disk_usage_percent: number;
  network_traffic: string;
}

export interface ServerInfoData {
  system_status: string;
  infrastructure: InfrastructureData;
  hardware: HardwareData;
}

export const getServerInfoApi = async (): Promise<ServerInfoData> => {
  const response = await api.get(`/serverInfo/`);
  return response.data;
};