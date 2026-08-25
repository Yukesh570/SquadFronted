import React, { useState, useEffect, useRef } from "react";
import Select from "./Select";
import { ChevronLeft, ChevronRight, Database, GripVertical } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  headers: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  headerActions?: React.ReactNode;

  hideTopBar?: boolean;
  showCountOnly?: boolean;
  density?: "normal" | "compact";

  serverSide?: boolean;
  totalItems?: number;
  currentPage?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  rowsPerPageOptions?: { value: string; label: string }[];

  // Column Reordering Callback
  onReorderColumns?: (fromIndex: number, toIndex: number) => void;
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
  hideTopBar = false,
  showCountOnly = false,
  density = "normal",

  serverSide = false,
  totalItems = 0,
  currentPage = 1,
  rowsPerPage = 50,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = rowsOptions,

  onReorderColumns,
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);
  const [clientRows, setClientRows] = useState(50);

  // Drag-and-drop states with Left/Right positioning
  const [draggedHeaderIdx, setDraggedHeaderIdx] = useState<number | null>(null);
  const [dragOverHeaderIdx, setDragOverHeaderIdx] = useState<number | null>(null);
  const [dropSide, setDropSide] = useState<"left" | "right" | null>(null);

  // Track scroll container viewport width to perfectly center sticky empty states
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };

    updateWidth();

    const el = scrollContainerRef.current;
    if (!el) return;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateWidth();
      });
      resizeObserver.observe(el);
    } else {
      window.addEventListener("resize", updateWidth);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", updateWidth);
    };
  }, []);

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

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (index === 0) return; // Skip S.N. column
    setDraggedHeaderIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (index === 0 || draggedHeaderIdx === null || draggedHeaderIdx === index) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Detect left vs right half of the target header
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const side = e.clientX < midpoint ? "left" : "right";

    setDragOverHeaderIdx(index);
    setDropSide(side);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverHeaderIdx(null);
      setDropSide(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (
      draggedHeaderIdx !== null &&
      index !== 0 &&
      draggedHeaderIdx !== index &&
      onReorderColumns
    ) {
      // Calculate target index offset by S.N. column (-1)
      let targetIdx = index - 1;
      let fromIdx = draggedHeaderIdx - 1;

      // Adjust target position if dropped on right half
      if (dropSide === "right" && targetIdx < fromIdx) {
        targetIdx += 1;
      } else if (dropSide === "left" && targetIdx > fromIdx) {
        targetIdx -= 1;
      }

      onReorderColumns(fromIdx, targetIdx);
    }

    setDraggedHeaderIdx(null);
    setDragOverHeaderIdx(null);
    setDropSide(null);
  };

  const handleDragEnd = () => {
    setDraggedHeaderIdx(null);
    setDragOverHeaderIdx(null);
    setDropSide(null);
  };

  return (
    <div
      className={`rounded-xl bg-white shadow-card overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col relative z-0 app-data-table ${
        density === "compact" ? "table-density-compact" : ""
      }`}
    >
      {/* FULL TOP BAR */}
      {!hideTopBar && !showCountOnly && (
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
      )}

      {/* COUNT ONLY TOP BAR */}
      {showCountOnly && (
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800 relative z-10">
          <span className="text-sm text-text-secondary dark:text-gray-400">
            {paginationLabel}
          </span>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      )}

      {/* SCROLLABLE DATA TABLE */}
      <div
        ref={scrollContainerRef}
        className="overflow-auto max-h-[65vh] min-h-[300px] relative z-0 custom-scrollbar"
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0">
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
            <tr>
              {headers.map((header, i) => {
                const isDraggable = Boolean(onReorderColumns && i > 0);
                const isBeingDragged = draggedHeaderIdx === i;
                const isDragOver = dragOverHeaderIdx === i;

                return (
                  <th
                    key={i}
                    draggable={isDraggable}
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 whitespace-nowrap min-w-[120px] transition-all select-none ${
                      isDraggable
                        ? "cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-800"
                        : ""
                    } ${
                      isBeingDragged
                        ? "opacity-30 border border-dashed border-primary bg-primary/5"
                        : ""
                    } ${
                      isDragOver && dropSide === "left"
                        ? "border-l-4 border-l-primary bg-primary/10 dark:bg-primary/20"
                        : ""
                    } ${
                      isDragOver && dropSide === "right"
                        ? "border-r-4 border-r-primary bg-primary/10 dark:bg-primary/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 pointer-events-none">
                      {isDraggable && (
                        <GripVertical
                          size={14}
                          className="text-gray-400 shrink-0 opacity-40 hover:opacity-100"
                        />
                      )}
                      <span>{header}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="p-0 border-none"
                >
                  <div
                    className="sticky left-0 flex flex-col items-center justify-center py-16 text-center text-text-secondary dark:text-gray-400"
                    style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="p-0 border-none"
                >
                  <div
                    className="sticky left-0 flex flex-col items-center justify-center py-16 text-center text-text-secondary dark:text-gray-400"
                    style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
                  >
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }

        .app-data-table tbody tr:nth-child(odd) { background-color: #ffffff; }
        .app-data-table tbody tr:nth-child(even) { background-color: #f9fafb; }
        .dark .app-data-table tbody tr:nth-child(odd) { background-color: #1f2937; }
        .dark .app-data-table tbody tr:nth-child(even) { background-color: rgba(17, 24, 39, 0.4); }

        .app-data-table tbody tr:hover { background-color: #f3f4f6; }
        .dark .app-data-table tbody tr:hover { background-color: #374151; }

        .table-density-compact td { padding-top: 0.625rem !important; padding-bottom: 0.625rem !important; }
        .table-density-compact th { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
        .table-density-compact th:first-child,
        .table-density-compact td:first-child { min-width: 56px !important; width: 56px !important; }
      `,
        }}
      />
    </div>
  );
}

export default DataTable;