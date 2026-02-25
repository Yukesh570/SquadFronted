import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCustomerRatesApi,
  deleteCustomerRateApi,
  type CustomerRateData,
} from "../../api/rateApi/customerRateApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";
import { CustomerRateModal } from "../../components/modals/Rate/CustomerRateModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
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
  render?: (data: CustomerRateData) => React.ReactNode;
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
  "MCC",
  "rate",
  "dateTime",
];

const CustomerRate: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();

  const [rates, setRates] = useState<CustomerRateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Dropdown Mappings ---
  const [countries, setCountries] = useState<Option[]>([]);
  const [timeZones, setTimeZones] = useState<Option[]>([]);
  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const [timezoneMap, setTimezoneMap] = useState<Record<string, string>>({});

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CustomerRateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedRowRate, setSelectedRowRate] =
    useState<CustomerRateData | null>(null);

  // --- Dynamic Filters & Columns State ---
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("customer_rate_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem(
      "customer_rate_table_columns",
      JSON.stringify(tableColumns)
    );
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "customer";
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

  // --- Fetch Dropdowns for Mapping & Search ---
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const countryRes: any = await getCountriesApi("country", 1, 1000);
        const cList = countryRes.results || (Array.isArray(countryRes) ? countryRes : []);
        const cMap: Record<string, string> = {};
        const cOptions = cList.map((c: any) => {
          cMap[String(c.id)] = c.name;
          return { label: c.name, value: String(c.id) };
        });
        setCountryMap(cMap);
        setCountries(cOptions);

        if (typeof getTimezoneApi === "function") {
          const tzRes: any = await getTimezoneApi("timezone", 1, 1000);
          const tList = tzRes.results || (Array.isArray(tzRes) ? tzRes : []);
          const tMap: Record<string, string> = {};
          const tOptions = tList.map((t: any) => {
            tMap[String(t.id)] = t.name;
            return { label: t.name, value: String(t.id) };
          });
          setTimezoneMap(tMap);
          setTimeZones(tOptions);
        }
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    loadDropdowns();
  }, []);

  const renderCountry = (rate: CustomerRateData) => {
    if ((rate as any).countryName) return (rate as any).countryName;
    return countryMap[String(rate.country)] || rate.country;
  };

  const renderTimezone = (rate: CustomerRateData) => {
    if ((rate as any).timeZoneName) return (rate as any).timeZoneName;
    return timezoneMap[String(rate.timeZone)] || rate.timeZone;
  };

  // --- Column Configuration ---
  const allColumns: ColumnConfig[] = [
    { key: "ratePlan", label: "RatePlan", type: "text", filterKey: "ratePlan__icontains" },
    { key: "country", label: "Country", type: "text", options: countries, filterKey: "country__name__icontains", render: renderCountry },
    { key: "countryCode", label: "Country Code", type: "number" },
    { key: "timeZone", label: "Time Zone", type: "text", options: timeZones, filterKey: "timeZone__name__icontains", render: renderTimezone },
    { key: "MCC", label: "MCC", type: "number" },
    { key: "rate", label: "Rate", type: "number" },
    { key: "currencyCode", label: "Currency Code", type: "text", filterKey: "currencyCode__icontains" },
    { key: "remark", label: "Remark", type: "text", filterKey: "remark__icontains" },
    { key: "dateTime", label: "Date Time", type: "date", render: (c) => (c.dateTime ? new Date(c.dateTime).toLocaleString() : "-") },
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
  const fetchRates = async (filters: Record<string, string> | null = null) => {
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
              // Sending Label for name-based lookup, or value for ID-based lookup
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

      const response: any = await getCustomerRatesApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams
      );

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setRates(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setRates(response);
        setTotalItems(response.length);
      } else {
        setRates([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error(error);
        toast.error("Failed to fetch customer rates.");
      }
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  // --- Handlers ---
  const handleSearch = () => {
    setCurrentPage(1);
    fetchRates();
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
    fetchRates({});
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCustomerRateApi(deleteId, routeName);
        toast.success("Customer rate deleted.");
        fetchRates();
      } catch (error) {
        toast.error("Failed to delete customer rate.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (rate: CustomerRateData) => {
    if (!canUpdate) return;
    setEditingRate(rate);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleAdd = () => {
    if (!canCreate) return;
    setEditingRate(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleView = (rate: CustomerRateData) => {
    setEditingRate(rate);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: CustomerRateData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowRate(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowRate
    ? [
        {
          label: "View Details",
          icon: <Eye size={16} />,
          onClick: () => handleView(selectedRowRate),
        },
        ...(canUpdate
          ? [
              {
                label: "Edit Rate",
                icon: <Edit size={16} />,
                onClick: () => handleEdit(selectedRowRate),
              },
            ]
          : []),
        ...(canDelete
          ? [
              {
                label: "Delete Rate",
                icon: <Trash size={16} />,
                variant: "danger" as const,
                onClick: () => setDeleteId(selectedRowRate.id!),
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
            Customer Rates
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
            Customer Rates
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
        data={rates}
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
              Add Customer Rate
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

      <CustomerRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRates}
        moduleName={routeName}
        editingRate={editingRate}
        isViewMode={isViewMode}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer Rate"
        message="Are you sure you want to delete this rate?"
      />
    </div>
  );
};

export default CustomerRate;