import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getVendorPoliciesApi,
  deleteVendorPolicyApi,
  type VendorPolicyData,
} from "../../api/policyApi/vendorPolicyApi";
// @ts-ignore
import { getVendorsApi } from "../../api/connectivityApi/vendorApi";
import { VendorPolicyModal } from "../../components/modals/Policy/VendorPolicyModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

interface Option { label: string; value: string; }

interface ColumnConfig extends FilterColumn {
  render?: (data: VendorPolicyData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchOnly?: boolean;
  tableLabel?: string;
}

const DEFAULT_SEARCH_COLUMNS = ["vendor_name"];
const DEFAULT_TABLE_COLUMNS = ["vendor_name", "rateTps", "sendQueueLimit", "logLevel", "responseTimeout"];

const VendorPolicy: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [policies, setPolicies] = useState<VendorPolicyData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<VendorPolicyData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowPolicy, setSelectedRowPolicy] = useState<VendorPolicyData | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("vendorpolicy_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("vendorpolicy_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/").pop() || "vendorPolicy";
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getVendorsApi("vendor", 1, 1000).then((res: any) => {
      const list = res.results || (Array.isArray(res) ? res : []);
      const options: Option[] = list.map((v: any) => ({ 
        label: v.profileName || v.name || `Vendor ${v.id}`, 
        value: String(v.id) 
      }));
      setVendorOptions(options.sort((a, b) => a.label.localeCompare(b.label)));
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

  const logLevelOptions = [
    { label: "DEBUG", value: "DEBUG" },
    { label: "INFO", value: "INFO" },
    { label: "WARNING", value: "WARNING" },
    { label: "ERROR", value: "ERROR" },
    { label: "CRITICAL", value: "CRITICAL" },
  ];

  const allColumns: ColumnConfig[] = [
    { key: "vendor_name", label: "Vendor Name", type: "text", options: vendorOptions, filterKey: "vendor__profileName__icontains" },
    { key: "rateTps", label: "Rate TPS", type: "number" },
    { key: "sendQueueLimit", label: "Queue Limit", type: "number" },
    { key: "logLevel", label: "Log Level", type: "text", options: logLevelOptions },
    { key: "responseTimeout", label: "Response Timeout (s)", type: "number" },
    { key: "connectionTimeout", label: "Conn. Timeout (s)", type: "number" },
    { key: "connectionRetryCount", label: "Conn. Retries", type: "number" },
    { key: "tlvTag", label: "TLV Tag", type: "text" },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => { setFilterValues((prev) => ({ ...prev, [key]: value })); };

  const fetchPolicies = async (filters: Record<string, string> | null = null) => {
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
          
          if (columnDef?.options && columnDef.filterKey) {
            const selectedOption = columnDef.options.find((opt) => opt.value === value);
            const isNameField = columnDef.filterKey?.includes("__profileName") || columnDef.filterKey?.includes("__icontains");
            currentSearchParams[columnDef.filterKey] = selectedOption ? (isNameField ? selectedOption.label : selectedOption.value) : value;
          } else if (columnDef?.options && !columnDef.filterKey) {
             currentSearchParams[key] = value; // for loglevel etc
          } else if (columnDef?.type === "text") {
            currentSearchParams[`${key}__icontains`] = value;
          } else {
            currentSearchParams[columnDef?.filterKey || key] = value;
          }
        }
      });

      const response: any = await getVendorPoliciesApi(routeName, currentPage, rowsPerPage, currentSearchParams);

      if (newController.signal.aborted) return;
      if (response && response.results) { setPolicies(response.results); setTotalItems(response.count); } 
      else if (Array.isArray(response)) { setPolicies(response); setTotalItems(response.length); } 
      else { setPolicies([]); setTotalItems(0); }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch policies.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => { setCurrentPage(1); fetchPolicies(); };
  const handleClearFilters = () => { setFilterValues({}); setCurrentPage(1); fetchPolicies({}); };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteVendorPolicyApi(deleteId, routeName);
        toast.success("Vendor policy deleted.");
        fetchPolicies();
      } catch (error) { toast.error("Failed to delete policy."); }
      setDeleteId(null);
    }
  };

  const handleEdit = (policy: VendorPolicyData) => { if (!canUpdate) return; setEditingPolicy(policy); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingPolicy(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (policy: VendorPolicyData) => { setEditingPolicy(policy); setIsViewMode(true); setIsModalOpen(true); };

  const handleContextMenu = (e: React.MouseEvent, item: VendorPolicyData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowPolicy(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowPolicy ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowPolicy) },
    ...(canUpdate ? [{ label: "Edit Policy", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowPolicy) }] : []),
    ...(canDelete ? [{ label: "Delete Policy", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowPolicy.id!) }] : []),
  ] : [];

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.tableLabel || col.label)];

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Vendor Policies</h1>
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
          <span>/</span><span className="text-text-primary dark:text-white">Vendor Policy</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          if (col.options) return <Select key={col.key} label={`Search ${col.label}`} value={filterValues[col.key] || ""} onChange={(val) => handleFilterChange(col.key, val)} options={col.options} placeholder={`Select ${col.label}`} />;
          return <Input key={col.key} type={col.type || "text"} label={`Search ${col.label}`} value={filterValues[col.key] || ""} onChange={(e) => handleFilterChange(col.key, e.target.value)} placeholder={`${col.label}`} />;
        })}
      </FilterCard>

      <DataTable serverSide={true} data={policies} totalItems={totalItems} currentPage={currentPage} rowsPerPage={rowsPerPage} onPageChange={setCurrentPage} onRowsPerPageChange={setRowsPerPage} headers={tableHeaders} isLoading={isLoading} headerActions={canCreate ? <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>Add Vendor Policy</Button> : null}
        renderRow={(item, index) => (
          <tr key={item.id || index} onContextMenu={(e) => handleContextMenu(e, item)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">{(currentPage - 1) * rowsPerPage + index + 1}</td>
            {visibleTableFields.map((col) => {
              let cellData = (item as any)[col.key];
              if (col.render) return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(item)}</td>;
              if (col.options) { const match = col.options.find((opt) => opt.value === String(cellData)); cellData = match ? match.label : cellData; }
              return <td key={col.key} className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${col.key === "vendor_name" ? "font-medium text-text-primary dark:text-white" : ""}`}>{cellData ?? "-"}</td>;
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />
      <VendorPolicyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchPolicies} moduleName={routeName} editingPolicy={editingPolicy} isViewMode={isViewMode} />
      <DeleteModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Vendor Policy" message="Are you sure you want to delete this policy?" />
    </div>
  );
};

export default VendorPolicy;