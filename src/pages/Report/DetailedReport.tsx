import React, { useState, useEffect, useRef } from "react";
import { Home, Eye } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import { getDetailedReportsApi, /* exportDetailedReportsApi, */ type DetailedReportData } from "../../api/reportApi/detailedReportApi";
import { DetailedReportModal } from "../../components/modals/Report/DetailedReportModal";

// import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";
import { StatusBadge } from "../../components/ui/StatusBadge";

interface Option { label: string; value: string; }

interface ColumnConfig extends FilterColumn {
  render?: (data: DetailedReportData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchOnly?: boolean;
  tableLabel?: string;
}

const statusOptions: Option[] = [
  { label: "Queued", value: "QUEUED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Failed", value: "FAILED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Undelivered", value: "UNDELIVERED" },
  { label: "Uncertain", value: "UNCERTAIN" },
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_SEARCH_COLUMNS = ["client", "destination", "submitStatus"];
const DEFAULT_TABLE_COLUMNS = [
  "text_message_id", "destination", "content", "submitStatus", "client", "vendor", "vendor_msg_id", "request_time"
];

const BATCH_SIZE = 100;
const LOAD_MORE_THRESHOLD_PX = 200;

const DetailedReport: React.FC = () => {
  const [reports, setReports] = useState<DetailedReportData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loadedPage, setLoadedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLog, setViewLog] = useState<DetailedReportData | null>(null);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowLog, setSelectedRowLog] = useState<DetailedReportData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("detailed_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const tableWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("detailed_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll("aside a.active, nav a.active");
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split("\n")[0].trim() || "Detailed Report";
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  const allColumns: ColumnConfig[] = [
    { key: "text_message_id", label: "Message ID", type: "text", filterKey: "text_message_id__icontains", render: (log) => (<span className="font-mono text-xs text-primary">{log.text_message_id || "-"}</span>) },
    { key: "destination", label: "Destination", type: "text", filterKey: "destination__icontains", render: (log) => (<span className="text-sm font-medium text-text-primary dark:text-white">{log.destination}</span>) },
    { key: "client", label: "Client", type: "text", filterKey: "client__icontains" },
    { key: "vendor", label: "Vendor", type: "text", filterKey: "vendor__icontains" },
    { key: "senderId", label: "Sender ID", type: "text", filterKey: "senderId__icontains" },
    { key: "vendor_msg_id", label: "Vendor Msg ID", type: "text", filterKey: "vendor_msg_id__icontains" },

    { key: "content", label: "Content", type: "text", filterKey: "text__icontains", render: (log) => (
      <div className="max-w-xs truncate text-sm text-text-secondary cursor-pointer hover:text-primary transition-colors" title="Click to view full message" onClick={(e) => { e.stopPropagation(); setViewLog(log); setIsModalOpen(true); }}>
        {log.content}
      </div>
    )},

    { key: "submitStatus", label: "Status", type: "text", options: statusOptions, filterKey: "submitStatus", render: (log) => {
      return <StatusBadge status={log.submitStatus} />;
    }},

    { key: "clientRate", label: "Client Rate", type: "number", filterKey: "clientRate__icontains" },
    { key: "client_charge", label: "Client Charge", type: "number", filterKey: "client_charge__icontains" },
    { key: "vendorRate", label: "Vendor Rate", type: "number", filterKey: "vendorRate__icontains" },
    { key: "vendor_charge", label: "Vendor Charge", type: "number", filterKey: "vendor_charge__icontains" },
    { key: "part_total", label: "Parts", type: "number", filterKey: "part_total__icontains" },

    // --- Request Time: Single day picks 24-hour range, multi-day range is separate ---
    { key: "request_time", label: "Request Time (Single Day)", tableLabel: "Request Time", type: "date", filterKey: "request_time__range", render: (log) => (<span>{log.request_time ? new Date(log.request_time).toLocaleString() : "-"}</span>) },
    { key: "request_time__range", label: "Request Time (Range)", type: "date_range", filterKey: "request_time__range", isSearchOnly: true },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => { setFilterValues((prev) => ({ ...prev, [key]: value })); };

  const fetchReports = async (
    filters: Record<string, string> | null = null,
    page: number = 1,
    append: boolean = false,
  ) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;

    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

    try {
      const activeFilters = filters || filterValues;
      const currentSearchParams: Record<string, string> = {};

      searchColumns.forEach((key) => {
        const value = activeFilters[key];
        if (!value) return;
        const columnDef = allColumns.find((c) => c.key === key);
        const baseKey = columnDef?.filterKey || key;

        if (columnDef?.options) {
          const selectedOption = columnDef.options.find((opt) => opt.value === value);
          currentSearchParams[baseKey] = selectedOption ? selectedOption.value : value;
        } else {
          currentSearchParams[baseKey] = value;
        }
      });

      const response: any = await getDetailedReportsApi(page, BATCH_SIZE, currentSearchParams);

      if (newController.signal.aborted) return;
      if (response && response.results) {
        setReports((prev) => (append ? [...prev, ...response.results] : response.results));
        setTotalItems(response.count);
        setHasMore(Boolean(response.next));
        setLoadedPage(page);
      } else {
        if (!append) setReports([]);
        setTotalItems(0);
        setHasMore(false);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch detailed reports.");
    } finally {
      if (abortControllerRef.current === newController) {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchReports(undefined, 1, false);
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchColumns]);

  useEffect(() => {
    const scrollEl = tableWrapperRef.current?.querySelector<HTMLDivElement>(
      ".custom-scrollbar",
    );
    if (!scrollEl) return;

    const handleScroll = () => {
      if (isLoading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop - clientHeight < LOAD_MORE_THRESHOLD_PX) {
        fetchReports(filterValues, loadedPage + 1, true);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isFetchingMore, hasMore, loadedPage, filterValues, reports.length]);

  const handleSearch = () => { fetchReports(undefined, 1, false); };
  const handleClearFilters = () => { setFilterValues({}); fetchReports({}, 1, false); };

  // const handleExport = async () => {
  //   try {
  //     const blob = await exportDetailedReportsApi(filterValues);
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = `detailed_report_${new Date().toISOString()}.csv`;
  //     a.click();
  //     toast.success("Export started successfully");
  //   } catch (err) {
  //     toast.error("Failed to export data.");
  //   }
  // };

  const handleContextMenu = (e: React.MouseEvent, log: DetailedReportData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowLog(log);
  };

  const menuItems: ContextMenuItem[] = selectedRowLog ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => { setViewLog(selectedRowLog); setIsModalOpen(true); } },
  ] : [];

  const tableHeaders = ["S.N", ...visibleTableFields.map((col) => col.tableLabel || col.label)];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Detailed Report</h1>
          <div className="relative z-20">
            <AdvancedFilter columns={tableFilterColumns} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={searchColumns} onFilter={(newCols) => { setSearchColumns(newCols); setFilterValues((prev) => { const next = { ...prev }; Object.keys(next).forEach((k) => { if (!newCols.includes(k)) delete next[k]; }); return next; }); }} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">Reports</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          const baseLabel = getBaseLabel(col.label);
          if (col.options) return <Select key={col.key} label={`Search ${baseLabel}`} value={filterValues[col.key] || ""} onChange={(val) => handleFilterChange(col.key, val)} options={col.options} placeholder={`Select ${baseLabel}`} />;
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
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${baseLabel} (From)`}
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
                <DatePicker
                  label={`Search ${baseLabel} (To)`}
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
              </React.Fragment>
            );
          }
          return <Input key={col.key} type={col.type || "text"} label={`Search ${baseLabel}`} value={filterValues[col.key] || ""} onChange={(e) => handleFilterChange(col.key, e.target.value)} placeholder={`${baseLabel}`} />;
        })}
      </FilterCard>

      <style>{`
        .detailed-report-table > div > div:first-child > div:first-child > div:first-child {
          display: none !important;
        }
        .detailed-report-table > div > div:first-child > div:first-child > div:last-child {
          display: none !important;
        }
        .detailed-report-table td {
          padding-top: 0.625rem !important;
          padding-bottom: 0.625rem !important;
        }
        .detailed-report-table th {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }
        .detailed-report-table th:first-child,
        .detailed-report-table td:first-child {
          min-width: 56px !important;
          width: 56px !important;
        }
      `}</style>

      <div ref={tableWrapperRef} className="detailed-report-table">
        <DataTable serverSide={true} data={reports} totalItems={totalItems} rowsPerPage={BATCH_SIZE} headers={tableHeaders} isLoading={isLoading}
          // headerActions={<Button variant="secondary" onClick={handleExport} leftIcon={<Download size={18} />}>Export</Button>}
          renderRow={(log, index) => (
            <tr key={log.id || index} onContextMenu={(e) => handleContextMenu(e, log)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
              <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">
                {index + 1}
              </td>
              {visibleTableFields.map((col) => {
                const cellData = (log as any)[col.key];
                if (col.render) return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(log)}</td>;
                return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{cellData || "-"}</td>;
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

      <DetailedReportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} viewLog={viewLog} />
    </div>
  );
};

export default DetailedReport;