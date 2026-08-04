import React, { useState, useEffect, useRef } from "react";
import { Home, ChevronRight, ChevronDown, Plus, Minus, Download, RefreshCw } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import FilterCard from "../../components/ui/FilterCard";
import DatePicker from "../../components/ui/DatePicker";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { actionHelper } from "../../helper/action";
import {
  getAnalyticsReportApi,
  type DateAnalytics,
} from "../../api/reportApi/analyticsApi";

// --- Mock Data ---
const MOCK_ANALYTICS_DATA: DateAnalytics[] = [
  {
    id: "date_2026_08_03",
    date: "2026-08-03",
    attempts: 9705,
    successful: 9704,
    submitted: 9704,
    dlrPct: 90.15,
    marginUsd: 50.29,
    revenueUsd: 579.83,
    delivered: 8748,
    avgDeliveryTime: 0.66,
    marginPct: 8.67,
    vendorCost: 529.55,
    clients: [
      {
        id: "client_101",
        clientName: "pastel Provider",
        attempts: 3444,
        successful: 3444,
        submitted: 3444,
        dlrPct: 100.0,
        marginUsd: 2.99,
        revenueUsd: 7.45,
        delivered: 3444,
        avgDeliveryTime: 0.1,
        marginPct: 40.13,
        vendorCost: 4.46,
        vendors: [
          {
            id: "vendor_v1",
            vendorName: "DLR Veritas DEL",
            attempts: 143,
            successful: 143,
            submitted: 143,
            dlrPct: 95.1,
            marginUsd: 0.32,
            revenueUsd: 2.35,
            delivered: 136,
            avgDeliveryTime: 0.36,
            marginPct: 13.49,
            vendorCost: 2.03,
          },
          {
            id: "vendor_v2",
            vendorName: "China Skyline Telecom Co.,Ltd",
            attempts: 3301,
            successful: 3301,
            submitted: 3301,
            dlrPct: 90.77,
            marginUsd: 2.67,
            revenueUsd: 5.1,
            delivered: 3308,
            avgDeliveryTime: 0.08,
            marginPct: 52.35,
            vendorCost: 2.43,
          },
        ],
      },
      {
        id: "client_102",
        clientName: "Acme SMS Global",
        attempts: 6261,
        successful: 6260,
        submitted: 6260,
        dlrPct: 78.06,
        marginUsd: 47.3,
        revenueUsd: 572.38,
        delivered: 5304,
        avgDeliveryTime: 0.97,
        marginPct: 16.44,
        vendorCost: 525.08,
        vendors: [
          {
            id: "vendor_v3",
            vendorName: "PaaSoo Technology Limited",
            attempts: 337,
            successful: 336,
            submitted: 336,
            dlrPct: 2.86,
            marginUsd: 0.41,
            revenueUsd: 1.02,
            delivered: 305,
            avgDeliveryTime: 0.39,
            marginPct: 74.13,
            vendorCost: 0.61,
          },
        ],
      },
    ],
  },
  {
    id: "date_2026_08_02",
    date: "2026-08-02",
    attempts: 8412,
    successful: 8410,
    submitted: 8410,
    dlrPct: 88.4,
    marginUsd: 42.1,
    revenueUsd: 490.2,
    delivered: 7436,
    avgDeliveryTime: 0.72,
    marginPct: 8.58,
    vendorCost: 448.1,
    clients: [],
  },
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- VISUAL DATA BAR COMPONENTS ---

// 1. Proportional Blue / Purple Fill Bar Cell
const DataBarCell: React.FC<{
  value: number;
  max: number;
  type?: "volume" | "currency";
}> = ({ value, max, type = "volume" }) => {
  const percentage = Math.min(Math.max((value / (max || 1)) * 100, 4), 100);

  const fillBg =
    type === "volume"
      ? "bg-sky-200/80 dark:bg-sky-900/50"
      : "bg-fuchsia-200/80 dark:bg-fuchsia-900/50";

  return (
    <div className="relative w-full h-7 flex items-center justify-end px-2 overflow-hidden rounded-sm">
      <div
        className={`absolute right-0 top-0 bottom-0 ${fillBg} transition-all duration-300 rounded-sm`}
        style={{ width: `${percentage}%` }}
      />
      <span className="relative z-10 font-mono text-xs font-semibold text-text-primary dark:text-gray-100">
        {type === "currency" ? `$${value.toFixed(2)}` : value.toLocaleString()}
      </span>
    </div>
  );
};

// 2. DLR % Full Visual Box (Green >= 85%, Orange 60-84%, Red < 60%)
const DlrCell: React.FC<{ pct: number }> = ({ pct }) => {
  let boxBg = "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white";
  if (pct < 85 && pct >= 60) {
    boxBg = "bg-amber-500 text-white dark:bg-amber-600 dark:text-white";
  } else if (pct < 60) {
    boxBg = "bg-red-500 text-white dark:bg-red-600 dark:text-white";
  }

  return (
    <div className="w-full h-7 flex items-center justify-end px-2">
      <div
        className={`w-full max-w-[80px] h-6 flex items-center justify-center rounded px-1.5 font-mono text-xs font-bold shadow-xs ${boxBg}`}
      >
        {pct.toFixed(2)}%
      </div>
    </div>
  );
};

// 3. Margin % Cell with Side Bar Chart Indicator
const MarginPctCell: React.FC<{ pct: number }> = ({ pct }) => {
  let barBg = "bg-emerald-500 dark:bg-emerald-400";
  if (pct < 20 && pct >= 8) {
    barBg = "bg-amber-500 dark:bg-amber-400";
  } else if (pct < 8) {
    barBg = "bg-red-500 dark:bg-red-400";
  }

  const barWidth = Math.min(Math.max((pct / 100) * 48, 4), 48);

  return (
    <div className="w-full h-7 flex items-center justify-end space-x-2 px-1">
      {/* Mini Visual Bar */}
      <div className="w-12 h-3.5 bg-gray-200 dark:bg-gray-700/80 rounded-xs overflow-hidden flex items-center justify-start">
        <div
          className={`h-full ${barBg} transition-all duration-300`}
          style={{ width: `${barWidth}px` }}
        />
      </div>
      {/* Text Value */}
      <span className="font-mono text-xs font-bold min-w-[50px] text-right text-text-primary dark:text-gray-100">
        {pct.toFixed(2)}%
      </span>
    </div>
  );
};

// --- MAIN ANALYTICS COMPONENT ---

const AnalyticsReport: React.FC = () => {
  const [data, setData] = useState<DateAnalytics[]>(MOCK_ANALYTICS_DATA);
  const [isLoading, setIsLoading] = useState(false);

  // Expanded State
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    date_2026_08_03: true, // Default open 1st date for immediate preview
  });
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({
    "date_2026_08_03_client_101": true,
  });

  // Filters
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState("DAY");

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        actionHelper("Analytics", "Opened Analytics Report Module", false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  const toggleDate = (dateId: string) => {
    setExpandedDates((prev) => ({ ...prev, [dateId]: !prev[dateId] }));
  };

  const toggleClient = (compositeKey: string) => {
    setExpandedClients((prev) => ({ ...prev, [compositeKey]: !prev[compositeKey] }));
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = {
        fromDate: fromDate ? formatLocalDate(fromDate) : undefined,
        toDate: toDate ? formatLocalDate(toDate) : undefined,
        groupBy,
      };
      const res = await getAnalyticsReportApi("sms", params);
      if (Array.isArray(res) && res.length > 0) {
        setData(res);
      }
      toast.success("Analytics refreshed successfully");
    } catch (error) {
      toast.info("Showing current analytics grid");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAnalytics();
  };

  const handleClear = () => {
    setFromDate(null);
    setToDate(null);
    setGroupBy("DAY");
    setExpandedDates({});
    setExpandedClients({});
    setData(MOCK_ANALYTICS_DATA);
  };

  // Max values for proportional data bars
  const maxAttempts = Math.max(...data.map((d) => d.attempts || 1), 10000);
  const maxRevenue = Math.max(...data.map((d) => d.revenueUsd || 1), 600);

  return (
    <div className="container mx-auto pb-12">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Analytics Report
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Report</span>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Analytics</span>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard onSearch={handleSearch} onClear={handleClear}>
        <DatePicker
          label="From Date"
          selected={fromDate}
          onChange={(date) => setFromDate(date)}
        />
        <DatePicker
          label="To Date"
          selected={toDate}
          onChange={(date) => setToDate(date)}
        />
        <Select
          label="Group Period"
          value={groupBy}
          onChange={(val) => setGroupBy(val)}
          options={[
            { label: "Day", value: "DAY" },
            { label: "Hour", value: "HOUR" },
            { label: "Month", value: "MONTH" },
          ]}
        />
      </FilterCard>

      {/* Hierarchical Data Grid */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 dark:bg-gray-900/40">
          <span className="text-sm font-semibold text-text-primary dark:text-white">
            Traffic Analytics (Date &rarr; Client &rarr; Vendor)
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={handleSearch}
              leftIcon={<RefreshCw size={14} />}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download size={14} />}
              onClick={() => toast.info("Exporting grid...")}
            >
              Export Grid
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider bg-gray-100/90 dark:bg-gray-900/90">
                <th className="px-4 py-3 min-w-[240px]">Entity</th>
                <th className="px-2 py-3 text-right min-w-[100px]">Attempts</th>
                <th className="px-2 py-3 text-right min-w-[100px]">Successful</th>
                <th className="px-2 py-3 text-right min-w-[100px]">Submitted</th>
                <th className="px-2 py-3 text-right min-w-[100px]">DLR %</th>
                <th className="px-2 py-3 text-right min-w-[100px]">Delivered</th>
                <th className="px-2 py-3 text-right min-w-[110px]">Revenue ($)</th>
                <th className="px-2 py-3 text-right min-w-[110px]">Vendor Cost ($)</th>
                <th className="px-2 py-3 text-right min-w-[110px]">Margin ($)</th>
                <th className="px-2 py-3 text-right min-w-[120px]">Margin %</th>
                <th className="px-3 py-3 text-right min-w-[90px]">Avg Deliv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60 font-sans text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-text-secondary dark:text-gray-400"
                  >
                    Loading analytics data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-text-secondary dark:text-gray-400"
                  >
                    No analytics records found.
                  </td>
                </tr>
              ) : (
                data.map((dateRow) => {
                  const isDateExpanded = !!expandedDates[dateRow.id];

                  return (
                    <React.Fragment key={dateRow.id}>
                      {/* LEVEL 0: DATE ROW */}
                      <tr className="bg-gray-100/70 dark:bg-gray-800/90 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleDate(dateRow.id)}
                            className="inline-flex items-center space-x-2 text-primary hover:underline focus:outline-none"
                          >
                            <span className="p-0.5 rounded bg-primary/10 text-primary">
                              {isDateExpanded ? (
                                <Minus size={14} />
                              ) : (
                                <Plus size={14} />
                              )}
                            </span>
                            <span className="font-mono text-sm">{dateRow.date}</span>
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <DataBarCell value={dateRow.attempts} max={maxAttempts} />
                        </td>
                        <td className="px-2 py-2">
                          <DataBarCell value={dateRow.successful} max={maxAttempts} />
                        </td>
                        <td className="px-2 py-2">
                          <DataBarCell value={dateRow.submitted} max={maxAttempts} />
                        </td>
                        <td className="px-2 py-2">
                          <DlrCell pct={dateRow.dlrPct} />
                        </td>
                        <td className="px-2 py-2">
                          <DataBarCell value={dateRow.delivered} max={maxAttempts} />
                        </td>
                        <td className="px-2 py-2">
                          <DataBarCell value={dateRow.revenueUsd} max={maxRevenue} type="currency" />
                        </td>
                        <td className="px-2 py-2">
                          <DataBarCell value={dateRow.vendorCost} max={maxRevenue} type="currency" />
                        </td>
                        <td className="px-2 py-2">
                          <DataBarCell value={dateRow.marginUsd} max={maxRevenue} type="currency" />
                        </td>
                        <td className="px-2 py-2">
                          <MarginPctCell pct={dateRow.marginPct} />
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-gray-500 whitespace-nowrap">
                          {dateRow.avgDeliveryTime.toFixed(2)}s
                        </td>
                      </tr>

                      {/* LEVEL 1: CLIENT ROWS */}
                      {isDateExpanded &&
                        dateRow.clients?.map((clientRow) => {
                          const clientCompositeKey = `${dateRow.id}_${clientRow.id}`;
                          const isClientExpanded =
                            !!expandedClients[clientCompositeKey];

                          return (
                            <React.Fragment key={clientCompositeKey}>
                              <tr className="bg-blue-50/40 dark:bg-gray-800/40 hover:bg-blue-50/70 dark:hover:bg-gray-700/40 transition-colors">
                                <td className="px-4 py-2 pl-8 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleClient(clientCompositeKey)
                                    }
                                    className="inline-flex items-center space-x-2 text-text-primary dark:text-gray-200 hover:text-primary focus:outline-none"
                                  >
                                    <span className="p-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                      {isClientExpanded ? (
                                        <ChevronDown size={14} />
                                      ) : (
                                        <ChevronRight size={14} />
                                      )}
                                    </span>
                                    <span className="font-medium">
                                      {clientRow.clientName}
                                    </span>
                                  </button>
                                </td>
                                <td className="px-2 py-1.5">
                                  <DataBarCell value={clientRow.attempts} max={maxAttempts} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <DataBarCell value={clientRow.successful} max={maxAttempts} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <DataBarCell value={clientRow.submitted} max={maxAttempts} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <DlrCell pct={clientRow.dlrPct} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <DataBarCell value={clientRow.delivered} max={maxAttempts} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <DataBarCell value={clientRow.revenueUsd} max={maxRevenue} type="currency" />
                                </td>
                                <td className="px-2 py-1.5">
                                  <DataBarCell value={clientRow.vendorCost} max={maxRevenue} type="currency" />
                                </td>
                                <td className="px-2 py-1.5">
                                  <DataBarCell value={clientRow.marginUsd} max={maxRevenue} type="currency" />
                                </td>
                                <td className="px-2 py-1.5">
                                  <MarginPctCell pct={clientRow.marginPct} />
                                </td>
                                <td className="px-3 py-1.5 text-right font-mono text-xs text-gray-500 whitespace-nowrap">
                                  {clientRow.avgDeliveryTime.toFixed(2)}s
                                </td>
                              </tr>

                              {/* LEVEL 2: VENDOR ROWS */}
                              {isClientExpanded &&
                                clientRow.vendors?.map((vendorRow) => (
                                  <tr
                                    key={vendorRow.id}
                                    className="bg-white dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-xs text-text-secondary dark:text-gray-400"
                                  >
                                    <td className="px-4 py-2 pl-14 flex items-center space-x-2 whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                                      <span className="font-mono text-gray-700 dark:text-gray-300">
                                        {vendorRow.vendorName}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1">
                                      <DataBarCell value={vendorRow.attempts} max={maxAttempts} />
                                    </td>
                                    <td className="px-2 py-1">
                                      <DataBarCell value={vendorRow.successful} max={maxAttempts} />
                                    </td>
                                    <td className="px-2 py-1">
                                      <DataBarCell value={vendorRow.submitted} max={maxAttempts} />
                                    </td>
                                    <td className="px-2 py-1">
                                      <DlrCell pct={vendorRow.dlrPct} />
                                    </td>
                                    <td className="px-2 py-1">
                                      <DataBarCell value={vendorRow.delivered} max={maxAttempts} />
                                    </td>
                                    <td className="px-2 py-1">
                                      <DataBarCell value={vendorRow.revenueUsd} max={maxRevenue} type="currency" />
                                    </td>
                                    <td className="px-2 py-1">
                                      <DataBarCell value={vendorRow.vendorCost} max={maxRevenue} type="currency" />
                                    </td>
                                    <td className="px-2 py-1">
                                      <DataBarCell value={vendorRow.marginUsd} max={maxRevenue} type="currency" />
                                    </td>
                                    <td className="px-2 py-1">
                                      <MarginPctCell pct={vendorRow.marginPct} />
                                    </td>
                                    <td className="px-3 py-1 text-right font-mono whitespace-nowrap">
                                      {vendorRow.avgDeliveryTime.toFixed(2)}s
                                    </td>
                                  </tr>
                                ))}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport;