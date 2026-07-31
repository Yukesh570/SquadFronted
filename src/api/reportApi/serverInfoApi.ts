import api from "../../api/axiosInstance";

export interface InfrastructureData {
  database: string;
  redis: string;
  rabbitmqPortStatus: string;
  celery_workers: string;
  active_celery_nodes: number;
  pending_tasks?: number;
}

export interface DiskPartition {
  device: string;
  mountpoint: string;
  fstype: string;
  percent: number;
  used_gb: number;
  total_gb: number;
}

export interface TableSizeInfo {
  table: string;
  size?: string;
  total_bytes?: number;
}

export interface DatabaseStats {
  size?: string;
  size_bytes?: number;
  active_connections?: number;
  max_connections?: number;
  idle_in_transaction?: number;
  cache_hit_ratio_percent?: number | null;
  largest_tables?: TableSizeInfo[];
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
  cpu_load?: CpuLoad;
  ram_usage_percent: number;
  ram_details: string;
  disk_usage_percent: number;
  network_traffic?: string;
  network_bytes_sent?: number;
  network_bytes_recv?: number;
  disk_partitions?: DiskPartition[];
}

export interface ServerInfoData {
  system_status?: string;
  infrastructure?: InfrastructureData;
  hardware?: HardwareData;
  database_stats?: DatabaseStats;
  status?: string; // e.g. "warming" | "unavailable"
  detail?: string;
}

export interface ServerHealthData {
  status: string; // "ok" | "not_ready" | "error"
  database: string;
  redis: string;
}

export interface ReconciliationData {
  generated_at: string;
  sms_rows: number;
  sms_sent: number;
  sms_failed: number;
  outbox_rows: number;
  outbox_processed: number;
  outbox_pending: number;
  deadlocks: number;
  company_used_customer_credit: string | number;
  company_used_vendor_credit: string | number;
  generation_ms: number;
}

export interface ReconciliationResponse {
  status: string; // "ok" | "warming" | "unavailable" | "unauthorized" | "error"
  detail?: string;
  data?: ReconciliationData;
}


export const getServerInfoApi = async (): Promise<ServerInfoData> => {
  try {
    const response = await api.get(`/serverInfo/`);
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: ServerInfoData & { status?: string } } };
    if (error.response?.data?.status) {
      return error.response.data;
    }
    throw err;
  }
};

export const getServerHealthApi = async (): Promise<ServerHealthData> => {
  try {
    const response = await api.get(`/server/health/`);
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: ServerHealthData & { database?: string } } };
    if (error.response?.data?.database) {
      return error.response.data;
    }
    return {
      status: "error",
      database: "DOWN",
      redis: "DOWN",
    };
  }
};

export const getServerReconciliationApi = async (): Promise<ReconciliationResponse> => {
  try {
    const response = await api.get(`/server/reconciliation/`);
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: ReconciliationResponse } };
    if (error.response?.status === 403) {
      return {
        status: "unauthorized",
        detail: "Administrator privileges are required to view reconciliation metrics.",
      };
    }
    if (error.response?.data?.status) {
      return error.response.data;
    }
    return {
      status: "error",
      detail: "Failed to fetch reconciliation telemetry.",
    };
  }
};