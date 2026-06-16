import React, { useState, useEffect, useRef } from "react";
import { 
  Home, RefreshCw, Server, Database, Cpu, HardDrive, 
  Activity, AlertTriangle, CheckCircle, Zap, Layers,
  Clock, Wifi
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { getServerInfoApi, type ServerInfoData } from "../../api/reportApi/serverInfoApi";
import Button from "../../components/ui/Button";
import { actionHelper } from "../../helper/action";

const ServerInfo: React.FC = () => {
  const [serverData, setServerData] = useState<ServerInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Added isBackground flag so auto-refresh doesn't cause the screen to flicker
  const fetchServerInfo = async (isBackground = false) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;
    
    if (!isBackground) setIsLoading(true);

    try {
      const response = await getServerInfoApi();
      if (newController.signal.aborted) return;
      if (response) setServerData(response);
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
    fetchServerInfo(); // Initial Load
    
    // Auto-refresh the telemetry every 10 seconds to keep it perfectly accurate
    const intervalId = setInterval(() => {
      fetchServerInfo(true);
    }, 10000);

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

  // Card for Resource Percentages (CPU, RAM, Disk)
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
        <div 
          className={`h-2 rounded-full transition-all duration-500 ease-out ${colorClass.replace('bg-', 'bg-')}`} 
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        ></div>
      </div>
    </div>
  );

  // Card for Basic Metrics (Numbers, Text)
  const MetricCard = ({ title, value, icon: Icon }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4 transition-all duration-300">
      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-primary">
        <Icon size={22} />
      </div>
      <div className="overflow-hidden">
        <h4 className="text-sm font-medium text-text-secondary dark:text-gray-400 truncate">{title}</h4>
        <p className="text-lg font-semibold text-text-primary dark:text-white truncate transition-all duration-300" title={String(value)}>
          {value}
        </p>
      </div>
    </div>
  );

  // Card for UP/DOWN Services
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

  // Safe Fallbacks
  const system_status = serverData?.system_status || "UNKNOWN";
  
  const hardware = serverData?.hardware || { 
    cpu_usage_percent: 0, 
    ram_usage_percent: 0, 
    ram_details: "N/A", 
    disk_usage_percent: 0, 
    server_uptime: "N/A", 
    network_traffic: "N/A" 
  };
  
  const infrastructure = serverData?.infrastructure || { 
    database: "UNKNOWN", 
    redis: "UNKNOWN", 
    rabbitmq: "UNKNOWN", 
    celery_workers: "UNKNOWN", 
    active_celery_nodes: 0 
  };

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
        <h2 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-4">Hardware Utilization</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <ResourceCard 
            title="CPU Usage" 
            percent={hardware.cpu_usage_percent} 
            details="Total CPU load" 
            icon={Cpu} 
            colorClass="bg-blue-500 text-blue-500" 
          />
          <ResourceCard 
            title="RAM Usage" 
            percent={hardware.ram_usage_percent} 
            details={hardware.ram_details} 
            icon={Activity} 
            colorClass="bg-purple-500 text-purple-500" 
          />
          <ResourceCard 
            title="Disk Usage" 
            percent={hardware.disk_usage_percent} 
            details="Storage consumption" 
            icon={HardDrive} 
            colorClass="bg-orange-500 text-orange-500" 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard title="Server Uptime" value={hardware.server_uptime} icon={Clock} />
          <MetricCard title="Network Traffic" value={hardware.network_traffic} icon={Wifi} />
        </div>
      </div>

      {/* SECTION: Infrastructure Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Infrastructure Services</h2>
          <div className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md text-text-secondary shadow-sm transition-all duration-300">
            Active Celery Nodes: <span className="text-primary ml-1 font-bold text-sm">{infrastructure.active_celery_nodes}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ServiceCard name="Database" status={infrastructure.database} icon={Database} />
          <ServiceCard name="Redis" status={infrastructure.redis} icon={Layers} />
          <ServiceCard name="RabbitMQ" status={infrastructure.rabbitmq} icon={Zap} />
          <ServiceCard name="Celery Workers" status={infrastructure.celery_workers} icon={Server} />
        </div>
      </div>

    </div>
  );
};

export default ServerInfo;