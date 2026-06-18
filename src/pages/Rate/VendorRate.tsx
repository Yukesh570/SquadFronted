import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Upload, Eye, Layers } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getVendorRatesApi,
  deleteVendorRateApi,
  type VendorRateData,
} from "../../api/rateApi/vendorRateApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";
import { getCurrenciesApi } from "../../api/settingApi/currencyApi/currencyApi";
import { VendorRateModal } from "../../components/modals/Rate/VendorRateModal";
import { ImportVendorRateModal } from "../../components/modals/Rate/ImportVendorRateModal";
import { RateVersionTableModal } from "../../components/modals/Rate/RateVersionTableModal"; 
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
import { StatusBadge } from "../../components/ui/StatusBadge";

interface Option { label: string; value: string; }

interface ColumnConfig extends FilterColumn {
  render?: (data: VendorRateData) => React.ReactNode;
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
const DEFAULT_TABLE_COLUMNS = ["ratePlan", "countryName", "countryCode", "timeZoneName", "network", "MCC", "MNC", "rate", "version", "status", "effectiveFrom", "effectiveTo"];

const VendorRate: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [rates, setRates] = useState<VendorRateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [timezoneOptions, setTimezoneOptions] = useState<Option[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<Option[]>([]);
  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const [timezoneMap, setTimezoneMap] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false); 
  const [activeRatePlan, setActiveRatePlan] = useState<string | null>(null);

