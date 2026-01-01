import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Download } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import {
  getCompaniesApi,
  deleteCompanyApi,
  type CompanyData,
} from "../../api/companyApi/companyApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getStateApi } from "../../api/settingApi/stateApi/stateApi";
import { getCompanyCategoryApi } from "../../api/settingApi/companyCategoryApi/companyCategoryApi";
import { getCurrenciesApi } from "../../api/settingApi/currencyApi/currencyApi";
import { getEntityApi } from "../../api/settingApi/entityApi/entityApi";
import { getCompanyStatusApi } from "../../api/settingApi/companyStatusApi/companyStatusApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";
import { CompanyModal } from "../../components/modals/CompanyModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, {
  type FilterColumn,
} from "../../components/ui/AdvancedFilter";
import { DeleteModal } from "../../components/modals/DeleteModal";
import ViewButton from "../../components/ui/ViewButton";
import { companyCsv, downloadStatus } from "../../api/downloadApi/downloadApi";
import { usePagePermissions } from "../../hooks/usePagePermissions";

// --- Interfaces ---
interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: CompanyData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
}

// Default columns ONLY for the very first load
const DEFAULT_SEARCH_COLUMNS = ["name"];
const DEFAULT_TABLE_COLUMNS = ["name", "shortName", "companyEmail", "phone"];

