import React, { useState, useEffect, useRef } from "react";
import {
  Home, RefreshCw, Server, Database, Cpu, HardDrive,
  Activity, AlertTriangle, CheckCircle, Zap, Layers,
  Clock, Wifi, ListMinus, ActivitySquare
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { getServerInfoApi, type ServerInfoData } from "../../api/reportApi/serverInfoApi";
import Button from "../../components/ui/Button";
import { actionHelper } from "../../helper/action";

interface HistorySample {
  time: string;
  cpu: number;
  ram: number;
  sentBps: number;
  recvBps: number;
}

const MAX_SAMPLES = 120; // 20 mins at 10s intervals

const formatBytesPerSec = (bytes: number) => {
  if (bytes === 0) return "0 B/s";
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ServerInfo: React.FC = () => {
  const [serverData, setServerData] = useState<ServerInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rolling history state and refs
  const [history, setHistory] = useState<HistorySample[]>([]);
  const prevNetRef = useRef<{ sent: number; recv: number; t: number } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchServerInfo = async (isBackground = false) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;

    if (!isBackground) setIsLoading(true);

    try {
      const response = await getServerInfoApi();
      if (newController.signal.aborted) return;

      if (response) {
        setServerData(response);

        // Compute Bps and append to history
        const now = Date.now();
        const hw = response.hardware;
        let sentBps = 0, recvBps = 0;

        if (prevNetRef.current && hw.network_bytes_sent !== undefined && hw.network_bytes_recv !== undefined) {
          const dt = (now - prevNetRef.current.t) / 1000;
          if (dt > 0) {
            sentBps = Math.max(0, (hw.network_bytes_sent - prevNetRef.current.sent) / dt);
            recvBps = Math.max(0, (hw.network_bytes_recv - prevNetRef.current.recv) / dt);
          }
        }

        if (hw.network_bytes_sent !== undefined && hw.network_bytes_recv !== undefined) {
          prevNetRef.current = { sent: hw.network_bytes_sent, recv: hw.network_bytes_recv, t: now };
        }

        setHistory((prev) => {
          const next = [...prev, {
            time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cpu: hw.cpu_usage_percent || 0,
            ram: hw.ram_usage_percent || 0,
            sentBps,
            recvBps,
          }];
          return next.length > MAX_SAMPLES ? next.slice(-MAX_SAMPLES) : next;
        });
      }
    } catch (error: any) {
      if (error.name !== "AbortError" && !isBackground) {
        toast.error("Failed to fetch server information.");
      }
    } finally {
      if (abortControllerRef.current === newController) {
        if (!isBackground) setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchServerInfo();
    const intervalId = setInterval(() => { fetchServerInfo(true); }, 10000);
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => { actionHelper("Server Info", `Opened Server Info Dashboard`, false); }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  // Components (ResourceCard, MetricCard, ServiceCard)
  const ResourceCard = ({ title, percent, details, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <span className="text-2xl font-bold text-text-primary dark:text-white transition-all duration-300">
          {percent}%
        </span>
      </div>
      <h3 className="text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-xs text-text-secondary dark:text-gray-500 min-h-[16px] truncate transition-all duration-300" title={details}>
        {details}
      </p>
      <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-500 ease-out ${colorClass.replace('bg-', 'bg-')}`} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}></div>
      </div>
    </div>
  );

  const MetricCard = ({ title, value, icon: Icon, textColor = "text-text-primary dark:text-white" }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4 transition-all duration-300">
      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-primary">
        <Icon size={22} />
      </div>
      <div className="overflow-hidden">
        <h4 className="text-sm font-medium text-text-secondary dark:text-gray-400 truncate">{title}</h4>
        <p className={`text-lg font-semibold truncate transition-all duration-300 ${textColor}`} title={String(value)}>
          {value}
        </p>
      </div>
    </div>
  );

  const ServiceCard = ({ name, status, icon: Icon }: any) => {
    const isUp = status === "UP";
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-text-secondary dark:text-gray-400">
            <Icon size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary dark:text-white">{name}</h4>
            <p className="text-xs text-text-secondary dark:text-gray-500 mt-0.5">Status</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-300 ${isUp ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {isUp ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {status}
        </div>
      </div>
    );
  };

  if (isLoading && !serverData) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center h-[50vh]">
        <RefreshCw size={24} className="animate-spin text-primary mr-3" />
        <span className="text-text-secondary dark:text-gray-400">Loading server telemetry...</span>
      </div>
    );
  }

  const system_status = serverData?.system_status || "UNKNOWN";
  const hardware = serverData?.hardware || { cpu_usage_percent: 0, cpu_load: {}, ram_usage_percent: 0, ram_details: "N/A", disk_usage_percent: 0, server_uptime: "N/A", network_traffic: "N/A", disk_partitions: [] };
  const infrastructure = serverData?.infrastructure || { database: "UNKNOWN", redis: "UNKNOWN", rabbitmqPortStatus: "UNKNOWN", celery_workers: "UNKNOWN", active_celery_nodes: 0, pending_tasks: 0 };
  const db_stats = serverData?.database_stats;
  const isWarning = system_status === "WARNING" || system_status === "DOWN" || system_status === "CRITICAL";

  return (
    <div className="container mx-auto pb-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white flex items-center gap-3">
            Server Telemetry
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${isWarning ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
              {system_status}
            </span>
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            Real-time infrastructure health and resource utilization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => fetchServerInfo(false)} leftIcon={<RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />}>
            Refresh
          </Button>
          <div className="hidden sm:flex items-center space-x-2 text-sm text-text-secondary">
            <Home size={16} className="text-gray-400" />
            <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
            <span>/</span><span className="text-text-primary dark:text-white">Server Info</span>
          </div>
        </div>
      </div>

      {/* SECTION: Hardware Utilization */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-4">Instantaneous Hardware</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <ResourceCard
            title="CPU Usage"
            percent={hardware.cpu_usage_percent}
            details={hardware.cpu_load?.load_1m !== undefined ? `Load (1m): ${hardware.cpu_load.load_1m} | ${hardware.cpu_load.cpu_count || 1} Cores` : "Real-time utilization"}
            icon={Cpu}
            colorClass="bg-blue-500 text-blue-500"
          />
          <ResourceCard title="RAM Usage" percent={hardware.ram_usage_percent} details={hardware.ram_details} icon={Activity} colorClass="bg-purple-500 text-purple-500" />
          <ResourceCard title="Disk Usage (Root)" percent={hardware.disk_usage_percent} details="Primary storage consumption" icon={HardDrive} colorClass="bg-orange-500 text-orange-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard title="Server Uptime" value={hardware.server_uptime} icon={Clock} />
          <MetricCard title="Cumulative Network Traffic" value={hardware.network_traffic} icon={Wifi} />
        </div>
      </div>

      {/* SECTION: Historical Resource Graphs */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-4">Resource History (Last 20 Mins)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU & RAM Graph */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-semibold text-text-primary dark:text-white mb-4">CPU & RAM Utilization</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} tickFormatter={(val: number) => `${val}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#e5e7eb' }}
                    formatter={(value: any, name: any) => [`${Number(value).toFixed(1)}%`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" name="CPU" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" name="RAM" dataKey="ram" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Network Throughput Graph */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-semibold text-text-primary dark:text-white mb-4">Network Throughput</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val: number) => formatBytesPerSec(val).split(' ')[0]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#e5e7eb' }}
                    formatter={(value: any, name: any) => [formatBytesPerSec(Number(value)), name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" name="Sent" dataKey="sentBps" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="Received" dataKey="recvBps" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Disk by Partition */}
      {hardware.disk_partitions && hardware.disk_partitions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-4">Disk Usage by Partition</h2>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hardware.disk_partitions} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.3} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="mountpoint" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} width={120} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    formatter={(value: any, _name: any, props: any) => [
                      `${value}% (${props.payload.used_gb}GB / ${props.payload.total_gb}GB)`, 'Usage'
                    ]}
                  />
                  <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={24}>
                    {hardware.disk_partitions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.percent > 85 ? '#ef4444' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Infrastructure Services */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Infrastructure Services</h2>
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md text-text-secondary shadow-sm transition-all duration-300">
              Active Celery Nodes: <span className="text-primary ml-1 font-bold text-sm">{infrastructure.active_celery_nodes}</span>
            </div>
            <div className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md text-text-secondary shadow-sm transition-all duration-300 flex items-center gap-1.5">
              <ListMinus size={14} className="text-orange-500" />
              Pending Tasks: <span className="text-orange-600 dark:text-orange-400 ml-1 font-bold text-sm">{infrastructure.pending_tasks || 0}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ServiceCard name="Database" status={infrastructure.database} icon={Database} />
          <ServiceCard name="Redis" status={infrastructure.redis} icon={Layers} />
          <ServiceCard name="RabbitMQ" status={infrastructure.rabbitmqPortStatus} icon={Zap} />
          <ServiceCard name="Celery Workers" status={infrastructure.celery_workers} icon={Server} />
        </div>
      </div>

      {/* SECTION: Database Statistics */}
      {db_stats && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-4">Database Deep Dive</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard title="Database Size" value={db_stats.size} icon={Database} />
            <MetricCard title="Active Connections" value={`${db_stats.active_connections} / ${db_stats.max_connections}`} icon={ActivitySquare} />
            <MetricCard
              title="Idle In Transaction"
              value={db_stats.idle_in_transaction}
              icon={AlertTriangle}
              textColor={db_stats.idle_in_transaction > 0 ? "text-red-500 font-bold" : "text-green-500"}
            />
            <MetricCard title="Cache Hit Ratio" value={db_stats.cache_hit_ratio_percent ? `${db_stats.cache_hit_ratio_percent}%` : "N/A"} icon={Zap} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-text-primary dark:text-white">Top 5 Largest Tables</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-text-secondary dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Table Name</th>
                    <th className="px-6 py-3 font-medium text-right">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {db_stats.largest_tables.map((tableInfo, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-3 text-text-primary dark:text-white font-medium">{tableInfo.table}</td>
                      <td className="px-6 py-3 text-text-secondary dark:text-gray-300 text-right">{tableInfo.size}</td>
                    </tr>
                  ))}
                  {db_stats.largest_tables.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-text-secondary dark:text-gray-500">No table data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServerInfo;