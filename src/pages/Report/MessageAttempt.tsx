import React, { useState, useEffect, useRef } from "react";
import { Home, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getMessageAttemptApi,
  type MessageAttemptData,
} from "../../api/reportApi/messageAttemptApi";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { MessageAttemptModal } from "../../components/modals/Report/MessageAttemptModal";
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

const DEFAULT_SEARCH_COLUMNS = ["provider", "status", "vendorMessageId"];
const DEFAULT_TABLE_COLUMNS = ["id", "attempt_number", "provider", "vendorMessageId", "status", "started_at"];

const MessageAttempt: React.FC = () => {
  const [attempts, setAttempts] = useState<MessageAttemptData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRow, setSelectedRow] = useState<MessageAttemptData | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLog, setViewLog] = useState<MessageAttemptData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("msg_attempt_columns_v3");
    try { return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS; } catch (e) { return DEFAULT_TABLE_COLUMNS; }
  });

  useEffect(() => { localStorage.setItem("msg_attempt_columns_v3", JSON.stringify(tableColumns)); }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "message-attempt";

  // EXACT keys for data matching, clean Title Case labels for UI
  const allColumns: ColumnConfig[] = [
    { key: "id", label: "Attempt ID", type: "text" },
    { key: "message", label: "Message ID", type: "text" },
    { key: "segment", label: "Segment ID", type: "text" },
    { key: "attempt_number", label: "Attempt Number", type: "text" },
    { key: "provider", label: "Provider", type: "text", filterKey: "provider__icontains" },
    { key: "vendorMessageId", label: "Vendor Message ID", type: "text", filterKey: "vendorMessageId__icontains" },
    {
      key: "status",
      label: "Status",
      type: "text",
      options: statusOptions,
      filterKey: "status",
      // ⚡️ FIX: Implemented generic StatusBadge
      render: (log) => <StatusBadge status={log.status} />
    },
    { key: "error_message", label: "Error Message", type: "text", filterKey: "error_message__icontains" },
    { key: "started_at", label: "Started At", type: "date", render: (data: any) => data.started_at ? new Date(data.started_at).toLocaleString() : "-" },
    { key: "completed_at", label: "Completed At", type: "date", render: (data: any) => data.completed_at ? new Date(data.completed_at).toLocaleString() : "-" },
    { key: "request_payload", label: "Request Payload", type: "text", render: (data: any) => data.request_payload ? "{...}" : "-" },
    { key: "response_payload", label: "Response Payload", type: "text", render: (data: any) => data.response_payload ? "{...}" : "-" },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));

  const fetchAttempts = async (filters: Record<string, string> | null = null) => {
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

      const response: any = await getMessageAttemptApi(routeName, currentPage, rowsPerPage, cleanParams);
      if (response && response.results) {
        setAttempts(response.results);
        setTotalItems(response.count);
      } else {
        setAttempts([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch message attempts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAttempts(); }, [currentPage, rowsPerPage, searchColumns]);

  const handleContextMenu = (e: React.MouseEvent, item: MessageAttemptData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRow(item);
  };

  const menuItems: ContextMenuItem[] = selectedRow ? [
    { label: "View Payloads", icon: <Eye size={16} />, onClick: () => { setViewLog(selectedRow); setIsModalOpen(true); } },
  ] : [];

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => { actionHelper("Message Attempts", `Opened Message Attempts Report`, false); }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Message Attempts</h1>
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
          <span>/</span><span className="text-text-primary dark:text-white">Attempts</span>
        </div>
      </div>

      <FilterCard onSearch={() => { setCurrentPage(1); fetchAttempts(); }} onClear={() => { setFilterValues({}); setCurrentPage(1); fetchAttempts({}); }}>
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

      <DataTable
        serverSide={true}
        data={attempts}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={["S.N.", ...visibleTableFields.map(c => c.label)]}
        isLoading={isLoading}
        renderRow={(attempt, index) => (
          <tr
            key={attempt.id || index}
            onContextMenu={(e) => handleContextMenu(e, attempt)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              const rawValue = (attempt as any)[col.key];
              const cellContent = col.render ? col.render(attempt) : (rawValue || "-");
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

      <MessageAttemptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewLog={viewLog}
      />
    </div>
  );
};

export default MessageAttempt;