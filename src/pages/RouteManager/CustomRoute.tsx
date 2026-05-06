import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCustomRoutesApi,
  deleteCustomRouteApi,
  type CustomRouteData,
} from "../../api/routeManagerApi/customRouteApi";
import { getCompaniesApi } from "../../api/companyApi/companyApi";
import { getClientsApi } from "../../api/clientApi/clientApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getVendorsApi } from "../../api/connectivityApi/vendorApi";
import { CustomRouteModal } from "../../components/modals/RouteManager/CustomRouteModal";
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

interface Option { label: string; value: string; }

interface ColumnConfig extends FilterColumn {
  render?: (data: CustomRouteData) => React.ReactNode;
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

// FIXED: Removed Operator entirely
const DEFAULT_SEARCH_COLUMNS = ["name", "status", "orginatingCompanyName", "countryName"];
const DEFAULT_TABLE_COLUMNS = [
  "name", "orginatingCompanyName", "orginatingClientName", "status", 
  "countryName", "terminatingCompanyName", "terminatingVendorProfileName"
];

const CustomRoute: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [routes, setRoutes] = useState<CustomRouteData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<CustomRouteData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowRoute, setSelectedRowRoute] = useState<CustomRouteData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("customroute_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("customroute_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[2] || "customRoute";
  const abortControllerRef = useRef<AbortController | null>(null);

  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

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

  const extractOptions = (response: any, labelKey: string = "name") => {
    let data = [];
    if (response && response.results) data = response.results;
    else if (Array.isArray(response)) data = response;
    else if (response && Array.isArray(response.data)) data = response.data;
    
    return data.map((item: any) => ({
      label: item[labelKey] || item.name || "Unknown",
      value: String(item.id),
    })).sort((a: Option, b: Option) => a.label.localeCompare(b.label)); 
  };

  useEffect(() => {
    const fetchAllOptions = async () => {
      try {
        // FIXED: Removed Operator fetching
        const [companies, clients, countries, vendors] = await Promise.all([
          getCompaniesApi("company", 1, 1000), getClientsApi("client", 1, 1000),
          getCountriesApi("country", 1, 1000), getVendorsApi("vendor", 1, 1000),
        ]);

        setCompanyOptions(extractOptions(companies, "name"));
        setClientOptions(extractOptions(clients, "name"));
        setCountryOptions(extractOptions(countries, "name")); 
        setVendorOptions(extractOptions(vendors, "profileName"));
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    };
    fetchAllOptions();
  }, []);

  const statusOptions: Option[] = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  // FIXED: Operator object entirely removed
  const allColumns: ColumnConfig[] = [
    { key: "name", label: "Name", type: "text", filterKey: "name__icontains" },
    { key: "orginatingClientName", label: "Originating Client", type: "text", options: clientOptions, filterKey: "orginatingClient__name" },
    { key: "orginatingCompanyName", label: "Originating Company", type: "text", options: companyOptions, filterKey: "orginatingCompany__name" },
    { key: "status", label: "Status", type: "text", options: statusOptions, filterKey: "status" },
    { key: "countryName", label: "Country", type: "text", options: countryOptions, filterKey: "country__name__icontains" },
    { key: "terminatingVendorProfileName", label: "Terminating Vendor", type: "text", options: vendorOptions, filterKey: "terminatingVendor__profileName" },
    { key: "terminatingCompanyName", label: "Terminating Company", type: "text", options: companyOptions, filterKey: "terminatingCompany__name" },
    { key: "priority", label: "Priority", type: "text", filterKey: "priority__icontains" },

    { key: "createdAt", label: "Created At (Exact)", tableLabel: "Created At", type: "date", filterKey: "createdAt__date", render: (c: any) => (c.createdAt ? new Date(c.createdAt).toLocaleString() : "-") },
    { key: "createdAt__range", label: "Created At (From/To)", type: "date_range", isSearchOnly: true },
    { key: "createdAt__gt_lt", label: "Created At (After / Before)", type: "date_gt_lt", isSearchOnly: true },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => { setFilterValues((prev) => ({ ...prev, [key]: value })); };

  const fetchRoutes = async (filters: Record<string, string> | null = null) => {
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

          if (columnDef?.options) {
            const selectedOption = columnDef.options.find((opt) => opt.value === value);
            const isNameField = columnDef.filterKey?.includes("__name") || columnDef.filterKey?.includes("__profileName");
            currentSearchParams[columnDef.filterKey || key] = selectedOption ? (isNameField ? selectedOption.label : selectedOption.value) : value;
          } 
          else if (columnDef?.type === "date") {
            currentSearchParams[`${key}__range`] = `${value}T00:00:00,${value}T23:59:59`;
          } 
          else if (columnDef?.type === "date_range") {
            const baseKey = key.split("__")[0];
            const [start, end] = value.split(",");
            if (start && end) currentSearchParams[key] = `${start}T00:00:00,${end}T23:59:59`;
            else {
              if (start) currentSearchParams[`${baseKey}__gt`] = `${start}T00:00:00`;
              if (end) currentSearchParams[`${baseKey}__lt`] = `${end}T23:59:59`;
            }
          } 
          else if (columnDef?.type === "date_gt_lt") {
            const baseKey = key.replace("__gt_lt", "");
            const [gt, lt] = value.split(",");
            if (gt) currentSearchParams[`${baseKey}__gt`] = `${gt}T23:59:59`;
            if (lt) currentSearchParams[`${baseKey}__lt`] = `${lt}T00:00:00`;
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

      const response: any = await getCustomRoutesApi(routeName, currentPage, rowsPerPage, currentSearchParams);

      if (newController.signal.aborted) return;
      if (response && response.results) { setRoutes(response.results); setTotalItems(response.count); } 
      else if (Array.isArray(response)) { setRoutes(response); setTotalItems(response.length); } 
      else { setRoutes([]); setTotalItems(0); }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        if (error.response?.status === 403) toast.error("Permission denied: Cannot access Custom Routes.");
        else toast.error("Failed to fetch custom routes.");
      }
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => { setCurrentPage(1); fetchRoutes(); };
  const handleClearFilters = () => { setFilterValues({}); setCurrentPage(1); fetchRoutes({}); };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCustomRouteApi(deleteId, routeName);
        toast.success("Route deleted successfully.");
        fetchRoutes();
      } catch (error) { toast.error("Failed to delete route."); }
      setDeleteId(null);
    }
  };

  const handleEdit = (route: CustomRouteData) => { if (!canUpdate) return; setEditingRoute(route); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingRoute(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (route: CustomRouteData) => { setEditingRoute(route); setIsViewMode(true); setIsModalOpen(true); };

  const handleContextMenu = (e: React.MouseEvent, item: CustomRouteData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowRoute(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowRoute ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowRoute) },
    ...(canUpdate ? [{ label: "Edit Route", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowRoute) }] : []),
    ...(canDelete ? [{ label: "Delete Route", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowRoute.id!) }] : []),
  ] : [];

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.tableLabel || col.label)];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Custom Route</h1>
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
          <span>/</span><span className="text-text-primary dark:text-white">Custom Route</span>
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

      <DataTable serverSide={true} data={routes} totalItems={totalItems} currentPage={currentPage} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} onRowsPerPageChange={setRowsPerPage} headers={tableHeaders} isLoading={isLoading} headerActions={canCreate ? <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>Create Route</Button> : null}
        renderRow={(route, index) => (
          <tr key={route.id || index} onContextMenu={(e) => handleContextMenu(e, route)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">{(currentPage - 1) * rowsPerPage + index + 1}</td>
            {visibleTableFields.map((col) => {
              let cellData = (route as any)[col.key];
              if (col.render) return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(route)}</td>;
              if (col.options) { const match = col.options.find((opt) => opt.value === String(cellData)); cellData = match ? match.label : cellData; }
              if (col.key === "status") {
                return (
                  <td key={col.key} className="px-4 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${route.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>{route.status}</span>
                  </td>
                );
              }
              return <td key={col.key} className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${col.key === "name" ? "font-medium text-text-primary dark:text-white" : ""}`}>{cellData || "-"}</td>;
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />
      <CustomRouteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchRoutes} moduleName={routeName} editingRoute={editingRoute} isViewMode={isViewMode} />
      <DeleteModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Route" message="Are you sure you want to delete this route? This action cannot be undone." />
    </div>
  );
};

export default CustomRoute;