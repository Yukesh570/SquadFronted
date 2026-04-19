import React, { useState, useEffect, useRef } from "react";
import { Home, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSmsMessagePartApi,
  type SmsMessagePartData,
} from "../../api/reportApi/smsMessagePartApi";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { SmsMessagePartModal } from "../../components/modals/Report/SmsMessagePartModal";
import { actionHelper } from "../../helper/action";

interface Option { label: string; value: string; }
interface ColumnConfig extends FilterColumn { render?: (data: any) => React.ReactNode; options?: Option[]; filterKey?: string; }

const statusOptions: Option[] = [
  { label: "QUEUED", value: "QUEUED" },
  { label: "SUBMITTED", value: "SUBMITTED" },
  { label: "DELIVERED", value: "DELIVERED" },
  { label: "FAILED", value: "FAILED" },
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_SEARCH_COLUMNS = ["parent_message_destination", "submit_status", "vendor_msg_id"];
const DEFAULT_TABLE_COLUMNS = ["id", "message", "parent_message_destination", "text", "part_no", "part_total", "submit_status", "created_at"];

const SmsMessagePart: React.FC = () => {
  const [segments, setSegments] = useState<SmsMessagePartData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRow, setSelectedRow] = useState<SmsMessagePartData | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLog, setViewLog] = useState<SmsMessagePartData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("sms_segment_columns_v4");
    try { return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS; } catch (e) { return DEFAULT_TABLE_COLUMNS; }
  });

  useEffect(() => { localStorage.setItem("sms_segment_columns_v4", JSON.stringify(tableColumns)); }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "smsMessagePart";

  const allColumns: ColumnConfig[] = [
    { key: "id", label: "Segment ID", type: "text" },
    { key: "message", label: "Message ID", type: "text" },
    { key: "parent_message_destination", label: "Destination", type: "text", filterKey: "message__destination__icontains" },
    { 
      key: "text", 
      label: "Text", 
      type: "text",
      render: (data: any) => {
        if (!data.text) return "-";
        const strippedContent = data.text.replace(/<[^>]*>/g, "");
        const limit = 50; // Truncate limit
        return strippedContent.length > limit ? (
          <span title={strippedContent}>{strippedContent.substring(0, limit)}...</span>
        ) : (
          strippedContent
        );
      }
    },
    { key: "part_no", label: "Part No", type: "text", filterKey: "part_no__icontains" },
    { key: "part_total", label: "Part Total", type: "text", filterKey: "part_total__icontains" },
    { key: "udh_ref", label: "UDH Ref", type: "text", filterKey: "udh_ref__icontains" },
    { key: "udh_hex", label: "UDH Hex", type: "text", filterKey: "udh_hex__icontains" },
    { key: "esm_class", label: "ESM Class", type: "text" },
    { 
      key: "submit_status", 
      label: "Submit Status", 
      type: "text", 
      options: statusOptions, 
      filterKey: "submit_status",
      render: (log) => {
        const statusKey = log.submit_status?.toLowerCase();
        const colors: Record<string, string> = {
          delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        };
        return (<span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[statusKey] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>{log.submit_status || "-"}</span>);
      }
    },
    { key: "vendor_msg_id", label: "Vendor Msg ID", type: "text", filterKey: "vendor_msg_id__icontains" },
    { key: "vendor_submit_status", label: "Vendor Submit Status", type: "text", filterKey: "vendor_submit_status__icontains" },
    { key: "submit_attempts", label: "Submit Attempts", type: "text", filterKey: "submit_attempts__icontains" },
    { key: "failure_reason", label: "Failure Reason", type: "text" },
    { key: "submitted_at", label: "Submitted At", type: "date", render: (data: any) => data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "-" },
    { key: "sent_at", label: "Sent At", type: "date", render: (data: any) => data.sent_at ? new Date(data.sent_at).toLocaleString() : "-" },
    { key: "delivered_at", label: "Delivered At", type: "date", render: (data: any) => data.delivered_at ? new Date(data.delivered_at).toLocaleString() : "-" },
    { key: "failed_at", label: "Failed At", type: "date", render: (data: any) => data.failed_at ? new Date(data.failed_at).toLocaleString() : "-" },
    { key: "created_at", label: "Created At", type: "date", render: (data: any) => data.created_at ? new Date(data.created_at).toLocaleString() : "-" },
    { key: "updated_at", label: "Updated At", type: "date", render: (data: any) => data.updated_at ? new Date(data.updated_at).toLocaleString() : "-" },
    { key: "last_submit_at", label: "Last Submit At", type: "date", render: (data: any) => data.last_submit_at ? new Date(data.last_submit_at).toLocaleString() : "-" },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));

  const fetchSegments = async (filters: Record<string, string> | null = null) => {
    setIsLoading(true);
    try {
      const activeFilters = filters || filterValues;
      const cleanParams: Record<string, string> = {};
      
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) {
          const colDef = allColumns.find(c => c.key === key);
          cleanParams[colDef?.filterKey || key] = value;
        }
      });

      const response: any = await getSmsMessagePartApi(routeName, currentPage, rowsPerPage, cleanParams);
      if (response && response.results) {
        setSegments(response.results);
        setTotalItems(response.count);
      } else {
        setSegments([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch message segments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSegments(); }, [currentPage, rowsPerPage, searchColumns]);

  const handleContextMenu = (e: React.MouseEvent, item: SmsMessagePartData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRow(item);
  };

  const menuItems: ContextMenuItem[] = selectedRow ? [
    { label: "View Segment Details", icon: <Eye size={16} />, onClick: () => { setViewLog(selectedRow); setIsModalOpen(true); } },
  ] : [];

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => { actionHelper("Message Segments", `Opened SMS Message Parts Report`, false); }, 100); 
      hasLoggedOpening.current = true;
    }
  }, []);

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Message Segments</h1>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={searchColumns} onFilter={setSearchColumns} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">Segments</span>
        </div>
      </div>

      <FilterCard onSearch={() => { setCurrentPage(1); fetchSegments(); }} onClear={() => { setFilterValues({}); setCurrentPage(1); fetchSegments({}); }}>
        {visibleSearchFields.map((col) => {
          if (col.options) {
             return (
              <Select
                key={col.key}
                label={`Search ${col.label}`}
                value={filterValues[col.key] || ""}
                onChange={(val) => setFilterValues(p => ({...p, [col.key]: val}))}
                options={col.options}
                placeholder={`Select ${col.label}`}
              />
             );
          }
          if (col.type === "date") {
            return (
              <DatePicker
                key={col.key}
                label={`Search ${col.label}`}
                selected={filterValues[col.key] ? new Date(filterValues[col.key]) : null}
                onChange={(val: Date | null) => setFilterValues(p => ({...p, [col.key]: val ? formatLocalDate(val) : ""}))}
              />
            );
          }
          return (
            <Input
              key={col.key}
              label={`Search ${col.label}`}
              value={filterValues[col.key] || ""}
              onChange={(e) => setFilterValues(p => ({...p, [col.key]: e.target.value}))}
              placeholder={`Search ${col.label}`}
            />
          );
        })}
      </FilterCard>

      <DataTable
        serverSide={true}
        data={segments}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={["S.N.", ...visibleTableFields.map(c => c.label)]}
        isLoading={isLoading}
        renderRow={(segment, index) => (
          <tr
            key={segment.id || index}
            onContextMenu={(e) => handleContextMenu(e, segment)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              const rawValue = (segment as any)[col.key];
              const cellContent = col.render ? col.render(segment) : (rawValue ?? "-");
              return (
                <td key={col.key} className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap`}>
                  {cellContent}
                </td>
              );
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <SmsMessagePartModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        viewLog={viewLog} 
      />
    </div>
  );
};

export default SmsMessagePart;