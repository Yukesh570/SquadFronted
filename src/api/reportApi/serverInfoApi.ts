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
  cpu_load: {
    load_1m: number;
    load_5m: number;
    load_15m: number;
    load_1m_per_cpu: number;
    cpu_count: number;
  };
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

export const getServerInfoApi = async (
  signal?: AbortSignal
): Promise<ServerInfoData | null> => {
  const response = await api.get(`/server/metrics/`, { signal });
  return response.status === 202 ? null : response.data.data;
};
