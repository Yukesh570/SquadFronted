import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getMappingSetupsApi,
  deleteMappingSetupApi,
  type MappingSetupData,
} from "../../api/mappingSetupApi/mappingSetupApi";

// --- Added APIs for Dropdowns ---
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";

import { MappingSetupModal } from "../../components/modals/MappingSetupModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker"; // Added DatePicker
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

// --- Interfaces ---
interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: MappingSetupData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
}

// --- Default Configuration ---
const DEFAULT_SEARCH_COLUMNS = ["ratePlan"];
const DEFAULT_TABLE_COLUMNS = [
  "ratePlan",
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

  // --- Dropdown States ---
  const [countries, setCountries] = useState<Option[]>([]);
  const [timeZones, setTimeZones] = useState<Option[]>([]);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MappingSetupData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedRowMapping, setSelectedRowMapping] =
    useState<MappingSetupData | null>(null);

  // --- Dynamic Filters & Columns State ---
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("mapping_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("mapping_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "mappingSetup";
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Tracking ---
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

  // --- Fetch Dropdowns for Search ---
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const countryRes: any = await getCountriesApi("country", 1, 1000);
        const cList = countryRes.results || (Array.isArray(countryRes) ? countryRes : []);
        setCountries(cList.map((c: any) => ({ label: c.name, value: String(c.id) })));

        if (typeof getTimezoneApi === "function") {
          const tzRes: any = await getTimezoneApi("timezone", 1, 1000);
          const tList = tzRes.results || (Array.isArray(tzRes) ? tzRes : []);
          setTimeZones(tList.map((t: any) => ({ label: t.name, value: String(t.id) })));
        }
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    loadDropdowns();
  }, []);

  // --- Column Configuration ---
  const allColumns: ColumnConfig[] = [
    { key: "ratePlan", label: "RatePlan", type: "text", filterKey: "ratePlan__icontains" },
    { key: "country", label: "Country", type: "text", options: countries, filterKey: "country__name__icontains" },
    { key: "countryCode", label: "Country Code", type: "text", filterKey: "countryCode__icontains" },
    { key: "timeZone", label: "Time Zone", type: "text", options: timeZones, filterKey: "timeZone__name__icontains" },
    { key: "network", label: "Network", type: "text", filterKey: "network__icontains" },
    { key: "MCC", label: "MCC", type: "text", filterKey: "MCC__icontains" },
    { key: "MNC", label: "MNC", type: "text", filterKey: "MNC__icontains" },
    { key: "rate", label: "Rate", type: "text", filterKey: "rate__icontains" },
    {
      key: "createdAt",
      label: "Created At",
      type: "date",
      render: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"),
    },
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
  const fetchMappings = async (filters: Record<string, string> | null = null) => {
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
              // Send label for search if backend uses names, or value if it uses IDs
              currentSearchParams[columnDef.filterKey] = selectedOption
                ? selectedOption.label 
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

      const response: any = await getMappingSetupsApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams
      );

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setData(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setData(response);
        setTotalItems(response.length);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Fetch error:", error);
        toast.error("Failed to fetch mappings.");
      }
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

  // --- Handlers ---
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

  // --- Context Menu Handler ---
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

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.label)];

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Mapping Setup
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
          <span className="text-text-primary dark:text-white">
            Mapping Setup
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          if (col.options) {
            return (
              <Select
                key={col.key}
                label={`Search by ${col.label}`}
                value={filterValues[col.key] || ""}
                onChange={(val) => handleFilterChange(col.key, val)}
                options={col.options}
                placeholder={`Select ${col.label}`}
              />
            );
          }
          if (col.type === "date") {
            return (
              <DatePicker
                key={col.key}
                label={`Select ${col.label}`}
                // Convert string back to Date object for the DatePicker
                selected={filterValues[col.key] ? new Date(filterValues[col.key]) : null}
                // Convert Date object back to YYYY-MM-DD string for the filter state
                onChange={(val: Date | null) => 
                  handleFilterChange(col.key, val ? val.toISOString().split('T')[0] : "")
                }
              />
            );
          }
          return (
            <Input
              key={col.key}
              label={`Search by ${col.label}`}
              value={filterValues[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              placeholder={`${col.label}`}
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
        headers={tableHeaders}
        isLoading={isLoading}
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
              // Render Option Labels instead of IDs if it's a dropdown column
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
                    col.key === "ratePlan"
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