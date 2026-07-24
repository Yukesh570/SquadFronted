import React, { useState, useEffect, useRef, useMemo } from "react";
import { Home, Download, Eye } from "lucide-react";
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
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, {
  type FilterColumn,
} from "../../components/ui/AdvancedFilter";
import { actionHelper } from "../../helper/action";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { MessageReportModal } from "../../components/modals/Report/MessageReportModal";

import { StatusBadge } from "../../components/ui/StatusBadge";

interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: MessageLogData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchable?: boolean;
  isSearchOnly?: boolean;
  tableLabel?: string;
  type: "text" | "number" | "date" | "date_range";
}

const statusOptions: Option[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Queued", value: "QUEUED" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Failed", value: "FAILED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Undelivered", value: "UNDELIVERED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Partially Delivered", value: "PARTIALLY_DELIVERED" },
  { label: "No Route", value: "NO_ROUTE" },
  { label: "Retry Pending", value: "RETRY_PENDING" },
];

const encodingOptions: Option[] = [
  { label: "GSM-7", value: "GSM-7" },
  { label: "UCS-2", value: "UCS-2" },
];

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
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BATCH_SIZE = 100;
const LOAD_MORE_THRESHOLD_PX = 200;

const MessageReport: React.FC = () => {
  const [logs, setLogs] = useState<MessageLogData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loadedPage, setLoadedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);
  const [smppOptions, setSmppOptions] = useState<Option[]>([]);

  const [searchColumns, setSearchColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("msg_search_columns");
    return saved ? JSON.parse(saved) : DEFAULT_SEARCH_COLUMNS;
  });

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("msg_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLog, setViewLog] = useState<MessageLogData | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowLog, setSelectedRowLog] = useState<MessageLogData | null>(null);

  const location = useLocation();
  const moduleName = location.pathname.split("/").pop() || "messageReport";
  const abortControllerRef = useRef<AbortController | null>(null);

  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const isAtTopRef = useRef(true);

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

  const filterOptionsConfig: ColumnConfig[] = useMemo(
    () => [
      { key: "message_id", label: "Message ID", type: "text", isSearchable: false },
      { key: "destination", label: "Destination", type: "text", filterKey: "destination__icontains" },
      {
        key: "clientName",
        label: "Client",
        type: "text",
        options: clientOptions,
        filterKey: "client__name",
      },
      {
        key: "vendor__profileName",
        label: "Vendor",
        type: "text",
        options: vendorOptions,
        filterKey: "vendor__profileName",
      },
      {
        key: "smppName",
        label: "SMPP",
        type: "text",
        options: smppOptions,
        filterKey: "smpp__smppHost",
      },
      { key: "systemId", label: "System ID", type: "text", filterKey: "systemId__icontains" },
      { key: "status", label: "Status", type: "text", options: statusOptions, filterKey: "status" },
      { key: "failure_reason", label: "Failure Reason", type: "text", filterKey: "failure_reason__icontains" },
      {
        key: "encoding",
        label: "Encoding",
        type: "text",
        options: encodingOptions,
        isSearchable: false,
      },
      { key: "segmentNumber", label: "Segment Number", type: "text", isSearchable: false },
      { key: "characterCount", label: "Character Count", type: "text", isSearchable: false },

      // --- Date Filters explicitly mapped to __range ---
      { key: "createdAt", label: "Created At (Single Day)", tableLabel: "Created At", type: "date", filterKey: "createdAt__range" },
      { key: "createdAt__range", label: "Created At (Range)", type: "date_range", filterKey: "createdAt__range", isSearchOnly: true },

      { key: "queued_at", label: "Queued At (Single Day)", tableLabel: "Queued At", type: "date", filterKey: "queued_at__range" },
      { key: "queued_at__range", label: "Queued At (Range)", type: "date_range", filterKey: "queued_at__range", isSearchOnly: true },

      { key: "sent_at", label: "Sent At (Single Day)", tableLabel: "Sent At", type: "date", filterKey: "sent_at__range" },
      { key: "sent_at__range", label: "Sent At (Range)", type: "date_range", filterKey: "sent_at__range", isSearchOnly: true },

      { key: "delivered_at", label: "Delivered At (Single Day)", tableLabel: "Delivered At", type: "date", filterKey: "delivered_at__range" },
      { key: "delivered_at__range", label: "Delivered At (Range)", type: "date_range", filterKey: "delivered_at__range", isSearchOnly: true },

      { key: "failed_at", label: "Failed At (Single Day)", tableLabel: "Failed At", type: "date", filterKey: "failed_at__range" },
      { key: "failed_at__range", label: "Failed At (Range)", type: "date_range", filterKey: "failed_at__range", isSearchOnly: true },
    ],
    [clientOptions, vendorOptions, smppOptions],
  );

  const searchableColumns = filterOptionsConfig.filter((col) => col.isSearchable !== false);

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
            className="max-w-xs truncate text-sm text-text-secondary cursor-pointer hover:text-primary transition-colors"
            title="Click to view full message"
            onClick={(e) => {
              e.stopPropagation();
              setViewLog(log);
              setIsModalOpen(true);
            }}
          >
            {log.text}
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        type: "text",
        render: (log) => <StatusBadge status={log.status} />
      },
      { key: "encoding", label: "Encoding", type: "text" },
      { key: "segmentNumber", label: "Segment", type: "text" },
      { key: "characterCount", label: "Chars", type: "text" },
      { key: "clientName", label: "Client", type: "text" },
      { key: "vendorName", label: "Vendor", type: "text" },
      { key: "smppName", label: "SMPP", type: "text" },
      { key: "systemId", label: "System ID", type: "text" },
      { key: "failure_reason", label: "Failure Reason", type: "text" },
      {
        key: "createdAt",
        label: "Created At",
        type: "date",
        render: (log) => (
          <span>
            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        key: "queued_at",
        label: "Queued At",
        type: "date",
        render: (log) => (
          <span>
            {log.queued_at ? new Date(log.queued_at).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        key: "sent_at",
        label: "Sent At",
        type: "date",
        render: (log) => (
          <span>
            {log.sent_at ? new Date(log.sent_at).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        key: "delivered_at",
        label: "Delivered At",
        type: "date",
        render: (log) => (
          <span>
            {log.delivered_at ? new Date(log.delivered_at).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        key: "failed_at",
        label: "Failed At",
        type: "date",
        render: (log) => (
          <span>
            {log.failed_at ? new Date(log.failed_at).toLocaleString() : "-"}
          </span>
        ),
      },
    ],
    [],
  );

  useEffect(() => {
    localStorage.setItem("msg_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  useEffect(() => {
    localStorage.setItem("msg_search_columns", JSON.stringify(searchColumns));
  }, [searchColumns]);

  const visibleSearchFields = searchableColumns.filter((col) =>
    searchColumns.includes(col.key),
  );
  const visibleTableFields = tableColumnsConfig.filter((col) =>
    tableColumns.includes(col.key),
  );

  const fetchLogs = async (
    overrideParams?: Record<string, any>,
    page: number = 1,
    append: boolean = false,
    silent: boolean = false
  ) => {
    if (silent && (isLoading || isFetchingMore)) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;

    if (!silent) {
      if (append) setIsFetchingMore(true);
      else setIsLoading(true);
    }

    try {
      const currentSearchParams: Record<string, any> = {};
      const sourceFilters = overrideParams || filterValues;

      searchColumns.forEach((key) => {
        const value = sourceFilters[key];
        if (!value) return;
        const colDef = filterOptionsConfig.find((c) => c.key === key);
        const baseKey = colDef?.filterKey || key;

        if (colDef?.options) {
          const selectedOption = colDef.options.find((opt) => opt.value === value);
          currentSearchParams[baseKey] = selectedOption ? selectedOption.value : value;
        } else {
          currentSearchParams[baseKey] = value;
        }
      });

      const response = await getMessageLogsApi(
        moduleName,
        page,
        BATCH_SIZE,
        currentSearchParams,
      );

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setLogs((prev) => (append ? [...prev, ...response.results] : response.results));
        setTotalItems(response.count);
        setHasMore(Boolean(response.next));
        setLoadedPage(page);
      } else {
        if (!append) setLogs([]);
        setTotalItems(0);
        setHasMore(false);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error(error);
        if (!silent) toast.error("Failed to fetch message logs.");
      }
    } finally {
      if (abortControllerRef.current === newController) {
        if (!silent) {
          setIsLoading(false);
          setIsFetchingMore(false);
        }
      }
    }
  };

  useEffect(() => {
    fetchLogs(undefined, 1, false);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleName, searchColumns]);

  useEffect(() => {
    const liveUpdateTimer = setInterval(() => {
      const isFiltering = Object.values(filterValues).some(val => val !== "");

      // Check our React Ref instead of querying the DOM
      if (isAtTopRef.current && !isFiltering) {
        // params: overrideParams=undefined, page=1, append=false, silent=true
        fetchLogs(undefined, 1, false, true);
      }
    }, 5000);

    return () => clearInterval(liveUpdateTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValues, isLoading, isFetchingMore]);

  useEffect(() => {
    const scrollEl = tableWrapperRef.current?.querySelector<HTMLDivElement>(
      ".custom-scrollbar",
    );
    if (!scrollEl) return;

    const handleScroll = () => {
      isAtTopRef.current = scrollEl.scrollTop === 0;

      if (isLoading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop - clientHeight < LOAD_MORE_THRESHOLD_PX) {
        fetchLogs(filterValues, loadedPage + 1, true);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isFetchingMore, hasMore, loadedPage, filterValues, logs.length]);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchLogs(undefined, 1, false);
  };

  const handleClearFilters = () => {
    setFilterValues({});
    fetchLogs({}, 1, false);
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

  const handleContextMenu = (e: React.MouseEvent, log: MessageLogData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowLog(log);
  };

  const menuItems: ContextMenuItem[] = selectedRowLog ? [
    {
      label: "View Full Message",
      icon: <Eye size={16} />,
      onClick: () => {
        setViewLog(selectedRowLog);
        setIsModalOpen(true);
      }
    },
  ] : [];

  const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Module";

        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);

      hasLoggedOpening.current = true;
    }
  }, []);

  const tableHeaders = ["S.N", ...visibleTableFields.map((col) => col.label)];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Message Report
          </h1>

          <div className="relative z-20">
            <AdvancedFilter
              columns={searchableColumns}
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
        {(() => {
          const generalFields = visibleSearchFields.filter(c => c.type !== "date" && c.type !== "date_range");
          const dateFields = visibleSearchFields.filter(c => c.type === "date" || c.type === "date_range");

          const renderField = (col: typeof visibleSearchFields[0]) => {
            const baseLabel = getBaseLabel(col.label);

            if (col.options) {
              return (
                <Select
                  key={col.key}
                  label={baseLabel}
                  value={filterValues[col.key] || ""}
                  onChange={(val) => handleFilterChange(col.key, val)}
                  options={col.options}
                  placeholder={`Select ${baseLabel}`}
                />
              );
            }
            if (col.type === "date") {
              const rawVal = filterValues[col.key] || "";
              const datePart = rawVal.split("T")[0];

              return (
                <DatePicker
                  key={col.key}
                  label={`Search ${baseLabel}`}
                  selected={datePart ? new Date(datePart) : null}
                  onChange={(val: Date | null) => {
                    if (val) {
                      const formatted = formatLocalDate(val);
                      handleFilterChange(col.key, `${formatted}T00:00:00,${formatted}T23:59:59`);
                    } else {
                      handleFilterChange(col.key, "");
                    }
                  }}
                />
              );
            }
            if (col.type === "date_range") {
              const [startRange, endRange] = (filterValues[col.key] || "").split(",");
              const startStr = startRange ? startRange.split("T")[0] : "";
              const endStr = endRange ? endRange.split("T")[0] : "";

              return (
                <div key={col.key} className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col w-full">
                  <label className="mb-1.5 text-xs font-medium text-text-secondary dark:text-gray-400">
                    Search {baseLabel} (Range)
                  </label>
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <DatePicker
                        label=""
                        placeholder="From"
                        selected={startStr ? new Date(startStr) : null}
                        onChange={(val: Date | null) => {
                          const newStart = val ? formatLocalDate(val) : "";
                          const currentEnd = endStr || "";
                          if (newStart || currentEnd) {
                            const startVal = newStart ? `${newStart}T00:00:00` : "";
                            const endVal = currentEnd ? `${currentEnd}T23:59:59` : "";
                            handleFilterChange(col.key, `${startVal},${endVal}`);
                          } else {
                            handleFilterChange(col.key, "");
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <DatePicker
                        label=""
                        placeholder="To"
                        selected={endStr ? new Date(endStr) : null}
                        onChange={(val: Date | null) => {
                          const newEnd = val ? formatLocalDate(val) : "";
                          const currentStart = startStr || "";
                          if (currentStart || newEnd) {
                            const startVal = currentStart ? `${currentStart}T00:00:00` : "";
                            const endVal = newEnd ? `${newEnd}T23:59:59` : "";
                            handleFilterChange(col.key, `${startVal},${endVal}`);
                          } else {
                            handleFilterChange(col.key, "");
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <Input
                key={col.key}
                label={baseLabel}
                value={filterValues[col.key] || ""}
                onChange={(e) => handleFilterChange(col.key, e.target.value)}
                placeholder={`Search ${baseLabel}`}
              />
            );
          };

          return (
            <>
              {generalFields.map(renderField)}

              {dateFields.length > 0 && (
                <div className="col-span-full border-b border-gray-100 dark:border-gray-700 pb-2 mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Date Filters
                </div>
              )}

              {dateFields.map(renderField)}
            </>
          );
        })()}
      </FilterCard>

      <style>{`
        .message-report-table > div > div:first-child > div:first-child > div:first-child {
          display: none !important;
        }
        .message-report-table > div > div:first-child > div:first-child > div:last-child {
          display: none !important;
        }
        .message-report-table td {
          padding-top: 0.625rem !important;
          padding-bottom: 0.625rem !important;
        }
        .message-report-table th {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }
        .message-report-table th:first-child,
        .message-report-table td:first-child {
          min-width: 56px !important;
          width: 56px !important;
        }
      `}</style>

      <div ref={tableWrapperRef} className="message-report-table">
        <DataTable
          serverSide={true}
          data={logs}
          totalItems={totalItems}
          rowsPerPage={BATCH_SIZE}
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
              onContextMenu={(e) => handleContextMenu(e, log)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors cursor-context-menu"
            >
              <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">
                {index + 1}
              </td>
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
        {isFetchingMore && (
          <div className="text-center text-xs text-text-secondary dark:text-gray-400 py-2">
            Loading more...
          </div>
        )}
      </div>

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <MessageReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewLog={viewLog}
      />
    </div>
  );
};

export default MessageReport;