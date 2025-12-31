import React, { useState } from "react";
import Select from "./Select";
import { ChevronLeft, ChevronRight, Database } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  headers: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  headerActions?: React.ReactNode; // For the "Add" button

  // Server-Side Pagination Props
  serverSide?: boolean;
  totalItems?: number;
  currentPage?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
}

const rowsOptions = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
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
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);
  const [clientRows, setClientRows] = useState(10);

  const activePage = serverSide ? currentPage : clientPage;
  const activeRows = serverSide ? rowsPerPage : clientRows;
  const activeTotal = serverSide ? totalItems : data.length;

  const totalPages = Math.ceil(activeTotal / activeRows);
  const startIndex = (activePage - 1) * activeRows;

  // Logic: If ServerSide, use data AS IS. If ClientSide, slice it.
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
    activeTotal
  )} of ${activeTotal}`;

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-text-secondary dark:text-gray-400">
              Rows per page:
            </span>
            <div className="w-20">
              <Select
                value={String(activeRows)}
                onChange={(val) => handleRowsChange(Number(val))}
                options={rowsOptions}
                clearable={false}
              />
            </div>
          </div>
          <span className="text-sm text-text-secondary dark:text-gray-400">
            {paginationLabel}
          </span>
          <div className="flex items-center space-x-2">
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
        {headerActions && <div>{headerActions}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-gray-400"
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
                  Loading
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
    </div>
  );
}

export default DataTable;
