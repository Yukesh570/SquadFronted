import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// --- APIs ---
import { getInvoiceSetupsApi, deleteInvoiceSetupApi, type InvoiceSetupData } from "../../../api/financeApi/invoiceSetupApi";
import { getCompaniesApi } from "../../../api/companyApi/companyApi";

// --- Components ---
import { InvoiceSetupModal } from "../../../components/modals/Finance/InvoiceSetupModal";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input"; 
import DatePicker from "../../../components/ui/DatePicker";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../../components/ui/AdvancedFilter";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import { actionHelper } from "../../../helper/action";

import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDateTime } from "../../../helper/dateFormatter";

interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: any) => React.ReactNode;
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

const DEFAULT_SEARCH_COLUMNS = ["companyName", "invoiceFrequency"];
const DEFAULT_TABLE_COLUMNS = ["companyName", "businessEntity", "invoiceFrequency", "dueDays", "isTaxApplied"];

const InvoiceSetup: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [setups, setSetups] = useState<InvoiceSetupData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [companies, setCompanies] = useState<Option[]>([]);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState<InvoiceSetupData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu State ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRow, setSelectedRow] = useState<InvoiceSetupData | null>(null);

  // --- Filter States ---
  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("invoiceSetup_table_columns_v2");
    try {
      return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
    } catch (e) {
      return DEFAULT_TABLE_COLUMNS;
    }
  });

  useEffect(() => {
    localStorage.setItem("invoiceSetup_table_columns_v2", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/").pop() || "invoiceSetup";
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => { actionHelper("Invoice Setup", `Opened Invoice Setup Module`, false); }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  // --- Fetch Companies for Filter ---
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const compRes: any = await getCompaniesApi("company", 1, 1000);
        const list = compRes.results || (Array.isArray(compRes) ? compRes : []);
        setCompanies(list.map((c: any) => ({ label: c.name, value: String(c.id) })));
      } catch (err) {
        console.error("Failed to load companies for filter");
      }
    };
    loadDropdowns();
  }, []);

  const frequencyOptions: Option[] = [
    { label: "Weekly", value: "WEEKLY" },
    { label: "Bi-weekly", value: "BI-WEEKLY" },
    { label: "Monthly", value: "MONTHLY" },
    { label: "3 Months", value: "QUARTERLY" },
  ];

  const booleanOptions: Option[] = [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
  ];

  const renderBooleanBadge = (value: boolean) => {
    const statusKey = value ? "DELIVERED" : "PENDING";
    const labelText = value ? "Yes" : "No";
    
    return <StatusBadge status={statusKey} customText={labelText} />;
  };

  const allColumns: ColumnConfig[] = [
    { key: "companyName", label: "Company", type: "text", options: companies, filterKey: "company" },
    { 
      key: "businessEntity", 
      label: "Entity", 
      type: "text",
      filterKey: "businessEntity__legalEntityName__icontains",
      render: (s: InvoiceSetupData) => s.businessEntityName || s.businessEntity 
    },
    { key: "invoiceFrequency", label: "Frequency", type: "text", options: frequencyOptions, filterKey: "invoiceFrequency" },
    { key: "dueDays", label: "Due Days", type: "number", filterKey: "dueDays" },
    { key: "tax", label: "Tax Details", type: "text", filterKey: "tax__icontains" },
    { 
      key: "isTaxApplied", 
      label: "Tax Applied", 
      type: "text", 
      options: booleanOptions, 
      filterKey: "isTaxApplied",
      render: (s: any) => renderBooleanBadge(s.isTaxApplied) 
    },
    { key: "billingAddressOverride", label: "Billing Address", type: "text", filterKey: "billingAddressOverride__icontains" },

    // --- Date Filters explicitly mapped to createdAt__range ---
    { key: "createdAt", label: "Created At (Single Day)", tableLabel: "Created At", type: "date", filterKey: "createdAt__range", render: (s: InvoiceSetupData) => (s.createdAt ? formatDateTime(s.createdAt) : "-") },
    { key: "createdAt__range", label: "Created At (Range)", type: "date_range", filterKey: "createdAt__range", isSearchOnly: true },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));
  const tableFilterColumns = allColumns.filter((c) => !c.isSearchOnly).map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const fetchSetups = async (filters: Record<string, string> | null = null) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;
    setIsLoading(true);

    try {
      const activeFilters = filters || filterValues;
      const currentSearchParams: Record<string, string> = {};

      searchColumns.forEach((key) => {
        const value = activeFilters[key];
        if (!value) return;
        const columnDef = allColumns.find((c) => c.key === key);
        const baseKey = columnDef?.filterKey || key;

        if (columnDef?.options) {
          const selectedOption = columnDef.options.find((opt: Option) => opt.value === value);
          currentSearchParams[baseKey] = selectedOption ? selectedOption.value : value; 
        } else {
          currentSearchParams[baseKey] = value;
        }
      });

      const response: any = await getInvoiceSetupsApi(routeName, currentPage, rowsPerPage, currentSearchParams);

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setSetups(response.results);
        setTotalItems(response.count);
      } else {
        setSetups([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setSetups([]);
        setTotalItems(0);
      }
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSetups();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => { setCurrentPage(1); fetchSetups(); };
  const handleClearFilters = () => { setFilterValues({}); setCurrentPage(1); fetchSetups({}); };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteInvoiceSetupApi(deleteId, routeName);
        toast.success("Invoice Setup deleted successfully.");
        fetchSetups();
      } catch (error) {
        toast.error("Failed to delete setup.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (setup: InvoiceSetupData) => { if (!canUpdate) return; setEditingSetup(setup); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingSetup(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (setup: InvoiceSetupData) => { setEditingSetup(setup); setIsViewMode(true); setIsModalOpen(true); };

  const handleContextMenu = (e: React.MouseEvent, setup: InvoiceSetupData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRow(setup);
  };

  const menuItems: ContextMenuItem[] = selectedRow ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRow) },
    ...(canUpdate ? [{ label: "Edit Setup", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRow) }] : []),
    ...(canDelete ? [{ label: "Delete Setup", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRow.id!) }] : []),
  ] : [];

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.tableLabel || col.label)];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Invoice Setup</h1>
          <div className="relative z-20">
            <AdvancedFilter columns={tableFilterColumns} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={searchColumns} onFilter={setSearchColumns} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">Finance</span>
          <span>/</span><span className="text-text-primary dark:text-white">Invoice Setup</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          const baseLabel = getBaseLabel(col.label);

          if (col.options) {
            return (
              <Select 
                key={col.key} 
                label={`Search ${baseLabel}`} 
                value={filterValues[col.key] || ""} 
                onChange={(val) => handleFilterChange(col.key, val)} 
                options={col.options} 
                placeholder={`Select ${baseLabel}`} 
              />
            );
          }
          if (col.type === "date") {
            const rawVal = filterValues[col.key] || "";
            const datePart = rawVal.split("T")[0];

            return (
              <DatePicker
                key={col.key}
                label={`Search ${baseLabel}`}
                selected={datePart ? new Date(datePart) : null}
                onChange={(val: Date | null) => {
                  if (val) {
                    const formatted = formatLocalDate(val);
                    handleFilterChange(col.key, `${formatted}T00:00:00,${formatted}T23:59:59`);
                  } else {
                    handleFilterChange(col.key, "");
                  }
                }}
              />
            );
          }
          if (col.type === "date_range") {
            const [startRange, endRange] = (filterValues[col.key] || "").split(",");
            const startStr = startRange ? startRange.split("T")[0] : "";
            const endStr = endRange ? endRange.split("T")[0] : "";

            return (
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${baseLabel} (From)`}
                  selected={startStr ? new Date(startStr) : null}
                  onChange={(val: Date | null) => {
                    const newStart = val ? formatLocalDate(val) : "";
                    const currentEnd = endStr || "";
                    if (newStart || currentEnd) {
                      const startVal = newStart ? `${newStart}T00:00:00` : "";
                      const endVal = currentEnd ? `${currentEnd}T23:59:59` : "";
                      handleFilterChange(col.key, `${startVal},${endVal}`);
                    } else {
                      handleFilterChange(col.key, "");
                    }
                  }}
                />
                <DatePicker
                  label={`Search ${baseLabel} (To)`}
                  selected={endStr ? new Date(endStr) : null}
                  onChange={(val: Date | null) => {
                    const newEnd = val ? formatLocalDate(val) : "";
                    const currentStart = startStr || "";
                    if (currentStart || newEnd) {
                      const startVal = currentStart ? `${currentStart}T00:00:00` : "";
                      const endVal = newEnd ? `${newEnd}T23:59:59` : "";
                      handleFilterChange(col.key, `${startVal},${endVal}`);
                    } else {
                      handleFilterChange(col.key, "");
                    }
                  }}
                />
              </React.Fragment>
            );
          }
          return (
             <Input
               key={col.key}
               label={`Search ${baseLabel}`}
               value={filterValues[col.key] || ""}
               onChange={(e) => handleFilterChange(col.key, e.target.value)}
               placeholder={`Search ${baseLabel}`}
             />
          );
        })}
      </FilterCard>

      <DataTable
        serverSide={true}
        data={setups}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={tableHeaders}
        isLoading={isLoading}
        headerActions={
          canCreate ? (
            <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>
              Add Setup
            </Button>
          ) : null
        }
        renderRow={(setup, index) => (
          <tr key={setup.id || index} onContextMenu={(e) => handleContextMenu(e, setup)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              let cellData = (setup as any)[col.key];
              if (col.render) {
                return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(setup)}</td>;
              }
              return (
                <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">
                  {cellData || "-"}
                </td>
              );
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <InvoiceSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSetups}
        moduleName={routeName} 
        editingSetup={editingSetup}
        isViewMode={isViewMode}
      />

      <DeleteModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Setup" message="Are you sure you want to delete this invoice setup? This action cannot be undone." />
    </div>
  );
};

export default InvoiceSetup;