import React, { useState, useEffect, useRef } from "react";
import { Home, Eye, Edit, Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import { getMccMncPrefixRangesApi, type MccMncPrefixRangeData } from "../../api/mccMncPrefixApi/mccMncPrefixRangeApi";
import { MccMncPrefixRangeModal } from "../../components/modals/MccMncPrefix/MccMncPrefixRangeModal";

import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";
import { formatDateTime } from "../../helper/dateFormatter";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { usePagePermissions } from "../../hooks/usePagePermissions";

interface Option {
  label: string;
  value: string;
}

type FilterColumnType = "number" | "boolean" | "date" | "date_range" | "date_gt_lt" | "text" | "number_range" | "number_gt_lt";

interface ColumnConfig extends Omit<FilterColumn, 'type' | 'key' | 'label'> {
  key: string;
  label: string;
  type?: FilterColumnType;
  render?: (data: MccMncPrefixRangeData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchOnly?: boolean;
  tableLabel?: string;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_SEARCH_COLUMNS = ["countryName", "mccmnc", "status"];
const DEFAULT_TABLE_COLUMNS = ["countryName", "mccmnc", "externalPrefixId", "operatorPrefixStartRange", "operatorPrefixEndRange", "status", "sourceFileName"];

const MccMncPrefixRange: React.FC = () => {
  const { canUpdate } = usePagePermissions();
  const [data, setData] = useState<MccMncPrefixRangeData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<MccMncPrefixRangeData | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Context Menu
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<MccMncPrefixRangeData | null>(null);

  // Filters & Pagination
  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("mcc_mnc_range_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("mcc_mnc_range_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "mccMncPrefix";
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const activeLinks = document.querySelectorAll("aside a.active, nav a.active");
    const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
    const moduleLabel = activeItem?.innerText?.split("\n")[0].trim() || "Prefix Range";
    actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
  }, []);

  const statusOptions: Option[] = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

const allColumns: ColumnConfig[] = [
  { key: "countryName", label: "Country Name", type: "text", filterKey: "country__name__icontains" },
  { key: "mccmnc", label: "MCC MNC", type: "text", filterKey: "mccmnc__icontains" },
  {
    key: "status",
    label: "Status",
    type: "text",
    options: statusOptions,
    filterKey: "status",
    render: (c) => <StatusBadge status={c.status === "ACTIVE" ? "ACTIVE" : "EXPIRED"} customText={c.status === "ACTIVE" ? "Active" : "Inactive"} />
  },
  { key: "operatorPrefixStartRange", label: "Start Range", type: "number", filterKey: "operatorPrefixStartRange" },
  { key: "operatorPrefixEndRange", label: "End Range", type: "number", filterKey: "operatorPrefixEndRange" },
  { key: "externalPrefixId", label: "External Prefix ID", type: "number", filterKey: "externalPrefixId__icontains" },
  { key: "sourceFileName", label: "Source File Name", type: "text", filterKey: "sourceFileName__icontains" },
  { key: "createdAt", label: "Created At (Exact)", tableLabel: "Created At", type: "date", filterKey: "createdAt__range", render: (c) => (c.createdAt ? formatDateTime(c.createdAt) : "-") },
  { key: "createdAt__range", label: "Created At (Range)", type: "date_range", filterKey: "createdAt", isSearchOnly: true },
  { key: "createdAt__gt_lt", label: "Created At (After / Before)", type: "date_gt_lt", filterKey: "createdAt", isSearchOnly: true },
];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type as FilterColumnType }));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const fetchData = async (filters: Record<string, string> | null = null) => {
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
            const selectedOption = columnDef.options.find((opt) => opt.value === value);
            currentSearchParams[columnDef.filterKey || key] = selectedOption ? selectedOption.value : value;
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
          } else if (columnDef?.type === "text" || columnDef?.type === "boolean" || columnDef?.type === "number") {
            const filterKey = columnDef.filterKey || `${key}__icontains`;
            currentSearchParams[filterKey] = value;
          } else {
            currentSearchParams[columnDef?.filterKey || key] = value;
          }
        }
      });

      const response: any = await getMccMncPrefixRangesApi(routeName, currentPage, rowsPerPage, currentSearchParams);

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setData(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setData(response);
        setTotalItems(response.length);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch prefix ranges.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => { setCurrentPage(1); fetchData(); };
  const handleClearFilters = () => { setFilterValues({}); setCurrentPage(1); fetchData({}); };

  const handleEdit = (item: MccMncPrefixRangeData) => { if (!canUpdate) return; setEditingData(item); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (item: MccMncPrefixRangeData) => { setEditingData(item); setIsViewMode(true); setIsModalOpen(true); };
  const handleAdd = () => {
  setEditingData(null);
  setIsViewMode(false);
  setIsModalOpen(true);
};

  const handleContextMenu = (e: React.MouseEvent, item: MccMncPrefixRangeData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowData(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowData ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowData) },
    ...(canUpdate ? [{ label: "Edit Range", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowData) }] : []),
  ] : [];

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.tableLabel || col.label)];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Prefix Range</h1>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns as any} selectedColumns={searchColumns} onFilter={(newCols: string[]) => { setSearchColumns(newCols); setFilterValues((prev) => { const next = { ...prev }; Object.keys(next).forEach((k) => { if (!newCols.includes(k)) delete next[k]; }); return next; }); }} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={tableFilterColumns as any} selectedColumns={tableColumns} onFilter={(cols: string[]) => setTableColumns(cols)} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">Prefix Range</span>
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

      <DataTable serverSide={true} data={data} totalItems={totalItems} currentPage={currentPage} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} onRowsPerPageChange={setRowsPerPage} headers={tableHeaders} isLoading={isLoading} headerActions={
    canUpdate && (
      <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>
        Add Prefix Range
      </Button>
    )
  }
        renderRow={(item, index) => (
          <tr key={item.id || index} onContextMenu={(e) => handleContextMenu(e, item)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">{(currentPage - 1) * rowsPerPage + index + 1}</td>
            {visibleTableFields.map((col) => {
              let cellData = (item as any)[col.key];
              if (col.render) return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(item)}</td>;
              if (col.options) { const match = col.options.find((opt) => opt.value === String(cellData)); cellData = match ? match.label : cellData; }
              return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{cellData || "-"}</td>;
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <MccMncPrefixRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} moduleName={routeName} editingData={editingData} isViewMode={isViewMode} />
    </div>
  );
};

export default MccMncPrefixRange;