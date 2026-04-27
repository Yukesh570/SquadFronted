import React, { useState, useEffect } from "react";
import { Home, MessageSquare, Activity, Monitor, CreditCard, ArrowRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import StatCard from "../../components/ui/StatCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Button from "../../components/ui/Button";
import { getClientSessionsApi, type ClientSessionData } from "../../api/clientSessionApi/clientSessionApi";

// --- Static Fallbacks for unlinked APIs ---
const initialTrafficData = [
  { time: "00:00", volume: 12000 }, { time: "04:00", volume: 8500 },
  { time: "08:00", volume: 32000 }, { time: "12:00", volume: 45000 },
  { time: "16:00", volume: 58000 }, { time: "20:00", volume: 39000 },
  { time: "23:59", volume: 15000 },
];
const initialDlrData = [
  { name: "Delivered", value: 82.5, color: "#10b981" },
  { name: "Failed", value: 12.0, color: "#ef4444" },
  { name: "Pending", value: 3.5, color: "#f59e0b" },
  { name: "Rejected", value: 2.0, color: "#6b7280" },
];

const Dashboard: React.FC = () => {
  const isDark = document.documentElement.classList.contains("dark");

  // --- DYNAMIC REAL-TIME STATES ---
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0);
  const [liveSessions, setLiveSessions] = useState<ClientSessionData[]>([]);

  // --- SOON-TO-BE DYNAMIC STATES ---
  const [trafficData] = useState(initialTrafficData);
  const [dlrData] = useState(initialDlrData);
  const [stats] = useState({ totalSms: "210,500", deliveryRate: "82.5%", revenue: "$4,250.00" });

  // Fetch Live Session Data
  const fetchActiveSessions = async () => {
    try {
      // Fetch the first 5 sessions that are ONLINE
      const response = await getClientSessionsApi("clientSession", 1, 5, { status: "ONLINE" });
      if (response && response.results) {
        setLiveSessions(response.results);
        setActiveSessionsCount(response.count);
      } else if (Array.isArray(response)) {
        setLiveSessions(response.slice(0, 5));
        setActiveSessionsCount(response.length);
      }
    } catch (error) {
      console.error("Failed to fetch active client sessions for dashboard.", error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchActiveSessions();

    // Real-time WebSocket connection for Dashboard
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    if (!wsBase) return;
    
    const ws = new WebSocket(`${wsBase}/ws/status/`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === "session_update") {
          // If a session updates, refetch the dashboard mini-table
          fetchActiveSessions();
        }
      } catch (err) {
        console.error("WebSocket parsing error in Dashboard", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="container mx-auto pb-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            Live system metrics and SMS traffic analytics.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <span className="text-text-primary dark:text-white">Dashboard</span>
        </div>
      </div>

      {/* Top Row: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total SMS (Today)"
          value={stats.totalSms}
          icon={<MessageSquare size={24} />}
        />
        <StatCard
          title="Avg. Delivery Rate"
          value={stats.deliveryRate}
          icon={<Activity size={24} />}
        />
        {/* DYNAMIC CARD */}
        <StatCard
          title="Active Sessions"
          value={activeSessionsCount}
          icon={<Monitor size={24} />}
          trendText="Live via WebSocket"
        />
        <StatCard
          title="Est. Revenue (Today)"
          value={stats.revenue}
          icon={<CreditCard size={24} />}
        />
      </div>

      {/* Middle Row: Charts (Awaiting APIs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text-primary dark:text-white">
              Traffic Volume (24h)
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#f3f4f6"} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} dx={-10} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff", borderColor: isDark ? "#374151" : "#e5e7eb", borderRadius: "0.5rem" }} itemStyle={{ color: "#8b5cf6", fontWeight: 600 }} />
                <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4">
            DLR Status Breakdown
          </h3>
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dlrData} cx="50%" cy="45%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  {dlrData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff", borderColor: isDark ? "#374151" : "#e5e7eb", borderRadius: "0.5rem" }} itemStyle={{ fontWeight: 600 }} formatter={(value) => `${value}%`} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value: string, entry) => { const p = entry.payload as { value?: number }; return <span className="text-sm text-text-secondary dark:text-gray-300">{value} <span className="font-medium text-text-primary dark:text-white ml-1">({p?.value}%)</span></span>; }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: DYNAMIC Live Sessions Table */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-text-primary dark:text-white flex items-center">
              Live Client Sessions 
              <span className="ml-3 flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </h3>
            <NavLink to="/clientSession">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
                View All
              </Button>
            </NavLink>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="p-4 text-xs font-medium text-text-secondary dark:text-gray-400">Session ID</th>
                  <th className="p-4 text-xs font-medium text-text-secondary dark:text-gray-400">Client Name</th>
                  <th className="p-4 text-xs font-medium text-text-secondary dark:text-gray-400">System ID</th>
                  <th className="p-4 text-xs font-medium text-text-secondary dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {liveSessions.length > 0 ? (
                  liveSessions.map((session, i) => (
                    <tr key={session.id || session.sessionId || i} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-text-primary dark:text-white">{session.sessionId}</td>
                      <td className="p-4 text-sm text-text-secondary dark:text-gray-300">{session.clientUsername}</td>
                      <td className="p-4 text-sm text-text-secondary dark:text-gray-300">{session.systemId}</td>
                      <td className="p-4 text-sm">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {session.status || "ONLINE"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-10 text-center">
                      <Monitor size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-text-secondary dark:text-gray-400 text-sm">No active sessions found at the moment.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;