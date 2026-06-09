import React, { useState, useEffect } from "react";
import {
  Home,
  MessageSquare,
  Activity,
  Monitor,
  XCircle,
  Users,
  Server,
  ArrowRight,
  Bell,
  TrendingUp,
  DollarSign,
  ChevronDown,
  Calendar,
} from "lucide-react";
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
import {
  getClientSessionsApi,
  type ClientSessionData,
} from "../../api/clientSessionApi/clientSessionApi";
import { getVendorsApi } from "../../api/connectivityApi/vendorApi";
import { getClientsApi } from "../../api/clientApi/clientApi";
import { getNotificationApi, type NotificationData } from "../../api/userActionApi/notificationApi";
import {
  getSmsStatsApi,
  getSmsHourlyApi,
  getDlrStatsApi,
  getRevenueApi,
  type SmsHourlyData,
  type RevenueData,
} from "../../api/reportApi/smsCountsApi";

// DLR colours — stable, not derived from API
const DLR_COLORS: Record<string, string> = {
  Delivered: "#10b981",
  Failed:    "#ef4444",
  Pending:   "#f59e0b",
  Rejected:  "#6b7280",
};

const Dashboard: React.FC = () => {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // --- KPI states ---
  const [totalSms, setTotalSms]             = useState<string>("-");
  const [deliveredCount, setDeliveredCount] = useState<string>("-");
  const [failedCount, setFailedCount]       = useState<string>("-");
  const [deliveryRate, setDeliveryRate]     = useState<string>("-");
  const [activeSessionsCount, setActiveSessionsCount] = useState<number | string>("-");
  const [onlineVendors, setOnlineVendors]   = useState<number | string>("-");
  const [onlineClients, setOnlineClients]   = useState<number | string>("-");

  // --- Chart states ---
  const [trafficData, setTrafficData] = useState<SmsHourlyData[]>([]);
  const [dlrData, setDlrData]         = useState<{ name: string; value: number; color: string }[]>([]);

  // --- Table / panel states ---
  const [liveSessions, setLiveSessions]   = useState<ClientSessionData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [revenue, setRevenue]             = useState<RevenueData | null>(null);

  // ─── Date range ──────────────────────────────────────────────────────────────

  type RangeKey = "today" | "7d" | "30d" | "90d" | "365d" | "all";

  const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
    { key: "today", label: "Today"        },
    { key: "7d",    label: "Last 7 Days"  },
    { key: "30d",   label: "Last 30 Days" },
    { key: "90d",   label: "Last 90 Days" },
    { key: "365d",  label: "Last Year"    },
    { key: "all",   label: "All"          },
  ];

  const [activeRange, setActiveRange] = useState<RangeKey>("today");
  const [rangeOpen, setRangeOpen]     = useState(false);

  const buildParams = (range: RangeKey): Record<string, any> => {
    if (range === "today") return { today: true };
    if (range === "all")   return {};          // no date filter → backend returns everything
    const end   = new Date();
    const start = new Date();
    const days  = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    start.setDate(start.getDate() - days + 1);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { startDate: fmt(start), endDate: fmt(end) };
  };

  // ─── Fetchers ────────────────────────────────────────────────────────────────

  const fetchSmsStats = async (range: RangeKey) => {
    try {
      const d = await getSmsStatsApi(buildParams(range));
      setTotalSms(Number(d.count).toLocaleString());
      setDeliveredCount(Number(d.deliveredCount).toLocaleString());
      setFailedCount(Number(d.failedCount).toLocaleString());
      setDeliveryRate(`${d.deliveryRate}%`);
    } catch (e) {
      console.error("fetchSmsStats failed", e);
    }
  };

  const fetchHourlyTraffic = async (range: RangeKey) => {
    try {
      const data = await getSmsHourlyApi(buildParams(range));
      setTrafficData(data);
    } catch (e) {
      console.error("fetchHourlyTraffic failed", e);
    }
  };

  const fetchDlrStats = async (range: RangeKey) => {
    try {
      const d = await getDlrStatsApi(buildParams(range));
      setDlrData([
        { name: "Delivered", value: d.deliveredPercent, color: DLR_COLORS.Delivered },
        { name: "Failed",    value: d.failedPercent,    color: DLR_COLORS.Failed    },
        { name: "Pending",   value: d.pendingPercent,   color: DLR_COLORS.Pending   },
        { name: "Rejected",  value: d.rejectedPercent,  color: DLR_COLORS.Rejected  },
      ]);
    } catch (e) {
      console.error("fetchDlrStats failed", e);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const [connectedRes, boundRes] = await Promise.all([
        getClientSessionsApi("clientSession", 1, 5, { status: "CONNECTED" }),
        getClientSessionsApi("clientSession", 1, 5, { status: "BOUND"     }),
      ]);
      const connectedResults = connectedRes?.results ?? [];
      const boundResults     = boundRes?.results     ?? [];
      const connectedCount   = connectedRes?.count   ?? 0;
      const boundCount       = boundRes?.count       ?? 0;

      const seen = new Set<string>();
      const merged: ClientSessionData[] = [];
      for (const s of [...connectedResults, ...boundResults]) {
        const key = String(s.sessionId || s.id || "");
        if (!seen.has(key)) { seen.add(key); merged.push(s); }
      }

      setLiveSessions(merged.slice(0, 5));
      setActiveSessionsCount(connectedCount + boundCount);
    } catch (e) {
      console.error("fetchActiveSessions failed", e);
    }
  };

  const fetchOnlineVendors = async () => {
    try {
      const res = await getVendorsApi("vendor", 1, 1, { bindStatus: "ONLINE" });
      if (res?.count !== undefined) setOnlineVendors(res.count);
    } catch (e) {
      console.error("fetchOnlineVendors failed", e);
    }
  };

  const fetchOnlineClients = async () => {
    try {
      const res = await getClientsApi("client", 1, 1, { bindStatus: "ONLINE" });
      if (res?.count !== undefined) setOnlineClients(res.count);
    } catch (e) {
      console.error("fetchOnlineClients failed", e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationApi(1, 5);
      if (res?.results) setNotifications(res.results);
    } catch (e) {
      console.error("fetchNotifications failed", e);
    }
  };

  const fetchRevenue = async (range: RangeKey) => {
    try {
      const d = await getRevenueApi(buildParams(range));
      setRevenue(d);
    } catch (e) {
      console.error("fetchRevenue failed", e);
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSmsStats(activeRange);
    fetchHourlyTraffic(activeRange);
    fetchDlrStats(activeRange);
    fetchActiveSessions();
    fetchOnlineVendors();
    fetchOnlineClients();
    fetchNotifications();
    fetchRevenue(activeRange);

    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    if (!wsBase) return;

    const ws = new WebSocket(`${wsBase}/ws/status/`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === "session_update") fetchActiveSessions();
      } catch (err) {
        console.error("WebSocket parse error in Dashboard", err);
      }
    };
    return () => ws.close();
  }, [activeRange]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const formatNotificationTime = (iso?: string) => {
    if (!iso) return "";
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const activeRangeLabel = RANGE_OPTIONS.find((r) => r.key === activeRange)?.label ?? "";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto pb-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            Live system metrics and SMS traffic analytics.{" "}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {activeRangeLabel}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range dropdown */}
          <div className="relative">
            <button
              onClick={() => setRangeOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-text-primary dark:text-white shadow-sm hover:border-primary hover:text-primary transition-colors"
            >
              <Calendar size={15} className="text-primary" />
              {activeRangeLabel}
              <ChevronDown
                size={15}
                className={`transition-transform ${rangeOpen ? "rotate-180" : ""}`}
              />
            </button>
            {rangeOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setActiveRange(opt.key); setRangeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      activeRange === opt.key
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-secondary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <Home size={16} className="text-gray-400" />
            <span className="text-text-primary dark:text-white">Dashboard</span>
          </div>
        </div>
      </div>

      {/* Row 1: KPI Cards — SMS stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title={`Total SMS (${activeRangeLabel})`}
          value={totalSms}
          icon={<MessageSquare size={24} />}
        />
        <StatCard
          title={`Delivered (${activeRangeLabel})`}
          value={deliveredCount}
          icon={<Activity size={24} />}
        />
        <StatCard
          title={`Failed (${activeRangeLabel})`}
          value={failedCount}
          icon={<XCircle size={24} />}
        />
        <StatCard
          title="Delivery Rate"
          value={deliveryRate}
          icon={<Activity size={24} />}
          trendText={activeRangeLabel}
        />
      </div>

      {/* Row 2: KPI Cards — Connectivity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Active Client Sessions"
          value={activeSessionsCount}
          icon={<Monitor size={24} />}
          trendText="Live via WebSocket"
        />
        <StatCard
          title="Online Clients"
          value={onlineClients}
          icon={<Users size={24} />}
          trendText="bindStatus: ONLINE"
        />
        <StatCard
          title="Online Vendors"
          value={onlineVendors}
          icon={<Server size={24} />}
          trendText="bindStatus: ONLINE"
        />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Traffic Volume */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4">
            Traffic Volume (24h)
          </h3>
          <div className="h-[280px] w-full">
            {trafficData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trafficData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? "#374151" : "#f3f4f6"}
                  />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                    dy={10}
                    interval={3}
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                    dx={-10}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#fff",
                      borderColor:     isDark ? "#374151" : "#e5e7eb",
                      borderRadius:    "0.5rem",
                    }}
                    itemStyle={{ color: "var(--color-primary)", fontWeight: 600 }}
                    labelFormatter={(h) => `Hour ${h}:00`}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-text-secondary dark:text-gray-500">
                Loading traffic data…
              </div>
            )}
          </div>
        </div>

        {/* DLR Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4">
            DLR Breakdown ({activeRangeLabel})
          </h3>
          <div className="h-[280px] w-full flex-1">
            {dlrData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dlrData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {dlrData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#fff",
                      borderColor:     isDark ? "#374151" : "#e5e7eb",
                      borderRadius:    "0.5rem",
                    }}
                    itemStyle={{ fontWeight: 600 }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value: string, entry) => {
                      const p = entry.payload as { value?: number };
                      return (
                        <span className="text-sm text-text-secondary dark:text-gray-300">
                          {value}{" "}
                          <span className="font-medium text-text-primary dark:text-white ml-1">
                            ({p?.value}%)
                          </span>
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-text-secondary dark:text-gray-500">
                Loading DLR data…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Revenue"
          value={revenue ? `$${revenue.total_revenue.toFixed(2)}` : "-"}
          icon={<DollarSign size={24} />}
          trendText="Received from clients"
        />
        <StatCard
          title="Total Cost"
          value={revenue ? `$${revenue.total_cost.toFixed(2)}` : "-"}
          icon={<DollarSign size={24} />}
          trendText="Paid to vendors"
        />
        <StatCard
          title="Gross Margin"
          value={revenue ? `$${revenue.gross_margin.toFixed(2)}` : "-"}
          icon={<TrendingUp size={24} />}
          trendText="Revenue minus cost"
        />
        <StatCard
          title="Margin %"
          value={revenue ? `${revenue.margin_pct}%` : "-"}
          icon={<Activity size={24} />}
          trendText="Gross margin percentage"
        />
      </div>

      {/* Row 5: Live Sessions + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Sessions Table — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
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
                  <th className="p-4 text-xs font-medium text-text-secondary dark:text-gray-400">Client</th>
                  <th className="p-4 text-xs font-medium text-text-secondary dark:text-gray-400">System ID</th>
                  <th className="p-4 text-xs font-medium text-text-secondary dark:text-gray-400">Bind Type</th>
                  <th className="p-4 text-xs font-medium text-text-secondary dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {liveSessions.length > 0 ? (
                  liveSessions.map((session, i) => (
                    <tr
                      key={session.id || session.sessionId || i}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="p-4 text-sm font-medium text-text-primary dark:text-white">
                        {session.sessionId}
                      </td>
                      <td className="p-4 text-sm text-text-secondary dark:text-gray-300">
                        {session.clientUsername}
                      </td>
                      <td className="p-4 text-sm text-text-secondary dark:text-gray-300">
                        {session.systemId}
                      </td>
                      <td className="p-4 text-sm text-text-secondary dark:text-gray-300">
                        {session.bindType || "—"}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {session.status || "CONNECTED"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <Monitor size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-text-secondary dark:text-gray-400 text-sm">
                        No active sessions found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications — 1/3 width */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-text-primary dark:text-white flex items-center gap-2">
              <Bell size={18} />
              Notifications
            </h3>
            <NavLink to="/notifications">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
                View All
              </Button>
            </NavLink>
          </div>
          <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.length > 0 ? (
              notifications.map((n, i) => (
                <div
                  key={n.id || i}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <p className="text-sm font-medium text-text-primary dark:text-white leading-snug">
                      {n.title}
                    </p>
                    <span className="text-xs text-text-secondary dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                      {formatNotificationTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary dark:text-gray-400 leading-relaxed">
                    {n.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <Bell size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-text-secondary dark:text-gray-400 text-sm">
                  No notifications yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;