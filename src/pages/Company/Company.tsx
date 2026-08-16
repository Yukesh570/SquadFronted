import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Download, Eye } from "lucide-react";
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
import { getCompanyStatusApi } from "../../api/settingApi/companyStatusApi/companyStatusApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";
import { CompanyModal } from "../../components/modals/CompanyModal";
import { CreditTransactionHistoryModal } from "../../components/modals/Credit/CreditTransactionHistoryModal";
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
import { companyCsv, downloadStatus } from "../../api/downloadApi/downloadApi";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import ContextMenu, {
  type ContextMenuItem,
} from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";
import { CountryFlag } from "../../components/ui/CountryFlag";

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: CompanyData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchOnly?: boolean;
  isSearchable?: boolean;
  tableLabel?: string;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_SEARCH_COLUMNS = ["name", "countryName", "currency"];
const DEFAULT_TABLE_COLUMNS = [
  "name",
  "shortName",
  "accountManagerName",
  "companyEmail",
  "phone",
  "currency",
  "customerCreditLimit",
  "vendorCreditLimit",
];

const CompanyList: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryCompanyId, setSelectedHistoryCompanyId] = useState<number | null>(null);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedRowCompany, setSelectedRowCompany] = useState<CompanyData | null>(null);

  // --- Dropdown Options ---
  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [statuses, setStatuses] = useState<Option[]>([]);
  const [currencies, setCurrencies] = useState<Option[]>([]);
  const [timeZones, setTimeZones] = useState<Option[]>([]);

  // --- Filters ---
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS,
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("company_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("company_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(50);
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
            ...(item.iso2 && module === "country" ? { icon: <CountryFlag iso2={item.iso2} /> } : {})
          })),
        );
      } catch (e) {
        console.error(`Failed to load ${module}`, e);
      }
    };
    loadOptions(getCountriesApi, "country", setCountries);
    loadOptions(getStateApi, "state", setStates);
    loadOptions(getCompanyCategoryApi, "companyCategory", setCategories);
    loadOptions(getCurrenciesApi, "currency", setCurrencies);
    if (typeof getCompanyStatusApi === "function")
      loadOptions(getCompanyStatusApi, "companyStatus", setStatuses);
    if (typeof getTimezoneApi === "function")
      loadOptions(getTimezoneApi, "timeZone", setTimeZones);
  }, []);


  const allColumns: ColumnConfig[] = [
    { key: "name", label: "Company Name", type: "text", filterKey: "name__icontains" },
    { key: "shortName", label: "Short Name", type: "text", filterKey: "shortName__icontains" },
    { key: "accountManagerName", label: "Account Manager", type: "text", filterKey: "accountManager__username__icontains" },
    { key: "phone", label: "Phone", type: "text", filterKey: "phone__icontains" },
    { key: "companyEmail", label: "Company Email", type: "text", filterKey: "companyEmail__icontains" },
    { key: "usedCustomerCredit", label: "Used Customer Credit", type: "text", filterKey: "usedCustomerCredit__icontains" },
    { key: "usedVendorCredit", label: "Used Vendor Credit", type: "text", filterKey: "usedVendorCredit__icontains" },

    { key: "supportEmail", label: "Support Email", type: "text", filterKey: "supportEmail__icontains" },
    { key: "billingEmail", label: "Billing Email", type: "text", filterKey: "billingEmail__icontains" },
    { key: "amEmail", label: "AM Email", type: "text", filterKey: "amEmail__icontains" },
    { key: "ratesEmail", label: "Rates Email", type: "text", filterKey: "ratesEmail__icontains" },
    { key: "lowBalanceAlertEmail", label: "Low Bal. Email", type: "text", filterKey: "lowBalanceAlertEmail__icontains" },
    {
      key: "country",
      label: "Country",
      type: "text",
      options: countries,
      filterKey: "country__name__icontains",
      render: (c: any) => {
        const match = countries.find((opt: any) => opt.value === String(c.country));
        const countryName = match ? match.label : c.country;
        return (
          <div className="flex items-center gap-1.5">
            {match?.icon}
            <span>{countryName}</span>
          </div>
        );
      }
    },
    {
      key: "state",
      label: "State",
      type: "text",
      options: states,
      filterKey: "state__name__icontains",
    },
    {
      key: "category",
      label: "Category",
      type: "text",
      options: categories,
      filterKey: "category__name__icontains",
    },
    {
      key: "status",
      label: "Status",
      type: "text",
      options: statuses,
      filterKey: "status__name__icontains",
    },
    {
      key: "currency",
      label: "Currency",
      type: "text",
      options: currencies,
      filterKey: "currency__name__icontains",
    },
    {
      key: "timeZone",
      label: "Time Zone",
      type: "text",
      options: timeZones,
      filterKey: "timeZone__name__icontains",
    },
    { key: "customerCreditLimit", label: "Cust. Credit", type: "number", filterKey: "customerCreditLimit" },
    { key: "vendorCreditLimit", label: "Vend. Credit", type: "number", filterKey: "vendorCreditLimit" },
    { key: "balanceAlertAmount", label: "Bal. Alert", type: "number", filterKey: "balanceAlertAmount" },
    { key: "referencNumber", label: "Ref. Number", type: "text", filterKey: "referencNumber__icontains" },
    { key: "address", label: "Address", type: "text", filterKey: "address__icontains" },
    // {
    //   key: "validityPeriod",
    //   label: "Validity",
    //   type: "text",
    //   options: [
    //     { label: "Limited", value: "LTD" },
    //     { label: "Unlimited", value: "UNL" },
    //   ],
    //   filterKey: "validityPeriod",
    // },
    // {
    //   key: "defaultEmail",
    //   label: "Default Email",
    //   type: "text",
    //   options: [
    //     { label: "Company", value: "CMP" },
    //     { label: "Support", value: "SUP" },
    //   ],
    //   filterKey: "defaultEmail",
    // },
    // {
    //   key: "onlinePayment",
    //   label: "Online Payment",
    //   type: "boolean",
    //   options: booleanOptions,
    //   filterKey: "onlinePayment",
    //   render: (c) => renderBooleanBadge(c.onlinePayment),
    // },
    // {
    //   key: "companyBlocked",
    //   label: "Blocked",
    //   type: "boolean",
    //   options: booleanOptions,
    //   filterKey: "companyBlocked",
    //   render: (c) => renderBooleanBadge(c.companyBlocked),
    // },
    // {
    //   key: "allowWhiteListedCards",
    //   label: "Whitelist Cards",
    //   type: "boolean",
    //   options: booleanOptions,
    //   filterKey: "allowWhiteListedCards",
    //   render: (c) => renderBooleanBadge(c.allowWhiteListedCards),
    // },
    // {
    //   key: "sendDailyReports",
    //   label: "Daily Reports",
    //   type: "boolean",
    //   options: booleanOptions,
    //   filterKey: "sendDailyReports",
    //   render: (c) => renderBooleanBadge(c.sendDailyReports),
    // },
    // {
    //   key: "allowNetting",
    //   label: "Netting",
    //   type: "boolean",
    //   options: booleanOptions,
    //   filterKey: "allowNetting",
    //   render: (c) => renderBooleanBadge(c.allowNetting),
    // },
    // {
    //   key: "showHlrApi",
    //   label: "HLR API",
    //   type: "boolean",
    //   options: booleanOptions,
    //   filterKey: "showHlrApi",
    //   render: (c) => renderBooleanBadge(c.showHlrApi),
    // },
    // {
    //   key: "enableVendorPanel",
    //   label: "Vendor Panel",
    //   type: "boolean",
    //   options: booleanOptions,
    //   filterKey: "enableVendorPanel",
    //   render: (c) => renderBooleanBadge(c.enableVendorPanel),
    // },
  ];

  const searchableColumns = allColumns.filter((col) => col.isSearchable !== false);
  const visibleSearchFields = searchableColumns.filter((col) =>
    searchColumns.includes(col.key),
  );

  const visibleTableFields = tableColumns
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is ColumnConfig => Boolean(col));

  const tableFilterColumns = allColumns
    .filter((c) => !c.isSearchOnly)
    .map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const fetchCompanies = async (
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
          if (columnDef?.options) {
            if (columnDef.filterKey) {
              const selectedOption = columnDef.options.find(
                (opt) => opt.value === value,
              );
              currentSearchParams[columnDef.filterKey] = selectedOption
                ? (columnDef.type === "boolean" ? selectedOption.value : selectedOption.label)
                : value;
            } else {
              currentSearchParams[key] = value;
            }
          } else if (columnDef?.type === "text") {
            currentSearchParams[columnDef.filterKey || `${key}__icontains`] = value;
          } else {
            currentSearchParams[columnDef?.filterKey || key] = value;
          }
        }
      });

      const response: any = await getCompaniesApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams,
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
    fetchCompanies({});
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

  // --- Context Menu ---
  const handleContextMenu = (e: React.MouseEvent, company: CompanyData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowCompany(company);
  };

  const menuItems: ContextMenuItem[] = selectedRowCompany
    ? [
      {
        label: "View Details",
        icon: <Eye size={16} />,
        onClick: () => handleView(selectedRowCompany),
      },
      ...(canUpdate
        ? [
          {
            label: "Edit Company",
            icon: <Edit size={16} />,
            onClick: () => handleEdit(selectedRowCompany),
          },
        ]
        : []),
      {
        label: "Credit History",
        icon: <Eye size={16} />,
        onClick: () => {
          setSelectedHistoryCompanyId(selectedRowCompany.id ?? null);
          setIsHistoryModalOpen(true);
        },
      },
      ...(canDelete
        ? [
          {
            label: "Delete Company",
            icon: <Trash size={16} />,
            variant: "danger" as const,
            onClick: () => setDeleteId(selectedRowCompany.id!),
          },
        ]
        : []),
    ]
    : [];

  const handleExport = async () => {
    try {
      const searchParam = filterValues["name"] || "";
      const data: any = await companyCsv(
        routeName,
        currentPage,
        rowsPerPage,
        searchParam,
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
            toast.error("Export timed out.");
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            clearInterval(checkStatus);
            toast.error("Failed to check status.");
          }
        }
      }, 2000);
    } catch (error) {
      toast.error("Failed to initiate export.");
    }
  };

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.tableLabel || col.label)];

  const getBaseLabel = (label: string) => {
    if (!label) return "";
    return label.split(" (")[0].trim();
  };

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

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Companies
          </h1>
          <div className="relative z-20">
            <AdvancedFilter
              columns={tableFilterColumns}
              selectedColumns={tableColumns}
              defaultColumns={DEFAULT_TABLE_COLUMNS}
              onFilter={setTableColumns}
              onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
              buttonLabel="Columns"
              enableReorder={true}
            />
          </div>
          <div className="relative z-20">
            <AdvancedFilter
              columns={searchableColumns}
              selectedColumns={searchColumns}
              defaultColumns={DEFAULT_SEARCH_COLUMNS}
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
          <span className="text-text-primary dark:text-white">Company</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          const baseLabel = getBaseLabel(col.label || "");
          if (col.options) {
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
          }
          if (col.type === "date") {
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
          }
          return (
            <Input
              key={col.key}
              label={`Search ${baseLabel}`}
              value={filterValues[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              placeholder={`Search ${baseLabel}`}
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
        density="compact"
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
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              leftIcon={<Download size={18} />}
            >
              Export
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                onClick={handleAdd}
                leftIcon={<Plus size={18} />}
              >
                Add Company
              </Button>
            )}
          </div>
        }
        renderRow={(company, index) => (
          <tr
            key={company.id || index}
            onContextMenu={(e) => handleContextMenu(e, company)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              let cellData = (company as any)[col.key];
              if (col.render)
                return (
                  <td
                    key={col.key}
                    className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                  >
                    {col.render(company)}
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
                  className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
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

      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCompanies()}
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
      <CreditTransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        companyId={selectedHistoryCompanyId}
        moduleName={routeName}
      />
    </div>
  );
};

export default CompanyList;