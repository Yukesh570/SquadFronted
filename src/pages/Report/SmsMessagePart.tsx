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
interface ColumnConfig extends FilterColumn {
  render?: (data: any) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchable?: boolean;
  isSearchOnly?: boolean;
  tableLabel?: string;
}

const DLR_STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  DELIVERED: { bg: "#DCFCE7", text: "#166534", border: "#16A34A", label: "Delivered" },
  SUBMITTED: { bg: "#DBEAFE", text: "#1E40AF", border: "#2563EB", label: "Submitted" },
  SENT_TO_VENDOR: { bg: "#E0E7FF", text: "#3730A3", border: "#4F46E5", label: "Sent to Vendor" },
  SUBMITTING: { bg: "#F3E8FF", text: "#6B21A8", border: "#9333EA", label: "Submitting" },
  QUEUED: { bg: "#F3F4F6", text: "#374151", border: "#6B7280", label: "Queued" },
  PENDING: { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B", label: "Pending" },
  UNDELIVERED: { bg: "#FFEDD5", text: "#9A3412", border: "#EA580C", label: "Undelivered" },
  FAILED: { bg: "#FEE2E2", text: "#991B1B", border: "#DC2626", label: "Failed" },
  REJECTED: { bg: "#FEE2E2", text: "#7F1D1D", border: "#991B1B", label: "Rejected" },
  EXPIRED: { bg: "#FEF3C7", text: "#78350F", border: "#92400E", label: "Expired" },
  UNKNOWN: { bg: "#E2E8F0", text: "#334155", border: "#475569", label: "Unknown" },
};

const statusOptions: Option[] = Object.keys(DLR_STATUS_COLORS).map((key) => ({
  label: DLR_STATUS_COLORS[key].label,
  value: key,
}));

const renderStatusBadge = (status?: string) => {
  if (!status) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">-</span>;

  const statusKey = status.toUpperCase();
  const config = DLR_STATUS_COLORS[statusKey] || DLR_STATUS_COLORS.UNKNOWN;

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium border"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      {config.label || status}
    </span>
  );
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_SEARCH_COLUMNS = ["parent_message_destination", "submit_status", "vendor_msg_id"];
const DEFAULT_TABLE_COLUMNS = ["id", "message", "parent_message_destination", "text", "part_no", "part_total", "submit_status", "created_at"];

const BATCH_SIZE = 100;
const LOAD_MORE_THRESHOLD_PX = 200;

