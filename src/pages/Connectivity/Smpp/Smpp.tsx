import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSmppApi,
  deleteSmppApi,
  type SmppData,
} from "../../../api/connectivityApi/smppApi";
import { SmppModal } from "../../../components/modals/Connectivity/SmppModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import Select from "../../../components/ui/Select";
import AdvancedFilter, {
  type FilterColumn,
} from "../../../components/ui/AdvancedFilter";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import ContextMenu, {
  type ContextMenuItem,
} from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

// --- Interfaces ---
interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: SmppData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
}

// --- Default Configuration ---
const DEFAULT_SEARCH_COLUMNS = ["smppHost", "smppPort", "systemID", "bindMode"];
const DEFAULT_TABLE_COLUMNS = ["smppHost", "smppPort", "systemID", "bindMode"];

const Smpp: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [smpps, setSmpps] = useState<SmppData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSmpp, setEditingSmpp] = useState<SmppData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedRowSmpp, setSelectedRowSmpp] = useState<SmppData | null>(null);

  // --- Dynamic Filters & Columns State ---
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("smpp_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("smpp_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "connectivity";
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Column Configuration ---
  const bindModeOptions: Option[] = [
    { label: "Transmitter", value: "TRANSMITTER" },
    { label: "Receiver", value: "RECEIVER" },
    { label: "Transceiver", value: "TRANSCEIVER" },
  ];

  const allColumns: ColumnConfig[] = [
    { key: "smppHost", label: "Host", type: "text", filterKey: "smppHost__icontains" },
    { key: "smppPort", label: "Port", type: "number" },
    { key: "systemID", label: "System ID", type: "text", filterKey: "systemID__icontains" },
    { key: "bindMode", label: "Bind Mode", type: "text", options: bindModeOptions },
    { key: "sourceTON", label: "Source TON", type: "number" },
    { key: "sourceNPI", label: "Source NPI", type: "number" },
    { key: "destTON", label: "Dest. TON", type: "number" },
    { key: "destNPI", label: "Dest. NPI", type: "number" },
  ];

  const visibleSearchFields = allColumns.filter((col) =>
    searchColumns.includes(col.key)
  );
  const visibleTableFields = allColumns.filter((col) =>
    tableColumns.includes(col.key)
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  // --- Fetch Data (Advanced Filter Logic) ---
  const fetchSmpp = async (filters: Record<string, string> | null = null) => {
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
              const selectedOption = columnDef.options.find(
                (opt) => opt.value === value
              );
              currentSearchParams[columnDef.filterKey] = selectedOption
                ? selectedOption.value
                : value;
            } else {
              currentSearchParams[key] = value;
            }
          } else if (columnDef?.type === "text") {
            const filterKey = columnDef.filterKey || `${key}__icontains`;
            currentSearchParams[filterKey] = value;
          } else {
            currentSearchParams[key] = value;
          }
        }
      });

      const response: any = await getSmppApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams
      );

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setSmpps(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setSmpps(response);
        setTotalItems(response.length);
      } else {
        setSmpps([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError")
        toast.error("Failed to fetch SMPP configs.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSmpp();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  // --- Handlers ---
  const handleSearch = () => {
    setCurrentPage(1);
    fetchSmpp();
  };

  const handleClear = () => {
    setFilterValues({});
    setCurrentPage(1);
    fetchSmpp({});
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteSmppApi(deleteId, routeName);
        toast.success("Deleted successfully.");
        fetchSmpp();
      } catch (error) {
        toast.error("Failed to delete.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (item: SmppData) => {
    if (!canUpdate) return;
    setEditingSmpp(item);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleAdd = () => {
    if (!canCreate) return;
    setEditingSmpp(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleView = (item: SmppData) => {
    setEditingSmpp(item);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: SmppData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowSmpp(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowSmpp
    ? [
        {
          label: "View Details",
          icon: <Eye size={16} />,
          onClick: () => handleView(selectedRowSmpp),
        },
        ...(canUpdate
          ? [
              {
                label: "Edit SMPP",
                icon: <Edit size={16} />,
                onClick: () => handleEdit(selectedRowSmpp),
              },
            ]
          : []),
        ...(canDelete
          ? [
              {
                label: "Delete SMPP",
                icon: <Trash size={16} />,
                variant: "danger" as const,
                onClick: () => setDeleteId(selectedRowSmpp.id!),
              },
            ]
          : []),
      ]
    : [];

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.label)];

  const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll(
          "aside a.active, nav a.active"
        );
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel =
          activeItem?.innerText?.split("\n")[0].trim() || "Module";

        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);

      hasLoggedOpening.current = true;
    }
  }, []);

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            SMPP Connectivity
          </h1>

          <div className="relative z-20">
            <AdvancedFilter
              columns={allColumns}
              selectedColumns={searchColumns}
              onFilter={(newCols) => {
                setSearchColumns(newCols);
                setFilterValues((prev) => {
                  const next = { ...prev };
                  Object.keys(next).forEach((k) => {
                    if (!newCols.includes(k)) delete next[k];
                  });
                  return next;
                });
              }}
              onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)}
              isLoading={isLoading}
              buttonLabel="Search Fields"
            />
          </div>

          <div className="relative z-20">
            <AdvancedFilter
              columns={allColumns}
              selectedColumns={tableColumns}
              onFilter={setTableColumns}
              onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
              buttonLabel="Columns"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">SMPP</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClear}>
        {visibleSearchFields.map((col) => {
          if (col.options) {
            return (
              <Select
                key={col.key}
                label={`Search ${col.label}`}
                value={filterValues[col.key] || ""}
                onChange={(val) => handleFilterChange(col.key, val)}
                options={col.options}
                placeholder={`Select ${col.label}`}
              />
            );
          }
          return (
            <Input
              key={col.key}
              label={`Search ${col.label}`}
              value={filterValues[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              placeholder={`${col.label}`}
            />
          );
        })}
      </FilterCard>

      <DataTable
        serverSide={true}
        data={smpps}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={tableHeaders}
        isLoading={isLoading}
        headerActions={
          canCreate ? (
            <Button
              variant="primary"
              onClick={handleAdd}
              leftIcon={<Plus size={18} />}
            >
              Add Connectivity
            </Button>
          ) : null
        }
        renderRow={(item, index) => (
          <tr
            key={item.id || index}
            onContextMenu={(e) => handleContextMenu(e, item)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              let cellData = (item as any)[col.key];

              if (col.render) {
                return (
                  <td
                    key={col.key}
                    className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                  >
                    {col.render(item)}
                  </td>
                );
              }
              if (col.options) {
                const match = col.options.find(
                  (opt) => opt.value === String(cellData)
                );
                cellData = match ? match.label : cellData;
              }
              return (
                <td
                  key={col.key}
                  className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${
                    col.key === "smppHost"
                      ? "font-medium text-text-primary dark:text-white"
                      : ""
                  }`}
                >
                  {cellData || "-"}
                </td>
              );
            })}
          </tr>
        )}
      />

      <ContextMenu
        position={contextMenuPos}
        items={menuItems}
        onClose={() => setContextMenuPos(null)}
      />

      <SmppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSmpp}
        moduleName={routeName}
        editingSmpp={editingSmpp}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Config"
        message="Are you sure you want to delete this SMPP configuration? This action cannot be undone."
      />
    </div>
  );
};

export default Smpp;