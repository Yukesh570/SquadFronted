import React, { useState, useEffect, useRef } from "react";
import { Home, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import { getVendorTransactionsApi, type VendorTransactionData } from "../../api/transactionApi/transactionApi";
import { VendorTransactionModal } from "../../components/modals/Transaction/VendorTransactionModal";

import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

interface Option { label: string; value: string; }

interface ColumnConfig extends FilterColumn {
  render?: (data: VendorTransactionData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
}

const DEFAULT_SEARCH_COLUMNS = ["vendorProfileName", "message_id", "transactionType"];
const DEFAULT_TABLE_COLUMNS = ["message_id", "vendorProfileName", "transactionType", "segments", "amount", "createdAt"];

const VendorTransaction: React.FC = () => {
  const [transactions, setTransactions] = useState<VendorTransactionData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewData, setViewData] = useState<VendorTransactionData | null>(null);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowLog, setSelectedRowLog] = useState<VendorTransactionData | null>(null);

  // --- Filters ---
  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("vendortx_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("vendortx_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // EXACT CLONE: Dynamic Route Name
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "vendorTransaction";
  const abortControllerRef = useRef<AbortController | null>(null);

  const allColumns: ColumnConfig[] = [
    { key: "message_id", label: "Message ID", type: "text" },
    { key: "vendorProfileName", label: "Vendor Name", type: "text" },
    { key: "transactionType", label: "Type", type: "text" },
    { key: "segments", label: "Segments", type: "text" },
    { key: "ratePerSegment", label: "Rate Per Segment", type: "text" },
    { key: "amount", label: "Amount", type: "text" },
    { key: "balanceSpent", label: "Balance Spent", type: "text" },
    { key: "createdAt", label: "Created At", type: "text", render: (log) => (<span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</span>) },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  // EXACT CLONE: Fetch Logic
  const fetchTransactions = async (filters: Record<string, string> | null = null) => {
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
            if (columnDef.filterKey) {
              const selectedOption = columnDef.options.find((opt) => opt.value === value);
              currentSearchParams[columnDef.filterKey] = selectedOption ? selectedOption.label : value;
            } else {
              currentSearchParams[key] = value;
            }
          } else if (columnDef?.type === "text") {
            currentSearchParams[`${key}__icontains`] = value;
          } else {
            currentSearchParams[key] = value;
          }
        }
      });

      const response: any = await getVendorTransactionsApi(routeName, currentPage, rowsPerPage, currentSearchParams);
      
      if (newController.signal.aborted) return;
      
      if (response && response.results) {
        setTransactions(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setTransactions(response);
        setTotalItems(response.length);
      } else {
        setTransactions([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch vendor transactions.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
    fetchTransactions({});
  };

  const handleView = (log: VendorTransactionData) => { setViewData(log); setIsModalOpen(true); };

  // --- Context Menu ---
  const handleContextMenu = (e: React.MouseEvent, log: VendorTransactionData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowLog(log);
  };

  const menuItems: ContextMenuItem[] = selectedRowLog ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowLog) },
  ] : [];

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.label)];

  const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Module";
        
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      
      hasLoggedOpening.current = true;
    }
  }, []);

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Vendor Transactions</h1>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={searchColumns} onFilter={(newCols) => { setSearchColumns(newCols); setFilterValues((prev) => { const next = { ...prev }; Object.keys(next).forEach((k) => { if (!newCols.includes(k)) delete next[k]; }); return next; }); }} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Vendor Transactions</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          if (col.options) {
            return <Select key={col.key} label={col.label} value={filterValues[col.key] || ""} onChange={(val) => handleFilterChange(col.key, val)} options={col.options} placeholder={`Select ${col.label}`} />;
          }
          return <Input key={col.key} label={col.label} value={filterValues[col.key] || ""} onChange={(e) => handleFilterChange(col.key, e.target.value)} placeholder={`Search ${col.label}`} />;
        })}
      </FilterCard>

      <DataTable
        serverSide={true}
        data={transactions}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={tableHeaders}
        isLoading={isLoading}
        renderRow={(log, index) => (
          <tr key={log.id || index} onContextMenu={(e) => handleContextMenu(e, log)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">{(currentPage - 1) * rowsPerPage + index + 1}</td>
            {visibleTableFields.map((col) => {
              let cellData = (log as any)[col.key];
              if (col.render) return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(log)}</td>;
              if (col.options) { const match = col.options.find((opt) => opt.value === String(cellData)); cellData = match ? match.label : cellData; }
              return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{cellData || "-"}</td>;
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />
      <VendorTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} viewData={viewData} />
    </div>
  );
};

export default VendorTransaction;