import React, { useState, useEffect, useRef } from "react";
import { Home, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getDLREventApi,
  type DLREventData,
} from "../../api/reportApi/dlrEventApi";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { DLREventModal } from "../../components/modals/Report/DLREventModal";
import { actionHelper } from "../../helper/action";

// ⚡️ FIX: Import the StatusBadge
import { StatusBadge } from "../../components/ui/StatusBadge";

interface Option { label: string; value: string; }
interface ColumnConfig extends FilterColumn { render?: (data: any) => React.ReactNode; options?: Option[]; filterKey?: string; isSearchable?: boolean; isSearchOnly?: boolean; tableLabel?: string; }

const statusOptions: Option[] = [
  { label: "QUEUED", value: "QUEUED" },
  { label: "SUBMITTED", value: "SUBMITTED" },
  { label: "FAILED", value: "FAILED" },
  { label: "DELIVERED", value: "DELIVERED" },
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_SEARCH_COLUMNS = ["event_type", "status_code", "vendorMessageId"];
const DEFAULT_TABLE_COLUMNS = ["id", "vendorMessageId", "event_type", "segment_number", "status_code", "received_at"];

// Fixed batch size for infinite scroll. Pagination UI is hidden for this
// page only, so this is no longer user-adjustable — it's just the page
// size used per fetch.
const BATCH_SIZE = 100;

// How close (in px) to the bottom of the scroll container before we
// trigger the next batch fetch.
const LOAD_MORE_THRESHOLD_PX = 200;

const DLREvent: React.FC = () => {
  const [events, setEvents] = useState<DLREventData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // initial / fresh search load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // infinite-scroll load
  const [loadedPage, setLoadedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRow, setSelectedRow] = useState<DLREventData | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLog, setViewLog] = useState<DLREventData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("dlr_event_columns_v3");
    try { return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS; } catch (e) { return DEFAULT_TABLE_COLUMNS; }
  });

  useEffect(() => { localStorage.setItem("dlr_event_columns_v3", JSON.stringify(tableColumns)); }, [tableColumns]);

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "dlr-event";

  const tableWrapperRef = useRef<HTMLDivElement>(null);


  const allColumns: ColumnConfig[] = [
    { key: "id", label: "DLR ID", type: "text", isSearchable: false }, // ⚡️ UNAVAILABLE IN BACKEND
    { key: "message", label: "Message ID", type: "text", isSearchable: false }, // ⚡️ UNAVAILABLE IN BACKEND (only message__destination exists, not bare "message")
    { key: "segment", label: "Segment ID", type: "text", isSearchable: false }, // ⚡️ UNAVAILABLE IN BACKEND
    { key: "vendorMessageId", label: "Vendor Message ID", type: "text", filterKey: "vendorMessageId__icontains" }, // ⚡️ still mismatched vs backend's provider_message_id, left untouched per scope
    {
      key: "event_type",
      label: "Event Type",
      type: "text",
      options: statusOptions,
      filterKey: "event_type",
      // ⚡️ FIX: Implemented generic StatusBadge
      render: (log) => <StatusBadge status={log.event_type} />
    },
    { key: "segment_number", label: "Segment Number", type: "text", filterKey: "segment_number__icontains" },
    { key: "status_code", label: "Status Code", type: "text", filterKey: "status_code__icontains" },
    { key: "status_description", label: "Status Description", type: "text", filterKey: "status_description__icontains", isSearchable: false }, // ⚡️ UNAVAILABLE IN BACKEND
    { key: "received_at", label: "Received At", tableLabel: "Received At", type: "date", render: (data: any) => data.received_at ? new Date(data.received_at).toLocaleString() : "-" },
    { key: "received_at__range", label: "Received At", type: "date_range", filterKey: "received_at", isSearchOnly: true },
    { key: "raw_payload", label: "Raw Payload", type: "text", render: (data: any) => data.raw_payload ? "{...}" : "-", isSearchable: false }, // ⚡️ UNAVAILABLE IN BACKEND
  ];

  // ⚡️ Only allow searchable columns to be populated in the "Search Fields" dropdown
  const searchableColumns = allColumns.filter((col) => col.isSearchable !== false);

  const visibleSearchFields = searchableColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));
  // ⚡️ "Columns" dropdown should not offer the range search-only variant as a table column
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const fetchEvents = async (
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

      const response: any = await getDLREventApi(routeName, page, BATCH_SIZE, cleanParams);
      if (response && response.results) {
        setEvents((prev) => (append ? [...prev, ...response.results] : response.results));
        setTotalItems(response.count);
        setHasMore(Boolean(response.next));
        setLoadedPage(page);
      } else {
        if (!append) setEvents([]);
        setTotalItems(0);
        setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to fetch DLR events.");
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => { fetchEvents(undefined, 1, false); }, [searchColumns]);

  // Infinite scroll: listen on DataTable's internal scroll container
  // (class "custom-scrollbar", defined inside DataTable.tsx) via the
  // wrapper ref, since DataTable itself isn't being modified.
  useEffect(() => {
    const scrollEl = tableWrapperRef.current?.querySelector<HTMLDivElement>(
      ".custom-scrollbar",
    );
    if (!scrollEl) return;

    const handleScroll = () => {
      if (isLoading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop - clientHeight < LOAD_MORE_THRESHOLD_PX) {
        fetchEvents(filterValues, loadedPage + 1, true);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isFetchingMore, hasMore, loadedPage, filterValues, events.length]);

  const handleContextMenu = (e: React.MouseEvent, item: DLREventData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRow(item);
  };

  const menuItems: ContextMenuItem[] = selectedRow ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => { setViewLog(selectedRow); setIsModalOpen(true); } },
  ] : [];

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => { actionHelper("DLR Events", `Opened DLR Events Report`, false); }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">DLR Events</h1>
          <div className="relative z-20">
            <AdvancedFilter columns={searchableColumns} selectedColumns={searchColumns} onFilter={setSearchColumns} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={tableFilterColumns} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">DLR Events</span>
        </div>
      </div>

      <FilterCard onSearch={() => { fetchEvents(undefined, 1, false); }} onClear={() => { setFilterValues({}); fetchEvents({}, 1, false); }}>
        {visibleSearchFields.map((col) => {
          if (col.options) {
            return (
              <Select
                key={col.key}
                label={`Search ${col.label}`}
                value={filterValues[col.key] || ""}
                onChange={(val) => setFilterValues(p => ({ ...p, [col.key]: val }))}
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
                onChange={(val: Date | null) => setFilterValues(p => ({ ...p, [col.key]: val ? formatLocalDate(val) : "" }))}
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
              onChange={(e) => setFilterValues(p => ({ ...p, [col.key]: e.target.value }))}
              placeholder={`Search ${col.label}`}
            />
          );
        })}
      </FilterCard>

      <style>{`
        .dlr-event-table > div > div:first-child > div:first-child > div:first-child {
          display: none !important;
        }
        .dlr-event-table > div > div:first-child > div:first-child > div:last-child {
          display: none !important;
        }
        .dlr-event-table td {
          padding-top: 0.625rem !important;
          padding-bottom: 0.625rem !important;
        }
        .dlr-event-table th {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }
        .dlr-event-table th:first-child,
        .dlr-event-table td:first-child {
          min-width: 56px !important;
          width: 56px !important;
        }
      `}</style>

      <div ref={tableWrapperRef} className="dlr-event-table">
        <DataTable
          serverSide={true}
          data={events}
          totalItems={totalItems}
          rowsPerPage={BATCH_SIZE}
          headers={["S.N", ...visibleTableFields.map(c => c.tableLabel || c.label)]}
          isLoading={isLoading}
          renderRow={(event, index) => (
            <tr
              key={event.id || index}
              onContextMenu={(e) => handleContextMenu(e, event)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
            >
              <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">
                {index + 1}
              </td>
              {visibleTableFields.map((col) => {
                const rawValue = (event as any)[col.key];
                const cellContent = col.render ? col.render(event) : (rawValue || "-");
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

      <DLREventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewLog={viewLog}
      />
    </div>
  );
};

export default DLREvent;