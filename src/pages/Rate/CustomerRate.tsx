import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCustomerRatesApi,
  deleteCustomerRateApi,
  type CustomerRateData,
} from "../../api/rateApi/customerRateApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";
import { getCurrenciesApi } from "../../api/settingApi/currencyApi/currencyApi";
import { CustomerRateModal } from "../../components/modals/Rate/CustomerRateModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

// ⚡️ FIX: Import the StatusBadge
import { StatusBadge } from "../../components/ui/StatusBadge";

interface Option { label: string; value: string; }

interface ColumnConfig extends FilterColumn {
  render?: (data: CustomerRateData) => React.ReactNode;
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

const DEFAULT_SEARCH_COLUMNS = ["ratePlan", "status"];
const DEFAULT_TABLE_COLUMNS = ["ratePlan", "countryName", "countryCode", "timeZoneName", "MCC", "rate", "version", "status", "effectiveFrom", "effectiveTo"];

const CustomerRate: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [rates, setRates] = useState<CustomerRateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [timezoneOptions, setTimezoneOptions] = useState<Option[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<Option[]>([]);
  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const [timezoneMap, setTimezoneMap] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CustomerRateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowRate, setSelectedRowRate] = useState<CustomerRateData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("customerrate_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("customerrate_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "customer";
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getCountriesApi("country", 1, 1000).then((res: any) => {
      const list = res.results || (Array.isArray(res) ? res : []);
      const map: Record<string, string> = {};
      const options: Option[] = [];
      list.forEach((c: any) => { map[String(c.id)] = c.name; options.push({ label: c.name, value: String(c.id) }); });
      setCountryMap(map); setCountryOptions(options.sort((a, b) => a.label.localeCompare(b.label)));
    }).catch(console.error);

    if (typeof getTimezoneApi === "function") {
      getTimezoneApi("timezone", 1, 1000).then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        const map: Record<string, string> = {};
        const options: Option[] = [];
        list.forEach((t: any) => { map[String(t.id)] = t.name; options.push({ label: t.name, value: String(t.id) }); });
        setTimezoneMap(map); setTimezoneOptions(options.sort((a, b) => a.label.localeCompare(b.label)));
      }).catch(console.error);
    }
    
    getCurrenciesApi("currency", 1, 1000).then((res: any) => {
      const list = res.results || (Array.isArray(res) ? res : []);
      setCurrencyOptions(list.map((c: any) => ({ label: c.currencyCode, value: c.currencyCode })).sort((a: any, b: any) => a.label.localeCompare(b.label)));
    }).catch(console.error);

  }, []);

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll("aside a.active, nav a.active");
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split("\n")[0].trim() || "Module";
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  const allColumns: ColumnConfig[] = [
    { key: "ratePlan", label: "Rate Plan", type: "text", filterKey: "ratePlan__icontains" },
    { key: "currencyCode", label: "Currency Code", type: "text", options: currencyOptions, filterKey: "currencyCode" },
    
    { key: "countryName", label: "Country", type: "text", options: countryOptions, filterKey: "country__name__icontains" },
    { key: "timeZoneName", label: "Time Zone", type: "text", options: timezoneOptions, filterKey: "timeZone__name__icontains" },

    { key: "MCC", label: "MCC", type: "text", filterKey: "MCC__icontains" },
    { key: "MNC", label: "MNC", type: "text", filterKey: "MNC__icontains" },
    { key: "countryCode", label: "Country Code", type: "text", filterKey: "countryCode__icontains" },

    { key: "rate", label: "Rate (Exact)", tableLabel: "Rate", type: "number" },
    { key: "rate__range", label: "Rate (Range)", type: "number_range", filterKey: "rate", isSearchOnly: true },
    { key: "rate__gt_lt", label: "Rate (GT / LT)", type: "number_gt_lt", filterKey: "rate", isSearchOnly: true },

    { key: "version", label: "Version", type: "number", filterKey: "version" },
    { 
      key: "status", 
      label: "Status", 
      type: "text", 
      options: [{ label: "DRAFT", value: "DRAFT" }, { label: "ACTIVE", value: "ACTIVE" }, { label: "EXPIRED", value: "EXPIRED" }], 
      filterKey: "status",
      // ⚡️ FIX: Implemented generic StatusBadge
      render: (c: any) => <StatusBadge status={c.status} />
    },

    { key: "effectiveFrom", label: "Effective From (Exact)", tableLabel: "Effective From", type: "date", filterKey: "effectiveFrom__date", render: (c: any) => (c.effectiveFrom ? new Date(c.effectiveFrom).toLocaleString() : "-") },
    { key: "effectiveFrom__range", label: "Effective From (From/To)", type: "date_range", filterKey: "effectiveFrom", isSearchOnly: true },
    { key: "effectiveFrom__gt_lt", label: "Effective From (After / Before)", type: "date_gt_lt", filterKey: "effectiveFrom", isSearchOnly: true },

    { key: "effectiveTo", label: "Effective To (Exact)", tableLabel: "Effective To", type: "date", filterKey: "effectiveTo__date", render: (c: any) => (c.effectiveTo ? new Date(c.effectiveTo).toLocaleString() : "-") },
    { key: "effectiveTo__range", label: "Effective To (From/To)", type: "date_range", filterKey: "effectiveTo", isSearchOnly: true },
    { key: "effectiveTo__gt_lt", label: "Effective To (After / Before)", type: "date_gt_lt", filterKey: "effectiveTo", isSearchOnly: true },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => { setFilterValues((prev) => ({ ...prev, [key]: value })); };

  const fetchRates = async (filters: Record<string, string> | null = null) => {
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
            const isNameField = columnDef.filterKey?.includes("__name") || columnDef.filterKey?.includes("__profileName");
            currentSearchParams[columnDef.filterKey || key] = selectedOption ? (isNameField ? selectedOption.label : selectedOption.value) : value;
          } 
          else if (columnDef?.type === "date") {
            currentSearchParams[`${baseKey}__range`] = `${value}T00:00:00,${value}T23:59:59`;
          } 
          else if (columnDef?.type === "date_range") {
            const [start, end] = value.split(",");
            if (start && end) currentSearchParams[`${baseKey}__range`] = `${start}T00:00:00,${end}T23:59:59`;
            else {
              if (start) currentSearchParams[`${baseKey}__gt`] = `${start}T00:00:00`;
              if (end) currentSearchParams[`${baseKey}__lt`] = `${end}T23:59:59`;
            }
          } 
          else if (columnDef?.type === "date_gt_lt") {
            const [gt, lt] = value.split(",");
            if (gt) currentSearchParams[`${baseKey}__gt`] = `${gt}T23:59:59`;
            if (lt) currentSearchParams[`${baseKey}__lt`] = `${lt}T00:00:00`;
          } 
          else if (columnDef?.type === "number_range") {
            const [start, end] = value.split(",");
            if (start && end) currentSearchParams[key] = value;
            else {
              if (start) currentSearchParams[`${baseKey}__gt`] = start;
              if (end) currentSearchParams[`${baseKey}__lt`] = end;
            }
          } 
          else if (columnDef?.type === "number_gt_lt") {
            const [gt, lt] = value.split(",");
            if (gt) currentSearchParams[`${baseKey}__gt`] = gt;
            if (lt) currentSearchParams[`${baseKey}__lt`] = gt;
          } 
          else if (columnDef?.type === "text") {
            const filterKey = columnDef.filterKey || `${key}__icontains`;
            currentSearchParams[filterKey] = value;
          } 
          else {
            currentSearchParams[columnDef?.filterKey || key] = value;
          }
        }
      });

      const response: any = await getCustomerRatesApi(routeName, currentPage, rowsPerPage, currentSearchParams);

      if (newController.signal.aborted) return;
      if (response && response.results) { setRates(response.results); setTotalItems(response.count); } 
      else if (Array.isArray(response)) { setRates(response); setTotalItems(response.length); } 
      else { setRates([]); setTotalItems(0); }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch customer rates.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => { setCurrentPage(1); fetchRates(); };
  const handleClearFilters = () => { setFilterValues({}); setCurrentPage(1); fetchRates({}); };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCustomerRateApi(deleteId, routeName);
        toast.success("Customer rate deleted.");
        fetchRates();
      } catch (error) { toast.error("Failed to delete customer rate."); }
      setDeleteId(null);
    }
  };

  const handleEdit = (rate: CustomerRateData) => { if (!canUpdate) return; setEditingRate(rate); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingRate(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (rate: CustomerRateData) => { setEditingRate(rate); setIsViewMode(true); setIsModalOpen(true); };

  const handleContextMenu = (e: React.MouseEvent, item: CustomerRateData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowRate(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowRate ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowRate) },
    ...(canUpdate ? [{ label: "Edit Rate", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowRate) }] : []),
    ...(canDelete ? [{ label: "Delete Rate", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowRate.id!) }] : []),
  ] : [];

  const renderCountry = (rate: CustomerRateData) => { if ((rate as any).countryName) return (rate as any).countryName; return countryMap[String(rate.country)] || String(rate.country); };
  const renderTimezone = (rate: CustomerRateData) => { if ((rate as any).timeZoneName) return (rate as any).timeZoneName; return timezoneMap[String(rate.timeZone)] || String(rate.timeZone); };

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.tableLabel || col.label)];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Customer Rates</h1>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns as any} selectedColumns={searchColumns} onFilter={(newCols: any) => { setSearchColumns(newCols); setFilterValues((prev) => { const next = { ...prev }; Object.keys(next).forEach((k) => { if (!newCols.includes(k)) delete next[k]; }); return next; }); }} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={tableFilterColumns as any} selectedColumns={tableColumns} onFilter={(cols: any) => setTableColumns(cols)} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">Customer Rates</span>
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
          if (col.type === "number_range") {
            const [minStr, maxStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <Input type="number" label={`Search ${baseLabel} (Min)`} value={minStr || ""} onChange={(e) => { const newMin = e.target.value; const currentMax = maxStr || ""; handleFilterChange(col.key, newMin || currentMax ? `${newMin},${currentMax}` : ""); }} placeholder={`> Min`} />
                <Input type="number" label={`Search ${baseLabel} (Max)`} value={maxStr || ""} onChange={(e) => { const newMax = e.target.value; const currentMin = minStr || ""; handleFilterChange(col.key, currentMin || newMax ? `${currentMin},${newMax}` : ""); }} placeholder={`< Max`} />
              </React.Fragment>
            );
          }
          if (col.type === "number_gt_lt") {
            const [gtStr, ltStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <Input type="number" label={`Search ${baseLabel} (> Greater)`} value={gtStr || ""} onChange={(e) => { const newGt = e.target.value; const currentLt = ltStr || ""; handleFilterChange(col.key, newGt || currentLt ? `${newGt},${currentLt}` : ""); }} placeholder={`> Greater than`} />
                <Input type="number" label={`Search ${baseLabel} (< Less)`} value={ltStr || ""} onChange={(e) => { const newLt = e.target.value; const currentGt = gtStr || ""; handleFilterChange(col.key, currentGt || newLt ? `${currentGt},${newLt}` : ""); }} placeholder={`< Less than`} />
              </React.Fragment>
            );
          }
          return <Input key={col.key} type={col.type || "text"} label={`Search ${baseLabel}`} value={filterValues[col.key] || ""} onChange={(e) => handleFilterChange(col.key, e.target.value)} placeholder={`${baseLabel}`} />;
        })}
      </FilterCard>

      <DataTable serverSide={true} data={rates} totalItems={totalItems} currentPage={currentPage} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} onRowsPerPageChange={setRowsPerPage} headers={tableHeaders} isLoading={isLoading} headerActions={canCreate ? <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>Add Customer Rate</Button> : null}
        renderRow={(item, index) => (
          <tr key={item.id || index} onContextMenu={(e) => handleContextMenu(e, item)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">{(currentPage - 1) * rowsPerPage + index + 1}</td>
            {visibleTableFields.map((col) => {
              let cellData = (item as any)[col.key];
              if (col.render) return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(item)}</td>;
              if (col.key === "countryName") cellData = renderCountry(item);
              if (col.key === "timeZoneName") cellData = renderTimezone(item);
              if (col.options) { const match = col.options.find((opt) => opt.value === String(cellData)); cellData = match ? match.label : cellData; }
              return <td key={col.key} className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${col.key === "ratePlan" ? "font-medium text-text-primary dark:text-white" : ""}`}>{cellData || "-"}</td>;
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />
      <CustomerRateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchRates} moduleName={routeName} editingRate={editingRate} isViewMode={isViewMode} />
      <DeleteModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Customer Rate" message="Are you sure you want to delete this rate?" />
    </div>
  );
};

export default CustomerRate;