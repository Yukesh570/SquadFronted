import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getMappingSetupsApi,
  deleteMappingSetupApi,
  type MappingSetupData,
} from "../../api/mappingSetupApi/mappingSetupApi";
import { MappingSetupModal } from "../../components/modals/MappingSetupModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, {
  type FilterColumn,
} from "../../components/ui/AdvancedFilter";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import ContextMenu, {
  type ContextMenuItem,
} from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: MappingSetupData) => React.ReactNode;
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

const DEFAULT_SEARCH_COLUMNS = ["name", "country"];
const DEFAULT_TABLE_COLUMNS = [
  "name",
  "country",
  "countryCode",
  "timeZone",
  "network",
  "MCC",
  "MNC",
  "rate",
  "createdAt",
];

const MappingSetup: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [data, setData] = useState<MappingSetupData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MappingSetupData | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedRowMapping, setSelectedRowMapping] =
    useState<MappingSetupData | null>(null);

  // --- Filters ---
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS,
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("mappingsetup_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem(
      "mappingsetup_table_columns",
      JSON.stringify(tableColumns),
    );
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "mappingSetup";
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll(
          "aside a.active, nav a.active",
        );
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel =
          activeItem?.innerText?.split("\n")[0].trim() || "Module";
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  // EXACT MATCH TO DJANGO META FIELDS
  const allColumns: ColumnConfig[] = [
    {
      key: "name",
      label: "Name",
      type: "text",
      filterKey: "name__icontains",
    },
    {
      key: "country",
      label: "Country",
      type: "text",
      filterKey: "country__icontains",
    },
    {
      key: "countryCode",
      label: "Country Code",
      type: "text",
      filterKey: "countryCode__icontains",
    },
    {
      key: "timeZone",
      label: "Time Zone",
      type: "text",
      filterKey: "timeZone__icontains",
    },
    {
      key: "network",
      label: "Network",
      type: "text",
      filterKey: "network__icontains",
    },
    { key: "MCC", label: "MCC", type: "text", filterKey: "MCC__icontains" },
    { key: "MNC", label: "MNC", type: "text", filterKey: "MNC__icontains" },
    { key: "rate", label: "Rate", type: "text", filterKey: "rate__icontains" },
    {
      key: "effectiveFrom",
      label: "Effective From",
      type: "text",
      filterKey: "effectiveFrom__icontains",
    },

    // Only createdAt supports gt, lt, and range in this specific Meta
    {
      key: "createdAt",
      label: "Created At (Exact)",
      tableLabel: "Created At",
      type: "date",
      filterKey: "createdAt__date",
      render: (c: any) =>
        c.createdAt ? new Date(c.createdAt).toLocaleString() : "-",
    },
    {
      key: "createdAt__range",
      label: "Created At (From/To)",
      type: "date_range",
      filterKey: "createdAt",
      isSearchOnly: true,
    },
    {
      key: "createdAt__gt_lt",
      label: "Created At (After / Before)",
      type: "date_gt_lt",
      filterKey: "createdAt",
      isSearchOnly: true,
    },
  ];

  const visibleSearchFields = allColumns.filter((col) =>
    searchColumns.includes(col.key),
  );

  // ⚡️ Map columns according to custom reordered user preference
  const visibleTableFields = tableColumns
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is ColumnConfig => Boolean(col));

  const tableFilterColumns = allColumns
    .filter((c) => !c.isSearchOnly)
    .map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const fetchMappings = async (
    filters: Record<string, string> | null = null,
  ) => {
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
          const baseKey = columnDef?.filterKey
            ? columnDef.filterKey.split("__")[0]
            : key.split("__")[0];

          if (columnDef?.options) {
            const selectedOption = columnDef.options.find(
              (opt) => opt.value === value,
            );
            const isNameField =
              columnDef.filterKey?.includes("__name") ||
              columnDef.filterKey?.includes("__profileName");
            currentSearchParams[columnDef.filterKey || key] = selectedOption
              ? isNameField
                ? selectedOption.label
                : selectedOption.value
              : value;
          } else if (columnDef?.type === "date") {
            currentSearchParams[`${baseKey}__range`] =
              `${value}T00:00:00,${value}T23:59:59`;
          } else if (columnDef?.type === "date_range") {
            const [start, end] = value.split(",");
            if (start && end)
              currentSearchParams[`${baseKey}__range`] =
                `${start}T00:00:00,${end}T23:59:59`;
            else {
              if (start)
                currentSearchParams[`${baseKey}__gt`] = `${start}T00:00:00`;
              if (end)
                currentSearchParams[`${baseKey}__lt`] = `${end}T23:59:59`;
            }
          } else if (columnDef?.type === "date_gt_lt") {
            const [gt, lt] = value.split(",");
            if (gt) currentSearchParams[`${baseKey}__gt`] = `${gt}T23:59:59`;
            if (lt) currentSearchParams[`${baseKey}__lt`] = `${lt}00:00:00`;
          } else if (columnDef?.type === "text") {
            const filterKey = columnDef.filterKey || `${key}__icontains`;
            currentSearchParams[filterKey] = value;
          } else {
            currentSearchParams[columnDef?.filterKey || key] = value;
          }
        }
      });

      const response = await getMappingSetupsApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams,
      );

      if (newController.signal.aborted) return;
      if (response && response.results) {
        setData(response.results);
        setTotalItems(response.count);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch mappings.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMappings();
  };
  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
    fetchMappings({});
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteMappingSetupApi(deleteId, routeName);
        toast.success("Mapping deleted.");
        fetchMappings();
      } catch (error) {
        toast.error("Failed to delete mapping.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (item: MappingSetupData) => {
    if (!canUpdate) return;
    setEditingMapping(item);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleAdd = () => {
    if (!canCreate) return;
    setEditingMapping(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleView = (item: MappingSetupData) => {
    setEditingMapping(item);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent, item: MappingSetupData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowMapping(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowMapping
    ? [
        {
          label: "View Details",
          icon: <Eye size={16} />,
          onClick: () => handleView(selectedRowMapping),
        },
        ...(canUpdate
          ? [
              {
                label: "Edit Setup",
                icon: <Edit size={16} />,
                onClick: () => handleEdit(selectedRowMapping),
              },
            ]
          : []),
        ...(canDelete
          ? [
              {
                label: "Delete Setup",
                icon: <Trash size={16} />,
                variant: "danger" as const,
                onClick: () => setDeleteId(selectedRowMapping.id!),
              },
            ]
          : []),
      ]
    : [];

  const getBaseLabel = (label: string) => label.split(" (")[0].trim();
  const tableHeaders = [
    "S.N.",
    ...visibleTableFields.map((col) => col.tableLabel || col.label),
  ];

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Mapping Setup
          </h1>
          <div className="relative z-20">
            <AdvancedFilter
              columns={tableFilterColumns}
              selectedColumns={tableColumns}
              onFilter={setTableColumns}
              onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
              buttonLabel="Columns"
              enableReorder={true}
            />
          </div>
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
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Mapping Setup
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          const baseLabel = getBaseLabel(col.label);
          if (col.options)
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
          if (col.type === "date")
            return (
              <DatePicker
                key={col.key}
                label={`Search ${baseLabel}`}
                selected={
                  filterValues[col.key] ? new Date(filterValues[col.key]) : null
                }
                onChange={(val: Date | null) =>
                  handleFilterChange(col.key, val ? formatLocalDate(val) : "")
                }
              />
            );
          if (col.type === "date_range") {
            const [startStr, endStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${baseLabel} (From)`}
                  selected={startStr ? new Date(startStr) : null}
                  onChange={(val: Date | null) => {
                    const newStart = val ? formatLocalDate(val) : "";
                    const currentEnd = endStr || "";
                    handleFilterChange(
                      col.key,
                      newStart || currentEnd ? `${newStart},${currentEnd}` : "",
                    );
                  }}
                />
                <DatePicker
                  label={`Search ${baseLabel} (To)`}
                  selected={endStr ? new Date(endStr) : null}
                  onChange={(val: Date | null) => {
                    const newEnd = val ? formatLocalDate(val) : "";
                    const currentStart = startStr || "";
                    handleFilterChange(
                      col.key,
                      currentStart || newEnd ? `${currentStart},${newEnd}` : "",
                    );
                  }}
                />
              </React.Fragment>
            );
          }
          if (col.type === "date_gt_lt") {
            const [gtStr, ltStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${baseLabel} (> After)`}
                  selected={gtStr ? new Date(gtStr) : null}
                  onChange={(val: Date | null) => {
                    const newGt = val ? formatLocalDate(val) : "";
                    const currentLt = ltStr || "";
                    handleFilterChange(
                      col.key,
                      newGt || currentLt ? `${newGt},${currentLt}` : "",
                    );
                  }}
                />
                <DatePicker
                  label={`Search ${baseLabel} (< Before)`}
                  selected={ltStr ? new Date(ltStr) : null}
                  onChange={(val: Date | null) => {
                    const newLt = val ? formatLocalDate(val) : "";
                    const currentGt = gtStr || "";
                    handleFilterChange(
                      col.key,
                      currentGt || newLt ? `${currentGt},${newLt}` : "",
                    );
                  }}
                />
              </React.Fragment>
            );
          }
          return (
            <Input
              key={col.key}
              type={col.type || "text"}
              label={`Search ${baseLabel}`}
              value={filterValues[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              placeholder={`${baseLabel}`}
            />
          );
        })}
      </FilterCard>

      <DataTable
        serverSide={true}
        data={data}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        density="compact"
        headers={tableHeaders}
        isLoading={isLoading}
        onReorderColumns={(fromIdx, toIdx) => {
          setTableColumns((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            return next;
          });
        }}
        headerActions={
          canCreate ? (
            <Button
              variant="primary"
              onClick={handleAdd}
              leftIcon={<Plus size={18} />}
            >
              Add Mapping Setup
            </Button>
          ) : null
        }
        renderRow={(item: MappingSetupData, index: number) => (
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
              if (col.render)
                return (
                  <td
                    key={col.key}
                    className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                  >
                    {col.render(item)}
                  </td>
                );
              if (col.options) {
                const match = col.options.find(
                  (opt) => opt.value === String(cellData),
                );
                cellData = match ? match.label : cellData;
              }
              return (
                <td
                  key={col.key}
                  className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${col.key === "name" ? "font-medium text-text-primary dark:text-white" : ""}`}
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
      <MappingSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMappings}
        moduleName={routeName}
        editingMapping={editingMapping}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Mapping Setup"
        message="Are you sure you want to delete this mapping setup? This action cannot be undone."
      />
    </div>
  );
};

export default MappingSetup;