  const [editingRate, setEditingRate] = useState<VendorRateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowRate, setSelectedRowRate] = useState<VendorRateData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("vendorrate_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("vendorrate_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "vendor";
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getCountriesApi("country", 1, 1000).then((res: any) => {
      const list = res.results || (Array.isArray(res) ? res : []);
      const map: Record<string, string> = {};
      const options: Option[] = [];
      list.forEach((c: any) => { 
        map[String(c.id)] = c.name; 
        options.push({ label: c.name, value: String(c.id) }); 
      });
      setCountryMap(map); 
      setCountryOptions(options.sort((a, b) => a.label.localeCompare(b.label)));
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
    { key: "network", label: "Network", type: "text", filterKey: "network__icontains" },

    { key: "countryName", label: "Country", type: "text", options: countryOptions, filterKey: "country__name__icontains" },
    { key: "timeZoneName", label: "Time Zone", type: "text", options: timezoneOptions, filterKey: "timeZone__name__icontains" },

    { key: "MCC", label: "MCC", type: "text", filterKey: "MCC__icontains" },
    { key: "MNC", label: "MNC", type: "text", filterKey: "MNC__icontains" },
    { key: "countryCode", label: "Country Code", type: "text", filterKey: "countryCode__icontains" },

    { key: "rate", label: "Rate (Exact)", tableLabel: "Rate", type: "number" },
    { key: "rate__range", label: "Rate (Range)", type: "number_range", filterKey: "rate", isSearchOnly: true },
    { key: "rate__gt_lt", label: "Rate (GT / LT)", type: "number_gt_lt", filterKey: "rate", isSearchOnly: true },

    { 
      key: "version", 
      label: "Version", 
      type: "number", 
      filterKey: "version",
      // ⚡️ FIX: Removed the version count badge here, strictly just showing the version number
    },
    { 
      key: "status", 
      label: "Status", 
      type: "text", 
      options: [{ label: "DRAFT", value: "DRAFT" }, { label: "ACTIVE", value: "ACTIVE" }, { label: "EXPIRED", value: "EXPIRED" }], 
      filterKey: "status",
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

      const response: any = await getVendorRatesApi(routeName, currentPage, rowsPerPage, currentSearchParams);

      if (newController.signal.aborted) return;
      if (response && response.results) { 
        const groupedMap = new Map<string, any>();
        response.results.forEach((item: any) => {
          const existing = groupedMap.get(item.ratePlan);
          if (!existing) {
            groupedMap.set(item.ratePlan, { ...item, _versionCount: 1 });
          } else {
            if (item.version > existing.version) {
              groupedMap.set(item.ratePlan, { ...item, _versionCount: existing._versionCount + 1 });
            } else {
              existing._versionCount += 1;
            }
          }
        });
        setRates(Array.from(groupedMap.values())); 
        setTotalItems(response.count); 
      } 
      else if (Array.isArray(response)) { setRates(response); setTotalItems(response.length); } 
      else { setRates([]); setTotalItems(0); }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch vendor rates.");
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
        await deleteVendorRateApi(deleteId, routeName);
        toast.success("Vendor rate deleted.");
        fetchRates();
      } catch (error) { toast.error("Failed to delete vendor rate."); }
      setDeleteId(null);
    }
  };

  const openVersionsModal = (ratePlan: string) => {
    setActiveRatePlan(ratePlan);
    setIsVersionsModalOpen(true);
  };

  const handleEdit = (rate: VendorRateData) => { if (!canUpdate) return; setEditingRate(rate); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingRate(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleImportClick = () => { if (!canCreate) return; setIsImportModalOpen(true); };
  const handleView = (rate: VendorRateData) => { setEditingRate(rate); setIsViewMode(true); setIsModalOpen(true); };

  const handleContextMenu = (e: React.MouseEvent, item: VendorRateData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowRate(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowRate ? [
    { label: "Manage Versions", icon: <Layers size={16} />, onClick: () => openVersionsModal(selectedRowRate.ratePlan!) },
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowRate) },
    ...(canUpdate ? [{ label: "Edit Rate", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowRate) }] : []),
    ...(canDelete ? [{ label: "Delete Rate", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowRate.id!) }] : []),
  ] : [];

  const renderCountry = (rate: VendorRateData) => { if (rate.countryName) return rate.countryName; return countryMap[String(rate.country)] || String(rate.country); };
  const renderTimezone = (rate: VendorRateData) => { if (rate.timeZoneName) return rate.timeZoneName; return timezoneMap[String(rate.timeZone)] || String(rate.timeZone); };

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.tableLabel || col.label)];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  const rateToDelete = rates.find(r => r.id === deleteId);
  const deleteMessage = rateToDelete && (rateToDelete as any)._versionCount > 1
    ? `Warning: There are ${(rateToDelete as any)._versionCount} versions of this rate plan. Are you sure you want to delete this latest version? Action cannot be undone.`
    : "Are you sure you want to delete this rate? Action cannot be undone.";


  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Vendor Rates</h1>
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
          <span>/</span><span className="text-text-primary dark:text-white">Vendor Rates</span>
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

      <DataTable serverSide={true} data={rates} totalItems={totalItems} currentPage={currentPage} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} onRowsPerPageChange={setRowsPerPage} headers={tableHeaders} isLoading={isLoading}
        headerActions={canCreate ? ( <div className="flex gap-2"><Button variant="secondary" onClick={handleImportClick} leftIcon={<Upload size={18} />}>Import CSV</Button><Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>Add Vendor Rate</Button></div>) : null}
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
      
      <VendorRateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchRates} moduleName={routeName} editingRate={editingRate} isViewMode={isViewMode} />
      
      <RateVersionTableModal
        isOpen={isVersionsModalOpen}
        onClose={() => {
          setIsVersionsModalOpen(false);
          setActiveRatePlan(null);
          fetchRates(); 
        }}
        ratePlan={activeRatePlan}
        moduleName={routeName}
        fetchApi={getVendorRatesApi}
        deleteApi={deleteVendorRateApi}
        countryMap={countryMap}
        timezoneMap={timezoneMap}
        isVendorMode={true}
        onEdit={(rate) => {
          setEditingRate(rate);
          setIsViewMode(false);
          setIsModalOpen(true);
        }}
        onView={(rate) => {
          setEditingRate(rate);
          setIsViewMode(true);
          setIsModalOpen(true);
        }}
        onRefresh={fetchRates}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <ImportVendorRateModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={fetchRates} />
      <DeleteModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Vendor Rate" message={deleteMessage} />
    </div>
  );
};

export default VendorRate;