const SmsMessagePart: React.FC = () => {
  const [segments, setSegments] = useState<SmsMessagePartData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loadedPage, setLoadedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "smsMessagePart";

  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const allColumns: ColumnConfig[] = [
    { key: "id", label: "Segment ID", type: "text", isSearchable: false }, // ⚡️ UNAVAILABLE IN BACKEND
    { key: "message", label: "Message ID", type: "text", isSearchable: false }, // ⚡️ UNAVAILABLE IN BACKEND
    { key: "parent_message_destination", label: "Destination", type: "text", filterKey: "message__destination__icontains" },
    {
      key: "text",
      label: "Text",
      type: "text",
      isSearchable: false, // ⚡️ UNAVAILABLE IN BACKEND
      render: (data: any) => {
        if (!data.text) return "-";
        const strippedContent = data.text.replace(/<[^>]*>/g, "");
        const limit = 50;
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
    { key: "esm_class", label: "ESM Class", type: "text", isSearchable: false }, // ⚡️ UNAVAILABLE IN BACKEND
    {
      key: "submit_status",
      label: "Submit Status",
      type: "text",
      options: statusOptions,
      filterKey: "submit_status",
      render: (log) => renderStatusBadge(log.submit_status)
    },
    { key: "vendor_msg_id", label: "Vendor Msg ID", type: "text", filterKey: "vendor_msg_id__icontains" },
    {
      key: "vendor_submit_status",
      label: "Vendor Submit Status",
      type: "text",
      options: statusOptions,
      filterKey: "vendor_submit_status__icontains",
      render: (log) => renderStatusBadge(log.vendor_submit_status)
    },
    { key: "submit_attempts", label: "Submit Attempts", type: "text", filterKey: "submit_attempts__icontains" }, // ⚡️ RESTORED

    { key: "submitted_at", label: "Submitted At", type: "date", render: (data: any) => data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "-" },
    { key: "submitted_at__range", label: "Submitted At", type: "date_range", filterKey: "submitted_at", isSearchOnly: true },

    { key: "sent_at", label: "Sent At", type: "date", render: (data: any) => data.sent_at ? new Date(data.sent_at).toLocaleString() : "-" },
    { key: "sent_at__range", label: "Sent At", type: "date_range", filterKey: "sent_at", isSearchOnly: true },

    { key: "delivered_at", label: "Delivered At", type: "date", render: (data: any) => data.delivered_at ? new Date(data.delivered_at).toLocaleString() : "-" }, // ⚡️ Backend now supports this field
    { key: "delivered_at__range", label: "Delivered At", type: "date_range", filterKey: "delivered_at", isSearchOnly: true },

    { key: "failed_at", label: "Failed At", type: "date", render: (data: any) => data.failed_at ? new Date(data.failed_at).toLocaleString() : "-" },
    { key: "failed_at__range", label: "Failed At", type: "date_range", filterKey: "failed_at", isSearchOnly: true },

    { key: "created_at", label: "Created At", type: "date", render: (data: any) => data.created_at ? new Date(data.created_at).toLocaleString() : "-" },
    { key: "created_at__range", label: "Created At", type: "date_range", filterKey: "created_at", isSearchOnly: true },

    { key: "updated_at", label: "Updated At", type: "date", render: (data: any) => data.updated_at ? new Date(data.updated_at).toLocaleString() : "-" }, // ⚡️ Backend now supports this field
    { key: "updated_at__range", label: "Updated At", type: "date_range", filterKey: "updated_at", isSearchOnly: true },

    { key: "last_submit_at", label: "Last Submit At", type: "date", render: (data: any) => data.last_submit_at ? new Date(data.last_submit_at).toLocaleString() : "-" }, // ⚡️ Backend now supports this field
    { key: "last_submit_at__range", label: "Last Submit At", type: "date_range", filterKey: "last_submit_at", isSearchOnly: true },

    { key: "failure_reason", label: "Failure Reason", type: "text", isSearchable: false }, // ⚡️ RESTORED — UNAVAILABLE IN BACKEND
  ];

  // ⚡️ Only allow searchable columns to be populated in the "Search Fields" dropdown
  const searchableColumns = allColumns.filter((col) => col.isSearchable !== false);

  const visibleSearchFields = searchableColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));

  // ⚡️ "Columns" dropdown should not offer the range search-only variants as table columns
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const fetchSegments = async (
    filters: Record<string, string> | null = null,
    page: number = 1,
    append: boolean = false,
  ) => {
    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

    try {
      const activeFilters = filters || filterValues;
      const cleanParams: Record<string, string> = {};

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (!value) return;
        const colDef = allColumns.find(c => c.key === key);
        const baseKey = colDef?.filterKey || key;

        if (colDef?.type === "date_range") {
          const [start, end] = value.split(",");
          if (start && end) cleanParams[`${baseKey}__range`] = `${start}T00:00:00,${end}T23:59:59`;
        } else {
          cleanParams[baseKey] = value;
        }
      });

      const response: any = await getSmsMessagePartApi(routeName, page, BATCH_SIZE, cleanParams);
      if (response && response.results) {
        setSegments((prev) => (append ? [...prev, ...response.results] : response.results));
        setTotalItems(response.count);
        setHasMore(Boolean(response.next));
        setLoadedPage(page);
      } else {
        if (!append) setSegments([]);
        setTotalItems(0);
        setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to fetch message segments.");
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => { fetchSegments(undefined, 1, false); }, [searchColumns]);

  useEffect(() => {
    const scrollEl = tableWrapperRef.current?.querySelector<HTMLDivElement>(
      ".custom-scrollbar",
    );
    if (!scrollEl) return;

    const handleScroll = () => {
      if (isLoading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop - clientHeight < LOAD_MORE_THRESHOLD_PX) {
        fetchSegments(filterValues, loadedPage + 1, true);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isFetchingMore, hasMore, loadedPage, filterValues, segments.length]);

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
            <AdvancedFilter columns={searchableColumns as any} selectedColumns={searchColumns} onFilter={setSearchColumns} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={tableFilterColumns as any} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">Segments</span>
        </div>
      </div>

      <FilterCard onSearch={() => { fetchSegments(undefined, 1, false); }} onClear={() => { setFilterValues({}); fetchSegments({}, 1, false); }}>
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
          if (col.type === "date_range") {
            const [startStr, endStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${col.label} (From)`}
                  selected={startStr ? new Date(startStr) : null}
                  onChange={(val: Date | null) => {
                    const newStart = val ? formatLocalDate(val) : "";
                    const currentEnd = endStr || "";
                    setFilterValues(p => ({ ...p, [col.key]: newStart || currentEnd ? `${newStart},${currentEnd}` : "" }));
                  }}
                />
                <DatePicker
                  label={`Search ${col.label} (To)`}
                  selected={endStr ? new Date(endStr) : null}
                  onChange={(val: Date | null) => {
                    const newEnd = val ? formatLocalDate(val) : "";
                    const currentStart = startStr || "";
                    setFilterValues(p => ({ ...p, [col.key]: currentStart || newEnd ? `${currentStart},${newEnd}` : "" }));
                  }}
                />
              </React.Fragment>
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

      <style>{`
        .sms-message-part-table > div > div:first-child > div:first-child > div:first-child {
          display: none !important;
        }
        .sms-message-part-table > div > div:first-child > div:first-child > div:last-child {
          display: none !important;
        }
        .sms-message-part-table td {
          padding-top: 0.625rem !important;
          padding-bottom: 0.625rem !important;
        }
        .sms-message-part-table th {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }
        .sms-message-part-table th:first-child,
        .sms-message-part-table td:first-child {
          min-width: 56px !important;
          width: 56px !important;
        }
      `}</style>

      <div ref={tableWrapperRef} className="sms-message-part-table">
        <DataTable
          serverSide={true}
          data={segments}
          totalItems={totalItems}
          rowsPerPage={BATCH_SIZE}
          headers={["S.N", ...visibleTableFields.map(c => c.tableLabel || c.label)]}
          isLoading={isLoading}
          renderRow={(segment, index) => (
            <tr
              key={segment.id || index}
              onContextMenu={(e) => handleContextMenu(e, segment)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
            >
              <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">
                {index + 1}
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
        {isFetchingMore && (
          <div className="text-center text-xs text-text-secondary dark:text-gray-400 py-2">
            Loading more...
          </div>
        )}
      </div>

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