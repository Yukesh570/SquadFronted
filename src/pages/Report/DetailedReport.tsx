import React, { useState, useEffect, useRef } from "react";
import { Home, Download, Eye } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import { getDetailedReportsApi, exportDetailedReportsApi, type DetailedReportData } from "../../api/reportApi/detailedReportApi";
import { DetailedReportModal } from "../../components/modals/Report/DetailedReportModal";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

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
  { label: "Sent / Submitted", value: "SUBMITTED" },
  { label: "Failed", value: "FAILED" },
  { label: "Delivered", value: "DELIVERED" },
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_SEARCH_COLUMNS = ["client", "destination", "submitStatus"];
const DEFAULT_TABLE_COLUMNS = [
  "text_message_id", "destination", "content", "submitStatus", "client", "vendor", "request_time"
];

const DetailedReport: React.FC = () => {
  const [reports, setReports] = useState<DetailedReportData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLog, setViewLog] = useState<DetailedReportData | null>(null);
  
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowLog, setSelectedRowLog] = useState<DetailedReportData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("detailed_search_columns");
    return saved ? JSON.parse(saved) : DEFAULT_SEARCH_COLUMNS;
  });

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("detailed_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem("detailed_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  useEffect(() => {
    localStorage.setItem("detailed_search_columns", JSON.stringify(searchColumns));
  }, [searchColumns]);

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
    
    { key: "content", label: "Content", type: "text", filterKey: "text__icontains", render: (log) => (
      <div className="max-w-xs truncate text-sm text-text-secondary cursor-pointer hover:text-primary transition-colors" title="Click to view full message" onClick={(e) => { e.stopPropagation(); setViewLog(log); setIsModalOpen(true); }}>
        {log.content}
      </div>
    )},
    
    { key: "submitStatus", label: "Status", type: "text", options: statusOptions, filterKey: "submitStatus", render: (log) => {
      const statusKey = log.submitStatus?.toLowerCase();
      const colors: Record<string, string> = {
        delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      };
      return (<span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[statusKey] || "bg-gray-100 text-gray-600"}`}>{log.submitStatus}</span>);
    }},

    { key: "clientRate", label: "Client Rate", type: "number", filterKey: "clientRate__icontains" },
    { key: "client_charge", label: "Client Charge", type: "number", filterKey: "client_charge__icontains" },
    { key: "vendorRate", label: "Vendor Rate", type: "number", filterKey: "vendorRate__icontains" },
    { key: "vendor_charge", label: "Vendor Charge", type: "number", filterKey: "vendor_charge__icontains" },
    { key: "part_total", label: "Parts", type: "number", filterKey: "part_total__icontains" },
    
    { key: "request_time", label: "Req Time (Exact)", tableLabel: "Request Time", type: "date", filterKey: "request_time" },
    { key: "request_time__range", label: "Req Time (From/To)", type: "date_range", filterKey: "request_time", isSearchOnly: true },
    { key: "request_time__gt_lt", label: "Req Time (After/Before)", type: "date_gt_lt", filterKey: "request_time", isSearchOnly: true },
    
    { key: "delivery_time", label: "Del Time (Exact)", tableLabel: "Delivery Time", type: "date", filterKey: "delivery_time" },
    { key: "delivery_time__range", label: "Del Time (From/To)", type: "date_range", filterKey: "delivery_time", isSearchOnly: true },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => { setFilterValues((prev) => ({ ...prev, [key]: value })); };

  const fetchReports = async (filters: Record<string, string> | null = null) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;
    setIsLoading(true);

    try {
      const activeFilters = filters || filterValues;
      const currentSearchParams: Record<string, string> = {};

      searchColumns.forEach((key) => {
        const value = activeFilters[key];
        if (value) {
          const columnDef = allColumns.find((c) => c.key === key);
          const baseKey = columnDef?.filterKey ? columnDef.filterKey.split("__")[0] : key.split("__")[0];

          if (columnDef?.options) {
            currentSearchParams[columnDef.filterKey || key] = value;
          } else if (columnDef?.type === "date") {
            currentSearchParams[`${baseKey}__range`] = `${value}T00:00:00,${value}T23:59:59`;
          } else if (columnDef?.type === "date_range") {
            const [start, end] = value.split(",");
            if (start && end) currentSearchParams[`${baseKey}__range`] = `${start}T00:00:00,${end}T23:59:59`;
            else {
              if (start) currentSearchParams[`${baseKey}__gt`] = `${start}T00:00:00`;
              if (end) currentSearchParams[`${baseKey}__lt`] = `${end}T23:59:59`;
            }
          } else if (columnDef?.type === "date_gt_lt") {
            const [gt, lt] = value.split(",");
            if (gt) currentSearchParams[`${baseKey}__gt`] = `${gt}T23:59:59`;
            if (lt) currentSearchParams[`${baseKey}__lt`] = `${lt}T00:00:00`;
          } else {
            const filterKey = columnDef?.filterKey || `${key}__icontains`;
            currentSearchParams[filterKey] = value;
          }
        }
      });

      const response: any = await getDetailedReportsApi(currentPage, rowsPerPage, currentSearchParams);

      if (newController.signal.aborted) return;
      if (response && response.results) { setReports(response.results); setTotalItems(response.count); } 
      else { setReports([]); setTotalItems(0); }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch detailed reports.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => { setCurrentPage(1); fetchReports(); };
  const handleClearFilters = () => { setFilterValues({}); setCurrentPage(1); fetchReports({}); };

  const handleExport = async () => {
    try {
      const blob = await exportDetailedReportsApi(filterValues);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `detailed_report_${new Date().toISOString()}.csv`;
      a.click();
      toast.success("Export started successfully");
    } catch (err) {
      toast.error("Failed to export data. End point might not be ready.");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, log: DetailedReportData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowLog(log);
  };

  const menuItems: ContextMenuItem[] = selectedRowLog ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => { setViewLog(selectedRowLog); setIsModalOpen(true); } },
  ] : [];

  const tableHeaders = [...visibleTableFields.map((col) => col.tableLabel || col.label)];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Detailed Report</h1>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={searchColumns} onFilter={(newCols) => { setSearchColumns(newCols); setFilterValues((prev) => { const next = { ...prev }; Object.keys(next).forEach((k) => { if (!newCols.includes(k)) delete next[k]; }); return next; }); }} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={tableFilterColumns} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
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
          if (col.type === "date") return <DatePicker key={col.key} label={`Search ${baseLabel}`} selected={filterValues[col.key] ? new Date(filterValues[col.key]) : null} onChange={(val: Date | null) => handleFilterChange(col.key, val ? formatLocalDate(val) : "")} />;
          if (col.type === "date_range") {
            const [startStr, endStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <DatePicker label={`Search ${baseLabel} (From)`} selected={startStr ? new Date(startStr) : null} onChange={(val: Date | null) => { const newStart = val ? formatLocalDate(val) : ""; const currentEnd = endStr || ""; handleFilterChange(col.key, newStart || currentEnd ? `${newStart},${currentEnd}` : ""); }} />
                <DatePicker label={`Search ${baseLabel} (To)`} selected={endStr ? new Date(endStr) : null} onChange={(val: Date | null) => { const newEnd = val ? formatLocalDate(val) : ""; const currentStart = startStr || ""; handleFilterChange(col.key, currentStart || newEnd ? `${currentStart},${newEnd}` : ""); }} />
              </React.Fragment>
            );
          }
          if (col.type === "date_gt_lt") {
            const [gtStr, ltStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <DatePicker label={`Search ${baseLabel} (> After)`} selected={gtStr ? new Date(gtStr) : null} onChange={(val: Date | null) => { const newGt = val ? formatLocalDate(val) : ""; const currentLt = ltStr || ""; handleFilterChange(col.key, newGt || currentLt ? `${newGt},${currentLt}` : ""); }} />
                <DatePicker label={`Search ${baseLabel} (< Before)`} selected={ltStr ? new Date(ltStr) : null} onChange={(val: Date | null) => { const newLt = val ? formatLocalDate(val) : ""; const currentGt = gtStr || ""; handleFilterChange(col.key, currentGt || newLt ? `${currentGt},${newLt}` : ""); }} />
              </React.Fragment>
            );
          }
          return <Input key={col.key} type={col.type || "text"} label={`Search ${baseLabel}`} value={filterValues[col.key] || ""} onChange={(e) => handleFilterChange(col.key, e.target.value)} placeholder={`${baseLabel}`} />;
        })}
      </FilterCard>

      <DataTable serverSide={true} data={reports} totalItems={totalItems} currentPage={currentPage} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} onRowsPerPageChange={setRowsPerPage} headers={tableHeaders} isLoading={isLoading}
        headerActions={<Button variant="secondary" onClick={handleExport} leftIcon={<Download size={18} />}>Export</Button>}
        renderRow={(log, index) => (
          <tr key={log.id || index} onContextMenu={(e) => handleContextMenu(e, log)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
            {visibleTableFields.map((col) => {
              const cellData = (log as any)[col.key];
              if (col.render) return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(log)}</td>;
              return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{cellData || "-"}</td>;
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />
      
      <DetailedReportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} viewLog={viewLog} />
    </div>
  );
};

export default DetailedReport;