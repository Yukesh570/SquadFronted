import React, { useState, useEffect, useRef } from "react";
import { Home, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import { getClientTransactionsApi, type ClientTransactionData } from "../../api/transactionApi/transactionApi";
import { ClientTransactionModal } from "../../components/modals/Transaction/ClientTransactionModal";

import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

interface Option { label: string; value: string; }

interface ColumnConfig extends FilterColumn {
  render?: (data: ClientTransactionData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
}

const DEFAULT_SEARCH_COLUMNS = ["clientName", "message_id", "transactionType"];
const DEFAULT_TABLE_COLUMNS = ["message_id", "clientName", "transactionType", "segments", "amount", "createdAt"];
const BATCH_SIZE = 100;
const LOAD_MORE_THRESHOLD_PX = 200;

const ClientTransaction: React.FC = () => {
  const [transactions, setTransactions] = useState<ClientTransactionData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // initial / fresh search load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // infinite-scroll load
  const [loadedPage, setLoadedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewData, setViewData] = useState<ClientTransactionData | null>(null);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowLog, setSelectedRowLog] = useState<ClientTransactionData | null>(null);

  // --- Filters ---
  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("clienttx_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("clienttx_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  // EXACT CLONE: Dynamic Route Name
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "clientTransaction";
  const abortControllerRef = useRef<AbortController | null>(null);


  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const allColumns: ColumnConfig[] = [
    { key: "message_id", label: "Message ID", type: "text" },
    { key: "clientName", label: "Client Name", type: "text" },
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
  const fetchTransactions = async (
    filters: Record<string, string> | null = null,
    page: number = 1,
    append: boolean = false,
  ) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;
    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

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

      const response: any = await getClientTransactionsApi(routeName, page, BATCH_SIZE, currentSearchParams);
      
      if (newController.signal.aborted) return;
      
      if (response && response.results) {
        setTransactions((prev) => (append ? [...prev, ...response.results] : response.results));
        setTotalItems(response.count);
        setHasMore(Boolean(response.next));
        setLoadedPage(page);
      } else if (Array.isArray(response)) {
        setTransactions((prev) => (append ? [...prev, ...response] : response));
        setTotalItems(response.length);
        setHasMore(false);
        setLoadedPage(page);
      } else {
        if (!append) setTransactions([]);
        setTotalItems(0);
        setHasMore(false);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch client transactions.");
    } finally {
      if (abortControllerRef.current === newController) {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchTransactions(undefined, 1, false);
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [routeName, searchColumns]);
  useEffect(() => {
    const scrollEl = tableWrapperRef.current?.querySelector<HTMLDivElement>(
      ".custom-scrollbar",
    );
    if (!scrollEl) return;

    const handleScroll = () => {
      if (isLoading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop - clientHeight < LOAD_MORE_THRESHOLD_PX) {
        fetchTransactions(filterValues, loadedPage + 1, true);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isFetchingMore, hasMore, loadedPage, filterValues, transactions.length]);

  const handleSearch = () => {
    fetchTransactions(undefined, 1, false);
  };

  const handleClearFilters = () => {
    setFilterValues({});
    fetchTransactions({}, 1, false);
  };

  const handleView = (log: ClientTransactionData) => { setViewData(log); setIsModalOpen(true); };

  // --- Context Menu ---
  const handleContextMenu = (e: React.MouseEvent, log: ClientTransactionData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowLog(log);
  };

  const menuItems: ContextMenuItem[] = selectedRowLog ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowLog) },
  ] : [];

  const tableHeaders = ["S.N", ...visibleTableFields.map((col) => col.label)];

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
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Client Transactions</h1>
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
          <span className="text-text-primary dark:text-white">Client Transactions</span>
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

      <style>{`
        .client-transaction-table > div > div:first-child > div:first-child > div:first-child {
          display: none !important;
        }
        .client-transaction-table > div > div:first-child > div:first-child > div:last-child {
          display: none !important;
        }
        .client-transaction-table td {
          padding-top: 0.625rem !important;
          padding-bottom: 0.625rem !important;
        }
        .client-transaction-table th {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }
        .client-transaction-table th:first-child,
        .client-transaction-table td:first-child {
          min-width: 56px !important;
          width: 56px !important;
        }
      `}</style>

      <div ref={tableWrapperRef} className="client-transaction-table">
        <DataTable
          serverSide={true}
          data={transactions}
          totalItems={totalItems}
          rowsPerPage={BATCH_SIZE}
          headers={tableHeaders}
          isLoading={isLoading}
          renderRow={(log, index) => (
            <tr key={log.id || index} onContextMenu={(e) => handleContextMenu(e, log)} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors">
              <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{index + 1}</td>
              {visibleTableFields.map((col) => {
                let cellData = (log as any)[col.key];
                if (col.render) return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{col.render(log)}</td>;
                if (col.options) { const match = col.options.find((opt) => opt.value === String(cellData)); cellData = match ? match.label : cellData; }
                return <td key={col.key} className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">{cellData || "-"}</td>;
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
      <ClientTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} viewData={viewData} />
    </div>
  );
};

export default ClientTransaction;