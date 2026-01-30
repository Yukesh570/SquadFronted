import React, { useState, useEffect, useRef, useMemo } from "react";
import { Home, Download, Eye, Save } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// --- API ---
import {
  getMessageLogsApi,
  exportMessageLogsApi,
  type MessageLogData,
} from "../../api/reportApi/messageReportApi";

// --- Components ---
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, {
  type FilterColumn,
} from "../../components/ui/AdvancedFilter";
import CustomDatePicker from "../../components/ui/DatePicker";
import MessageDetailsModal from "../../components/modals/Report/MessageDetailsModal";

// --- Interfaces ---
interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: MessageLogData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  type: "text" | "number" | "date";
}

// --- Static Options (Based on Screenshot) ---
const statusOptions: Option[] = [
  { label: "Queued", value: "Queued" },
  { label: "Sent", value: "Sent" },
  { label: "Delivered", value: "Delivered" },
  { label: "Failed", value: "Failed" },
];

// --- Defaults ---
const DEFAULT_SEARCH_COLUMNS = ["timeRange", "status", "text"];
const DEFAULT_TABLE_COLUMNS = [
  "id",
  "text",
  "status",
  "createdAt",
  "updatedAt",
];

const MessageReport: React.FC = () => {
  // --- State ---
  const [logs, setLogs] = useState<MessageLogData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Column Visibility (Persistence)
  const [searchColumns, setSearchColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("msg_search_columns");
    return saved ? JSON.parse(saved) : DEFAULT_SEARCH_COLUMNS;
  });

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("msg_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    startDate: "",
    endDate: "",
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MessageLogData | null>(null);

  // Routing
  const location = useLocation();
  const moduleName = location.pathname.split("/").pop() || "messageLog";
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Configuration ---
  const filterOptionsConfig: ColumnConfig[] = useMemo(
    () => [
      { key: "timeRange", label: "Date Range", type: "date" },
      { key: "text", label: "Message Text", type: "text" },
      { key: "status", label: "Status", type: "text", options: statusOptions },
      { key: "id", label: "ID", type: "number" },
    ],
    [],
  );

  const tableColumnsConfig: ColumnConfig[] = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        type: "number",
        render: (log) => (
          <span className="font-mono text-xs text-text-secondary">
            {log.id}
          </span>
        ),
      },
      {
        key: "text",
        label: "Text",
        type: "text",
        render: (log) => (
          <div
            className="max-w-md truncate text-sm text-text-primary dark:text-white"
            title={log.text}
          >
            {log.text}
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        type: "text",
        render: (log) => {
          const colors: Record<string, string> = {
            Delivered:
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            Failed:
              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            Sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            Queued:
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
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
        key: "createdAt",
        label: "Created At",
        type: "date",
        render: (log) => (
          <span className="text-xs text-text-secondary">
            {new Date(log.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        key: "updatedAt",
        label: "Updated At",
        type: "date",
        render: (log) => (
          <span className="text-xs text-text-secondary">
            {new Date(log.updatedAt).toLocaleString()}
          </span>
        ),
      },
    ],
    [],
  );

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem("msg_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  useEffect(() => {
    localStorage.setItem("msg_search_columns", JSON.stringify(searchColumns));
  }, [searchColumns]);

  const visibleSearchFields = filterOptionsConfig.filter((col) =>
    searchColumns.includes(col.key),
  );
  const visibleTableFields = tableColumnsConfig.filter((col) =>
    tableColumns.includes(col.key),
  );

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

      const response = await getMessageLogsApi(
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
        toast.error("Failed to fetch message logs.");
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
  }, [
    moduleName,
    currentPage,
    rowsPerPage,
    filterValues.startDate,
    filterValues.endDate,
  ]);

  // --- Handlers ---
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilterValues({ startDate: "", endDate: "" });
    setCurrentPage(1);
    setTimeout(() => fetchLogs(), 0);
  };

  const handleExport = async () => {
    try {
      const blob = await exportMessageLogsApi(moduleName, filterValues);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `message_report_${new Date().toISOString()}.csv`;
      a.click();
      toast.success("Export started successfully");
    } catch (err) {
      toast.error("Failed to export data");
    }
  };

  const handleViewDetails = (log: MessageLogData) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const tableHeaders = [
    ...visibleTableFields.map((col) => col.label),
    "Action",
  ];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Message Report
          </h1>

          {/* Search Fields Dropdown */}
          <div className="relative z-20">
            <AdvancedFilter
              columns={filterOptionsConfig}
              selectedColumns={searchColumns}
              onFilter={(newCols) => {
                setSearchColumns(newCols);
                setFilterValues((prev) => {
                  const next = { ...prev };
                  Object.keys(next).forEach((k) => {
                    if (
                      !newCols.includes(k) &&
                      k !== "startDate" &&
                      k !== "endDate"
                    )
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

          {/* Table Columns Dropdown */}
          <div className="relative z-20">
            <AdvancedFilter
              columns={tableColumnsConfig}
              selectedColumns={tableColumns}
              onFilter={setTableColumns}
              onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
              buttonLabel="Columns"
            />
          </div>

          {/* Save Preset Button */}
          <div className="relative z-20">
            <Button
              variant="secondary"
              onClick={() => toast.info("Filter Preset Saved")}
              title="Save filter presets"
              className="!px-3"
            >
              <Save size={18} />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Message Report
          </span>
        </div>
      </div>

      {/* Dynamic Filter Card */}
      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          // Time Range Logic
          if (col.key === "timeRange") {
            return (
              <React.Fragment key="timeRange-group">
                <CustomDatePicker
                  label="Start Date"
                  selected={
                    filterValues.startDate
                      ? new Date(filterValues.startDate)
                      : null
                  }
                  onChange={(date) =>
                    handleFilterChange(
                      "startDate",
                      date ? date.toISOString() : "",
                    )
                  }
                  showTimeSelect={true}
                  placeholder="Select Start"
                  isClearable={true}
                />
                <CustomDatePicker
                  label="End Date"
                  selected={
                    filterValues.endDate ? new Date(filterValues.endDate) : null
                  }
                  onChange={(date) =>
                    handleFilterChange(
                      "endDate",
                      date ? date.toISOString() : "",
                    )
                  }
                  showTimeSelect={true}
                  placeholder="Select End"
                  isClearable={true}
                />
              </React.Fragment>
            );
          }

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

      {/* Data Table */}
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
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleViewDetails(log)}
                  title="View Details"
                >
                  <Eye size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      <MessageDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedLog}
      />
    </div>
  );
};

export default MessageReport;