const CompanyList: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Dropdown Options State ---
  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [statuses, setStatuses] = useState<Option[]>([]);
  const [currencies, setCurrencies] = useState<Option[]>([]);
  const [timeZones, setTimeZones] = useState<Option[]>([]);
  const [entities, setEntities] = useState<Option[]>([]);

  // --- FILTER 1: SEARCH COLUMNS (Input Fields) ---
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // --- FILTER 2: TABLE COLUMNS (Table Visibility) ---
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("company_table_columns");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved columns", e);
      }
    }
    return DEFAULT_TABLE_COLUMNS;
  });

  // Save Table Columns Preference
  useEffect(() => {
    localStorage.setItem("company_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  // --- Pagination ---
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "company";

  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Fetch Dropdowns ---
  useEffect(() => {
    const loadOptions = async (apiCall: any, module: string, setter: any) => {
      try {
        const res = await apiCall(module, 1, 1000);
        const list = res.results || (Array.isArray(res) ? res : []);
        setter(
          list.map((item: any) => ({
            label: item.name,
            value: String(item.id),
          }))
        );
      } catch (e) {
        console.error(`Failed to load ${module}`, e);
      }
    };

    loadOptions(getCountriesApi, "country", setCountries);
    loadOptions(getStateApi, "state", setStates);
    loadOptions(getCompanyCategoryApi, "companyCategory", setCategories);
    loadOptions(getCurrenciesApi, "currency", setCurrencies);
    loadOptions(getEntityApi, "entity", setEntities);
    if (typeof getCompanyStatusApi === "function")
      loadOptions(getCompanyStatusApi, "companyStatus", setStatuses);
    if (typeof getTimezoneApi === "function")
      loadOptions(getTimezoneApi, "timeZone", setTimeZones);
  }, []);

  // --- Helper for Badges ---
  const renderBooleanBadge = (value: boolean) => (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        value
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );

  const booleanOptions: Option[] = [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
  ];

  // --- Master Column Config ---
  const allColumns: ColumnConfig[] = [
    { key: "name", label: "Company Name", type: "text" },
    { key: "shortName", label: "Short Name", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "companyEmail", label: "Company Email", type: "text" },
    { key: "supportEmail", label: "Support Email", type: "text" },
    { key: "billingEmail", label: "Billing Email", type: "text" },
    { key: "ratesEmail", label: "Rates Email", type: "text" },
    { key: "lowBalanceAlertEmail", label: "Low Bal. Email", type: "text" },
    {
      key: "country",
      label: "Country",
      type: "text",
      options: countries,
      filterKey: "country__name__icontains",
    },
    {
      key: "state",
      label: "State",
      type: "text",
      options: states,
      filterKey: "state__name",
    },
    {
      key: "category",
      label: "Category",
      type: "text",
      options: categories,
      filterKey: "category__name",
    },
    {
      key: "status",
      label: "Status",
      type: "text",
      options: statuses,
      filterKey: "status__name",
    },
    {
      key: "currency",
      label: "Currency",
      type: "text",
      options: currencies,
      filterKey: "currency__name",
    },
    {
      key: "timeZone",
      label: "Time Zone",
      type: "text",
      options: timeZones,
      filterKey: "timeZone__name",
    },
    { key: "customerCreditLimit", label: "Cust. Credit", type: "number" },
    { key: "vendorCreditLimit", label: "Vend. Credit", type: "number" },
    { key: "balanceAlertAmount", label: "Bal. Alert", type: "number" },
    { key: "referencNumber", label: "Ref. Number", type: "text" },
    {
      key: "businessEntity",
      label: "Entity",
      type: "text",
      options: entities,
      filterKey: "businessEntity__name",
    },
    { key: "vatNumber", label: "VAT Number", type: "text" },
    { key: "address", label: "Address", type: "text" },
    {
      key: "validityPeriod",
      label: "Validity",
      type: "text",
      options: [
        { label: "Limited", value: "LTD" },
        { label: "Unlimited", value: "UNL" },
      ],
    },
    {
      key: "defaultEmail",
      label: "Default Email",
      type: "text",
      options: [
        { label: "Company", value: "CMP" },
        { label: "Support", value: "SUP" },
      ],
    },
    {
      key: "onlinePayment",
      label: "Online Payment",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.onlinePayment),
    },
    {
      key: "companyBlocked",
      label: "Blocked",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.companyBlocked),
    },
    {
      key: "allowWhiteListedCards",
      label: "Whitelist Cards",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.allowWhiteListedCards),
    },
    {
      key: "sendDailyReports",
      label: "Daily Reports",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.sendDailyReports),
    },
    {
      key: "allowNetting",
      label: "Netting",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.allowNetting),
    },
    {
      key: "showHlrApi",
      label: "HLR API",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.showHlrApi),
    },
    {
      key: "enableVendorPanel",
      label: "Vendor Panel",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.enableVendorPanel),
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

  const handleExport = async () => {
    try {
      const searchParam = filterValues["name"] || "";
      const data: any = await companyCsv(
        routeName,
        currentPage,
        rowsPerPage,
        searchParam
      );
      if (!data || !data.task_id) {
        toast.error("Failed to start export process.");
        return;
      }
      const taskId = data.task_id;
      let attempts = 0;
      const maxAttempts = 5;
      toast.info("Export started. Please wait");
      const checkStatus = setInterval(async () => {
        attempts += 1;
        try {
          const res = await downloadStatus(routeName, taskId);
          if (res && res.ready) {
            clearInterval(checkStatus);
            if (res.download_url) {
              window.location.href = res.download_url;
              toast.success("Export successful!");
            } else {
              toast.error("Export generated but URL is missing.");
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(checkStatus);
            toast.error("Export timed out. Please try again later.");
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            clearInterval(checkStatus);
            toast.error("Failed to check export status.");
          }
        }
      }, 2000);
    } catch (error) {
      toast.error("Failed to initiate export.");
    }
  };

  const fetchCompanies = async (overrideParams?: Record<string, any>) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;
    setIsLoading(true);
    try {
      const currentSearchParams: Record<string, string> = {};
      // Use SEARCH COLUMNS for filtering
      searchColumns.forEach((key) => {
        const value = filterValues[key];
        if (value) {
          const columnDef = allColumns.find((c) => c.key === key);
          if (columnDef?.options) {
            if (columnDef.filterKey) {
              const selectedOption = columnDef.options.find(
                (opt) => opt.value === value
              );
              currentSearchParams[columnDef.filterKey] = selectedOption
                ? selectedOption.label
                : value;
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
      if (overrideParams)
        Object.keys(overrideParams).forEach((key) => {
          currentSearchParams[key] = overrideParams[key];
        });

      const response: any = await getCompaniesApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams
      );
      if (newController.signal.aborted) return;
      if (response && response.results) {
        setCompanies(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setCompanies(response);
        setTotalItems(response.length);
      } else {
        setCompanies([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError")
        toast.error("Failed to fetch companies.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCompanies();
  };
  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCompanyApi(deleteId, routeName);
        toast.success("Company deleted.");
        fetchCompanies();
      } catch (error) {
        toast.error("Failed to delete company.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (company: CompanyData) => {
    if (!canUpdate) return;
    setEditingCompany(company);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleAdd = () => {
    if (!canCreate) return;
    setEditingCompany(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleView = (company: CompanyData) => {
    setEditingCompany(company);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const tableHeaders = [
    "S.N.",
    ...visibleTableFields.map((col) => col.label),
    "Actions",
  ];

  return (
    <div className="container mx-auto">
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Companies
          </h1>

          {/* 1. SEARCH FIELDS FILTER */}
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

          {/* 2. TABLE COLUMNS FILTER */}
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

        {/* RIGHT: Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Company</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          if (col.options) {
            return (
              <Select
                key={col.key}
                label={col.label}
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
              label={col.label}
              value={filterValues[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              placeholder={`Search ${col.label}`}
            />
          );
        })}
      </FilterCard>

      <DataTable
        serverSide={true}
        data={companies}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={tableHeaders}
        isLoading={isLoading}
        headerActions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              leftIcon={<Download size={18} />}
            >
              Export
            </Button>
            {canCreate ? (
              <Button
                variant="primary"
                onClick={handleAdd}
                leftIcon={<Plus size={18} />}
              >
                Add Company
              </Button>
            ) : null}
          </div>
        }
        renderRow={(company, index) => (
          <tr
            key={company.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>

            {visibleTableFields.map((col) => {
              let cellData = (company as any)[col.key];
              if (col.render) {
                return (
                  <td
                    key={col.key}
                    className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                  >
                    {col.render(company)}
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
                  className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                >
                  {cellData || "-"}
                </td>
              );
            })}

            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(company)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(company)}
                    title="Edit Company"
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(company.id!)}
                    title="Delete Company"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCompanies}
        moduleName={routeName}
        editingCompany={editingCompany}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone."
      />
    </div>
  );
};

export default CompanyList;
