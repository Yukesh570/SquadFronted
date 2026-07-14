import React, { useState } from "react";
import Select from "./Select";
import { ChevronLeft, ChevronRight, Database } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  headers: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  headerActions?: React.ReactNode; 

  // Server-Side Pagination Props
  serverSide?: boolean;
  totalItems?: number;
  currentPage?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  rowsPerPageOptions?: { value: string; label: string }[]; // NEW
}

const rowsOptions = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

export function DataTable<T extends { id?: number | string }>({
  data,
  headers,
  renderRow,
  isLoading = false,
  headerActions,

  serverSide = false,
  totalItems = 0,
  currentPage = 1,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = rowsOptions, // NEW default
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);
  const [clientRows, setClientRows] = useState(10);

  const activePage = serverSide ? currentPage : clientPage;
  const activeRows = serverSide ? rowsPerPage : clientRows;
  const activeTotal = serverSide ? totalItems : data.length;

  const totalPages = Math.ceil(activeTotal / activeRows);
  const startIndex = (activePage - 1) * activeRows;

  const displayData = serverSide
    ? data
    : data.slice(startIndex, startIndex + activeRows);

  const handleNext = () => {
    const nextPage = Math.min(activePage + 1, totalPages);
    if (serverSide && onPageChange) onPageChange(nextPage);
    else setClientPage(nextPage);
  };

  const handlePrev = () => {
    const prevPage = Math.max(activePage - 1, 1);
    if (serverSide && onPageChange) onPageChange(prevPage);
    else setClientPage(prevPage);
  };

  const handleRowsChange = (val: number) => {
    if (serverSide && onRowsPerPageChange) {
      onRowsPerPageChange(val);
      if (onPageChange) onPageChange(1);
    } else {
      setClientRows(val);
      setClientPage(1);
    }
  };

  const paginationLabel = `${
    activeTotal === 0
      ? 0
      : serverSide
        ? (activePage - 1) * activeRows + 1
        : startIndex + 1
  }-${Math.min(
    (serverSide ? (activePage - 1) * activeRows : startIndex) +
      displayData.length,
    activeTotal,
  )} of ${activeTotal}`;

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col relative z-0 app-data-table">
      
      {/* 1. TOP BAR (Controls + Action Buttons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4 gap-4 bg-white dark:bg-gray-800 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-text-secondary dark:text-gray-400 whitespace-nowrap">
              Rows per page:
            </span>
            <div className="w-24 shrink-0">
              <Select
                value={String(activeRows)}
                onChange={(val) => handleRowsChange(Number(val))}
                options={rowsPerPageOptions}
                clearable={false}
              />
            </div>
          </div>
          <span className="text-sm text-text-secondary dark:text-gray-400 whitespace-nowrap">
            {paginationLabel}
          </span>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handlePrev}
              disabled={activePage === 1 || isLoading}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleNext}
              disabled={
                activePage >= totalPages || activeTotal === 0 || isLoading
              }
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        {headerActions && <div className="shrink-0">{headerActions}</div>}
      </div>

      {/* 2. SCROLLABLE DATA TABLE */}
      <div className="overflow-auto max-h-[65vh] min-h-[300px] relative z-0 custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0">
          
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  /* FIX: Added whitespace-nowrap to keep headers perfectly on 1 line. Added min-width for safe spacing. */
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 whitespace-nowrap min-w-[120px]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-12 text-center text-text-secondary dark:text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-12 text-center text-text-secondary dark:text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Database
                      size={32}
                      className="text-gray-300 dark:text-gray-600 mb-2"
                    />
                    <span>No records found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayData.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Added subtle custom scrollbar styling so it looks good when scrolling horizontally */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }

        /* Zebra striping: alternate row backgrounds so each row reads as visually separated. */
        .app-data-table tbody tr:nth-child(odd) { background-color: #ffffff; }
        .app-data-table tbody tr:nth-child(even) { background-color: #f9fafb; }
        .dark .app-data-table tbody tr:nth-child(odd) { background-color: #1f2937; }
        .dark .app-data-table tbody tr:nth-child(even) { background-color: rgba(17, 24, 39, 0.4); }

        /* Keep hover feedback visible on top of the stripe (equal specificity, declared after = wins on hover). */
        .app-data-table tbody tr:hover { background-color: #f3f4f6; }
        .dark .app-data-table tbody tr:hover { background-color: #374151; }
      `,
        }}
      />

    </div>
  );
}

export default DataTable;