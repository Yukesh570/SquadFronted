import api from "../../api/axiosInstance";

export interface InfrastructureData {
  database: string;
  redis: string;
  rabbitmqPortStatus: string;
  celery_workers: string;
  active_celery_nodes: number;
  pending_tasks?: number;
}

// ⚡️ NEW: Added DiskPartition interface
export interface DiskPartition {
  device: string;
  mountpoint: string;
  fstype: string;
  percent: number;
  used_gb: number;
  total_gb: number;
}

// ⚡️ NEW: Added DatabaseStats interface
export interface DatabaseStats {
  size: string;
  size_bytes: number;
  active_connections: number;
  max_connections: number;
  idle_in_transaction: number;
  cache_hit_ratio_percent: number | null;
  largest_tables: { table: string; size: string }[];
}

export interface CpuLoad {
  load_1m?: number;
  load_5m?: number;
  load_15m?: number;
  load_1m_per_cpu?: number;
  cpu_count?: number;
}

export interface HardwareData {
  server_uptime: string;
  cpu_usage_percent: number;
  cpu_load?: CpuLoad; // ⚡️ NEW: Load average reported separately from actual CPU usage
  ram_usage_percent: number;
  ram_details: string;
  disk_usage_percent: number;
  network_traffic: string;
  // ⚡️ NEW: Added raw bytes and partition arrays
  network_bytes_sent?: number; 
  network_bytes_recv?: number; 
  disk_partitions?: DiskPartition[]; 
}

export interface ServerInfoData {
  system_status: string;
  infrastructure: InfrastructureData;
  hardware: HardwareData;
  database_stats?: DatabaseStats; // ⚡️ NEW
}

export const getServerInfoApi = async (): Promise<ServerInfoData> => {
  const response = await api.get(`/serverInfo/`);
  return response.data;
};