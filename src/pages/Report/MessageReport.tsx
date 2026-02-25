import React, { useState, useEffect, useRef, useMemo } from "react";
import { Home, Download, Save } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// --- API ---
import {
  getMessageLogsApi,
  exportMessageLogsApi,
  type MessageLogData,
} from "../../api/reportApi/messageReportApi";

// --- Dropdown APIs ---
import { getClientsApi } from "../../api/clientApi/clientApi";
import { getVendorsApi } from "../../api/connectivityApi/vendorApi";
import { getSmppApi } from "../../api/connectivityApi/smppApi";

// --- Components ---
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, {
  type FilterColumn,
} from "../../components/ui/AdvancedFilter";
import { actionHelper } from "../../helper/action";

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

// --- Static Options ---
const statusOptions: Option[] = [
  { label: "Queued", value: "queued" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
  { label: "Delivered", value: "delivered" },
];

const encodingOptions: Option[] = [
  { label: "GSM-7", value: "GSM-7" },
  { label: "UCS-2", value: "UCS-2" },
];

// --- Defaults ---
const DEFAULT_SEARCH_COLUMNS = [
  "destination",
  "clientName",
  "status",
  "message_id",
];
const DEFAULT_TABLE_COLUMNS = [
  "message_id",
  "destination",
  "text",
  "status",
  "encoding",
  "segmentNumber",
  "clientName",
  "vendorName",
  "smppName",
  "systemId",
  // "createdAt",
];

const MessageReport: React.FC = () => {
  // --- State ---
  const [logs, setLogs] = useState<MessageLogData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic Options
  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);
  const [smppOptions, setSmppOptions] = useState<Option[]>([]);

  // Filter & Column Visibility
  const [searchColumns, setSearchColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("msg_search_columns");
    return saved ? JSON.parse(saved) : DEFAULT_SEARCH_COLUMNS;
  });

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("msg_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Routing
  const location = useLocation();
  const moduleName = location.pathname.split("/").pop() || "messageReport";
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Helper: Extract Options ---
  const extractOptions = (
    response: any,
    labelKey: string,
    valueKey: string,
  ) => {
    let data = [];
    if (response && response.results) data = response.results;
    else if (Array.isArray(response)) data = response;
    else if (response && Array.isArray(response.data)) data = response.data;

    return data.map((item: any) => ({
      label: item[labelKey] || item.name || "Unknown",
      value: item[valueKey] || item.name || String(item.id),
    }));
  };

  useEffect(() => {
    const fetchAllOptions = async () => {
      try {
        const [clientsRes, vendorsRes, smppRes] = await Promise.all([
          getClientsApi("client", 1, 1000),
          getVendorsApi("vendor", 1, 1000),
          typeof getSmppApi === "function"
            ? getSmppApi("smpp", 1, 1000)
            : Promise.resolve([]),
        ]);

        setClientOptions(extractOptions(clientsRes, "name", "name"));
        setVendorOptions(
          extractOptions(vendorsRes, "profileName", "profileName"),
        );
        setSmppOptions(extractOptions(smppRes, "systemID", "systemID"));
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    };
    fetchAllOptions();
  }, []);

  // --- Configuration ---
  const filterOptionsConfig: ColumnConfig[] = useMemo(
    () => [
      { key: "message_id", label: "Message ID", type: "text" }, // Added Search Field
      { key: "destination", label: "Destination", type: "text" },
      {
        key: "clientName",
        label: "Client",
        type: "text",
        options: clientOptions,
      },
      {
        key: "vendorName",
        label: "Vendor",
        type: "text",
        options: vendorOptions,
      },
      { key: "smppName", label: "SMPP", type: "text", options: smppOptions },
      { key: "systemId", label: "System ID", type: "text" },
      { key: "status", label: "Status", type: "text", options: statusOptions },
      {
        key: "encoding",
        label: "Encoding",
        type: "text",
        options: encodingOptions,
      },
      { key: "segmentNumber", label: "Segment Number", type: "text" },
      { key: "characterCount", label: "Character Count", type: "text" },
    ],
    [clientOptions, vendorOptions, smppOptions],
  );

  const tableColumnsConfig: ColumnConfig[] = useMemo(
    () => [
      {
        key: "message_id",
        label: "Message ID",
        type: "text",
        render: (log) => (
          <span className="font-mono text-xs text-primary">
            {log.message_id}
          </span>
        ),
      },
      {
        key: "destination",
        label: "Destination",
        type: "text",
        render: (log) => (
          <span className="text-sm font-medium text-text-primary dark:text-white">
            {log.destination}
          </span>
        ),
      },
      {
        key: "text",
        label: "Text",
        type: "text",
        render: (log) => (
          <div
            className="max-w-xs truncate text-sm text-text-secondary"
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
          const statusKey = log.status?.toLowerCase();
          const colors: Record<string, string> = {
            delivered:
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            failed:
              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            queued:
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          };
          return (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[statusKey] || "bg-gray-100 text-gray-600"}`}
            >
              {log.status}
            </span>
          );
        },
      },
      { key: "encoding", label: "Encoding", type: "text" },
      { key: "segmentNumber", label: "Segment", type: "text" },
      { key: "characterCount", label: "Chars", type: "text" },
      { key: "clientName", label: "Client", type: "text" },
      { key: "vendorName", label: "Vendor", type: "text" },
      { key: "smppName", label: "SMPP", type: "text" },
      { key: "systemId", label: "System ID", type: "text" },
      {
        key: "createdAt",
        label: "Created At",
        type: "date",
        render: (log) => (
          <span className="text-xs text-text-secondary">
            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
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

  const fetchLogs = async (overrideParams?: Record<string, any>) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;

    setIsLoading(true);
    try {
      const currentSearchParams: Record<string, any> = {};
      const sourceFilters = overrideParams || filterValues;

      Object.entries(sourceFilters).forEach(([key, val]) => {
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
  }, [moduleName, currentPage, rowsPerPage]);

  // --- Handlers ---
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
    setTimeout(() => fetchLogs({}), 0);
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

const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      // The setTimeout is CRUCIAL here to wait for the sidebar to update
      setTimeout(() => {
        const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Module";
        
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100); // Waits 0.1 seconds
      
      hasLoggedOpening.current = true;
    }
  }, []);
  // No Action Column
  const tableHeaders = [...visibleTableFields.map((col) => col.label)];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Message Report
          </h1>

          <div className="relative z-20">
            <AdvancedFilter
              columns={filterOptionsConfig}
              selectedColumns={searchColumns}
              onFilter={(newCols) => {
                setSearchColumns(newCols);
                setFilterValues((prev) => {
                  const next = { ...prev };
                  Object.keys(next).forEach((k) => {
                    if (!newCols.includes(k)) delete next[k];
                  });
                  return next;
                });
              }}
              onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)}
              isLoading={isLoading}
              buttonLabel="Search Fields"
            />
          </div>

          <div className="relative z-20">
            <AdvancedFilter
              columns={tableColumnsConfig}
              selectedColumns={tableColumns}
              onFilter={setTableColumns}
              onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
              buttonLabel="Columns"
            />
          </div>

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
          <span className="text-text-primary dark:text-white">Report</span>
        </div>
      </div>

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
          </tr>
        )}
      />
    </div>
  );
};

export default MessageReport;
