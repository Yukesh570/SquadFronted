import React, { useState, useEffect, useRef } from "react";
import { Home, Download, Eye, Save } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// API
import {
  getTrafficLogsApi,
  exportTrafficLogsApi,
  type TrafficLogData,
} from "../../api/reportApi/liveTrafficApi";

// Components
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, {
  type FilterColumn,
} from "../../components/ui/AdvancedFilter";
import TraceModal from "../../components/modals/Report/TraceModal";

// --- Interfaces ---
interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: TrafficLogData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
}

// --- 1. Static Options ---
const timeRangeOptions: Option[] = [
  { label: "Last 1 Hour", value: "1h" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
];

const statusOptions: Option[] = [
  { label: "Delivered", value: "DELIVERED" },
  { label: "Failed", value: "FAILED" },
  { label: "Pending", value: "PENDING" },
  { label: "Undelivered", value: "UNDELIVERED" },
];

// --- 2. CONFIGURATION: STRICTLY SEPARATED LISTS ---

// LIST A: Filter Options
const filterOptionsConfig: ColumnConfig[] = [
  {
    key: "timeRange",
    label: "Time Range",
    type: "text",
    options: timeRangeOptions,
  },
  { key: "client", label: "Client", type: "text" },
  { key: "vendor", label: "Vendor", type: "text" },
  { key: "route", label: "Route", type: "text" },
  { key: "country", label: "Country", type: "text" },
  { key: "operator", label: "Operator", type: "text" },
  { key: "senderId", label: "Sender ID", type: "text" },
  { key: "messageType", label: "Message Type", type: "text" },
  { key: "status", label: "Status", type: "text", options: statusOptions },
];

// LIST B: Table Columns
const tableColumnsConfig: ColumnConfig[] = [
  {
    key: "messageId",
    label: "Message ID",
    type: "text",
    render: (log) => (
      <span className="font-mono text-xs text-primary">{log.messageId}</span>
    ),
  },
  {
    key: "time",
    label: "Time",
    type: "text",
    render: (log) => (
      <span className="text-xs text-text-secondary">
        {new Date(log.time).toLocaleString()}
      </span>
    ),
  },
  { key: "client", label: "Client", type: "text" },
  {
    key: "vendorRoute",
    label: "Vendor/Route",
    type: "text",
    render: (log) => (
      <div className="flex flex-col">
        <span className="font-medium text-text-primary dark:text-white">
          {log.vendor}
        </span>
        <span className="text-xs text-text-secondary">{log.route}</span>
      </div>
    ),
  },
  { key: "msisdn", label: "MSISDN", type: "text" },
  { key: "senderId", label: "Sender ID", type: "text" },
  {
    key: "status",
    label: "Status",
    type: "text",
    render: (log) => {
      const colors: Record<string, string> = {
        DELIVERED:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        PENDING:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        UNDELIVERED:
          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      };
      return (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${colors[log.status] || "bg-gray-100 text-gray-600"}`}
        >
          {log.status}
        </span>
      );
    },
  },
  {
    key: "error",
    label: "Error",
    type: "text",
    render: (log) => (
      <span className="text-red-500 text-xs">{log.error || "-"}</span>
    ),
  },
  { key: "latency", label: "Latency", type: "text" },
  { key: "cost", label: "Cost", type: "number" },
];

// --- 3. DEFAULTS ---
const DEFAULT_SEARCH_COLUMNS = ["timeRange", "status", "client"];
const DEFAULT_TABLE_COLUMNS = [
  "time",
  "messageId",
  "client",
  "vendorRoute",
  "msisdn",
  "status",
  "cost",
];

const LiveTraffic: React.FC = () => {
  // --- State ---
  const [logs, setLogs] = useState<TrafficLogData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Visibility
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS,
  );

  // Table Visibility
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("traffic_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  // Filter Values
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    timeRange: "24h", // Mandatory default
  });

  // Modal
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TrafficLogData | null>(null);

  // Routing
  const location = useLocation();
  const moduleName = location.pathname.split("/").pop() || "liveTraffic";
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist Table Preference
  useEffect(() => {
    localStorage.setItem("traffic_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  // Derived Lists
  const visibleSearchFields = filterOptionsConfig.filter((col) =>
    searchColumns.includes(col.key),
  );
  const visibleTableFields = tableColumnsConfig.filter((col) =>
    tableColumns.includes(col.key),
  );

  // --- API Logic ---
  const fetchLogs = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;

    setIsLoading(true);
    try {
      const currentSearchParams: Record<string, any> = {};
      Object.entries(filterValues).forEach(([key, val]) => {
        if (val) currentSearchParams[key] = val;
      });

      const response = await getTrafficLogsApi(
        moduleName,
        currentPage,
        rowsPerPage,
        currentSearchParams,
      );

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setLogs(response.results);
        setTotalItems(response.count);
      } else {
        setLogs([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error(error);
        toast.error("Failed to fetch traffic logs.");
      }
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [moduleName, currentPage, rowsPerPage, filterValues.timeRange]);

  // --- Handlers ---
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilterValues({ timeRange: "24h" });
    setCurrentPage(1);
    setTimeout(() => fetchLogs(), 0);
  };

  const handleExport = async () => {
    try {
      const blob = await exportTrafficLogsApi(moduleName, filterValues);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traffic_report_${new Date().toISOString()}.csv`;
      a.click();
      toast.success("Export started successfully");
    } catch (err) {
      toast.error("Failed to export data");
    }
  };

  const handleViewTrace = (log: TrafficLogData) => {
    setSelectedLog(log);
    setIsTraceModalOpen(true);
  };

  const tableHeaders = [
    ...visibleTableFields.map((col) => col.label),
    "Action",
  ];

  return (
    <div className="container mx-auto">
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Live Traffic Monitor
          </h1>

          {/* 1. SEARCH FIELDS FILTER */}
          <div className="relative z-20">
            <AdvancedFilter
              columns={filterOptionsConfig}
              selectedColumns={searchColumns}
              onFilter={(newCols) => {
                setSearchColumns(newCols);
                setFilterValues((prev) => {
                  const next = { ...prev };
                  Object.keys(next).forEach((k) => {
                    if (!newCols.includes(k) && k !== "timeRange")
                      delete next[k];
                  });
                  return next;
                });
              }}
              onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)}
              isLoading={isLoading}
              buttonLabel="Search Fields"
            />
          </div>

          {/* 2. TABLE COLUMNS FILTER */}
          <div className="relative z-20">
            <AdvancedFilter
              columns={tableColumnsConfig}
              selectedColumns={tableColumns}
              onFilter={setTableColumns}
              onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
              buttonLabel="Columns"
            />
          </div>

          {/* 3. SAVE PRESET BUTTON (Replaced with proper Button component) */}
          <div className="relative z-20">
            <Button
              variant="secondary"
              onClick={() => toast.info("Filter Preset Saved")}
              title="Save filter presets"
              // Square-ish shape to match dropdown buttons
              className="!px-3"
            >
              <Save size={18} />
            </Button>
          </div>
        </div>

        {/* BREADCRUMBS */}
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Report</span>
        </div>
      </div>

      {/* DYNAMIC FILTER CARD */}
      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          if (col.options) {
            return (
              <Select
                key={col.key}
                label={col.label}
                value={filterValues[col.key] || ""}
                onChange={(val) => handleFilterChange(col.key, val)}
                options={col.options}
                placeholder={`Select ${col.label}`}
              />
            );
          }
          return (
            <Input
              key={col.key}
              label={col.label}
              value={filterValues[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              placeholder={`Search ${col.label}`}
            />
          );
        })}
      </FilterCard>

      {/* DATA TABLE */}
      <DataTable
        serverSide={true}
        data={logs}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={tableHeaders}
        isLoading={isLoading}
        headerActions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              leftIcon={<Download size={18} />}
            >
              Export
            </Button>
          </div>
        }
        renderRow={(log, index) => (
          <tr
            key={log.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors"
          >
            {visibleTableFields.map((col) => {
              const cellData = (log as any)[col.key];
              if (col.render) {
                return (
                  <td
                    key={col.key}
                    className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                  >
                    {col.render(log)}
                  </td>
                );
              }
              return (
                <td
                  key={col.key}
                  className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                >
                  {cellData || "-"}
                </td>
              );
            })}

            {/* ACTION COLUMN */}
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleViewTrace(log)}
                  title="View Trace"
                >
                  <Eye size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* TRACE MODAL */}
      <TraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        data={selectedLog}
      />
    </div>
  );
};

export default LiveTraffic;
