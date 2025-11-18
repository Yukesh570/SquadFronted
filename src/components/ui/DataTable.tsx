import React, { useState } from "react";
import Select from "./Select";
import { ChevronLeft, ChevronRight, Database } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  headers: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  headerActions?: React.ReactNode;
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
}: DataTableProps<T>) {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + rowsPerPage);

  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  const paginationLabel = `${totalItems === 0 ? 0 : startIndex + 1}-${Math.min(
    startIndex + rowsPerPage,
    totalItems
  )} of ${totalItems}`;

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-text-secondary">Rows per page:</span>
            <div className="w-20">
              <Select
                value={String(rowsPerPage)}
                onChange={(val) => setRowsPerPage(Number(val))}
                options={rowsOptions}
              />
            </div>
          </div>
          <span className="text-sm text-text-secondary">{paginationLabel}</span>
          <div className="flex items-center space-x-2">
            <button
              className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalItems === 0}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        {headerActions && <div>{headerActions}</div>}
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-gray-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-12 text-center text-text-secondary">
                  <div className="flex justify-center items-center space-x-2">
                     <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                     <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center justify-center">
                    <Database size={32} className="text-gray-300 mb-2"/>
                    <span>No records found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => renderRow(item, startIndex + index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;