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
interface ColumnConfig extends FilterColumn { render?: (data: any) => React.ReactNode; options?: Option[]; filterKey?: string; }

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

const DEFAULT_SEARCH_COLUMNS = ["event_type", "status_code", "provider_message_id"];
const DEFAULT_TABLE_COLUMNS = ["id", "provider_message_id", "event_type", "segment_number", "status_code", "status_description" ,"received_at"];

const DLREvent: React.FC = () => {
  const [events, setEvents] = useState<DLREventData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "dlr-event";

  const allColumns: ColumnConfig[] = [
    { key: "id", label: "DLR ID", type: "text" },
    { key: "message", label: "Message ID", type: "text" },
    { key: "segment", label: "Segment ID", type: "text" },
    { key: "provider_message_id", label: "Provider Message ID", type: "text", filterKey: "provider_message_id__icontains" },
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
    { key: "status_description", label: "Status Description", type: "text", filterKey: "status_description__icontains" },
    { key: "received_at", label: "Received At", type: "date", render: (data: any) => data.received_at ? new Date(data.received_at).toLocaleString() : "-" },
    { key: "raw_payload", label: "Raw Payload", type: "text", render: (data: any) => data.raw_payload ? "{...}" : "-" },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));

  const fetchEvents = async (filters: Record<string, string> | null = null) => {
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

      const response: any = await getDLREventApi(routeName, currentPage, rowsPerPage, cleanParams);
      if (response && response.results) {
        setEvents(response.results);
        setTotalItems(response.count);
      } else {
        setEvents([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch DLR events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [currentPage, rowsPerPage, searchColumns]);

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
            <AdvancedFilter columns={allColumns} selectedColumns={searchColumns} onFilter={setSearchColumns} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">DLR Events</span>
        </div>
      </div>

      <FilterCard onSearch={() => { setCurrentPage(1); fetchEvents(); }} onClear={() => { setFilterValues({}); setCurrentPage(1); fetchEvents({}); }}>
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
        data={events}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={["S.N.", ...visibleTableFields.map(c => c.label)]}
        isLoading={isLoading}
        renderRow={(event, index) => (
          <tr
            key={event.id || index}
            onContextMenu={(e) => handleContextMenu(e, event)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
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