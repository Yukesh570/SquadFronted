import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye, RefreshCw } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getVendorsApi,
  deleteVendorApi,
  type VendorData,
  updateVendorApi,
} from "../../../api/connectivityApi/vendorApi";
import { getCompaniesApi } from "../../../api/companyApi/companyApi";

// @ts-ignore
import { getVendorRatesApi } from "../../../api/rateApi/vendorRateApi";

import { VendorModal } from "../../../components/modals/Connectivity/VendorModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import DatePicker from "../../../components/ui/DatePicker";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import AdvancedFilter, {
  type FilterColumn,
} from "../../../components/ui/AdvancedFilter";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ContextMenu, {
  type ContextMenuItem,
} from "../../../components/ui/ContextMenu";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import { actionHelper } from "../../../helper/action";

interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: VendorData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchOnly?: boolean;
  tableLabel?: string;
}

const DEFAULT_SEARCH_COLUMNS = ["profileName", "companyName", "connectionType"];
const DEFAULT_TABLE_COLUMNS = [
  "profileName",
  "companyName",
  "ratePlanName",
  "connectionType",
  "invoicePolicy",
  "bindStatus",
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Vendor: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();

  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Dropdown States ---
  const [companies, setCompanies] = useState<Option[]>([]);
  const [ratePlanOptions, setRatePlanOptions] = useState<Option[]>([]);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedRowVendor, setSelectedRowVendor] = useState<VendorData | null>(
    null,
  );

  // --- Dynamic Filters & Columns State ---
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS,
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("vendor_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("vendor_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "vendor";
  const abortControllerRef = useRef<AbortController | null>(null);

  // ✅ FIX: Track whether the component is currently mounted
  // This prevents the WebSocket onclose from forcing OFFLINE
  // when the user simply navigates away (which also closes the socket)
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      // When user navigates away, flip to false BEFORE the socket closes
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const compRes: any = await getCompaniesApi("company", 1, 1000);
        const list = compRes.results || (Array.isArray(compRes) ? compRes : []);
        setCompanies(
          list.map((c: any) => ({ label: c.name, value: String(c.id) })),
        );
      } catch (err: any) {
        console.error("Failed to load companies for filter", err);
      }

      try {
        const rateRes: any = await getVendorRatesApi("vendorRate", 1, 1000);
        const rateList =
          rateRes.results || (Array.isArray(rateRes) ? rateRes : []);
        setRatePlanOptions(
          rateList.map((r: any) => ({
            label: r.ratePlan || r.ratePlanName || r.name,
            value: r.ratePlan || r.ratePlanName || r.name,
          })),
        );
      } catch (err: any) {
        console.error("Failed to load vendor rates for filter", err);
      }
    };
    loadDropdowns();
  }, []);

  // --- ✅ FIXED WebSocket for Vendor SMPP Status ---
  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    const ws = new WebSocket(`${wsBase}/ws/status/`);

    ws.onopen = () => console.log("✅ Vendor Table linked to live SMPP feed");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.action === "vendor_state_update") {
          setVendors((prev) =>
            prev.map((v) =>
              String(v.id) === String(data.vendor.id)
                ? {
                    ...v,
                    bindStatus: data.vendor.bindStatus,
                    active_session_count: data.vendor.live_count,
                  }
                : v,
            ),
          );
        }
      } catch (err) {
        console.error("Socket error", err);
      }
    };

    ws.onclose = () => {
      console.log("⚠️ Live SMPP feed disconnected");

      // ✅ FIX: Only force OFFLINE if the component is still mounted.
      // If isMountedRef.current is false, the user navigated away and
      // React unmounted this component — the socket closing is expected
      // and normal. We do NOT want to overwrite the API data with OFFLINE.
      // If isMountedRef.current is true, the socket genuinely died while
      // the user is still on the page — force OFFLINE so they know the
      // live feed is dead.
      if (isMountedRef.current) {
        setVendors((prev) =>
          prev.map((v) => ({
            ...v,
            bindStatus: "OFFLINE",
            active_session_count: 0,
          })),
        );
      }
    };

    return () => ws.close();
  }, []);

  // --- Static Options & Renders ---
  const connectionTypeOptions: Option[] = [
    { label: "SMPP", value: "SMPP" },
    { label: "HTTP", value: "HTTP" },
  ];

  const invoicePolicyOptions: Option[] = [
    { label: "On Attempt", value: "ON ATTEMPT" },
    { label: "On Submit", value: "ON SUBMIT" },
    { label: "On Delivered", value: "ON DELIVERED" },
  ];

  const bindStatusOptions: Option[] = [
    { label: "online", value: "ONLINE" },
    { label: "offline", value: "OFFLINE" },
  ];

  const logLevelOptions: Option[] = [
    { label: "DEBUG", value: "DEBUG" },
    { label: "INFO", value: "INFO" },
    { label: "WARNING", value: "WARNING" },
    { label: "ERROR", value: "ERROR" },
    { label: "CRITICAL", value: "CRITICAL" },
  ];

  const renderBindStatusBadge = (status?: string) => {
    if (!status) return "-";
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === "ONLINE"
            ? "bg-green-100 text-green-800"
            : status === "OFFLINE"
              ? "bg-red-200 text-red-800"
              : "bg-red-200 text-red-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const renderSessionBadge = (vendor: any) => {
    const current = vendor.active_session_count || 0;
    const max = vendor.vendorPolicy?.maxSession || 1;
    const isFull = current === max && max > 0;

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          isFull
            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        {current}/{max}
      </span>
    );
  };

  const allColumns: ColumnConfig[] = [
    {
      key: "profileName",
      label: "Profile Name",
      type: "text",
      filterKey: "profileName__icontains",
    },
    {
      key: "companyName",
      label: "Company",
      type: "text",
      options: companies,
      filterKey: "company",
    },
    {
      key: "ratePlanName",
      label: "Rate Plan",
      type: "text",
      options: ratePlanOptions,
      filterKey: "ratePlanName",
    },
    {
      key: "connectionType",
      label: "Connection Type",
      type: "text",
      options: connectionTypeOptions,
    },
    {
      key: "invoicePolicy",
      label: "Invoice Policy",
      type: "text",
      options: invoicePolicyOptions,
    },
    {
      key: "smppName",
      label: "SMPP Name",
      type: "text",
      filterKey: "smppName__icontains",
    },
    {
      key: "bindStatus",
      label: "Bind Status",
      type: "text",
      options: bindStatusOptions,
      render: (c) => renderBindStatusBadge(c.bindStatus),
    },
    {
      key: "session",
      label: "Sessions (Current/Max)",
      tableLabel: "Sessions",
      type: "text",
      render: (c) => renderSessionBadge(c),
    },
    {
      key: "maxSession",
      label: "Max Sessions",
      type: "number",
      render: (c) => c.vendorPolicy?.maxSession ?? "-",
    },
    {
      key: "rateTps",
      label: "Rate TPS",
      type: "number",
      render: (c) => c.vendorPolicy?.rateTps ?? "-",
    },
    {
      key: "sendQueueLimit",
      label: "Queue Limit",
      type: "number",
      render: (c) => c.vendorPolicy?.sendQueueLimit ?? "-",
    },
    {
      key: "logLevel",
      label: "Log Level",
      type: "text",
      options: logLevelOptions,
      render: (c) => c.vendorPolicy?.logLevel ?? "-",
    },
    {
      key: "responseTimeout",
      label: "Response Timeout (s)",
      type: "number",
      render: (c) => c.vendorPolicy?.responseTimeout ?? "-",
    },
    {
      key: "enquireLinkInterval",
      label: "Enquire Link Interval (s)",
      type: "number",
      render: (c) => c.vendorPolicy?.enquireLinkInterval ?? "-",
    },
    {
      key: "connectionTimeout",
      label: "Conn. Timeout (s)",
      type: "number",
      render: (c) => c.vendorPolicy?.connectionTimeout ?? "-",
    },
    {
      key: "connectionRetryDelay",
      label: "Conn Retry Delay (s)",
      type: "number",
      render: (c) => c.vendorPolicy?.connectionRetryDelay ?? "-",
    },
    {
      key: "connectionRetryCount",
      label: "Conn Retry Count",
      type: "number",
      render: (c) => c.vendorPolicy?.connectionRetryCount ?? "-",
    },
    {
      key: "bindRetryDelay",
      label: "Bind Retry Delay (s)",
      type: "number",
      render: (c) => c.vendorPolicy?.bindRetryDelay ?? "-",
    },
    {
      key: "bindRetryCount",
      label: "Bind Retry Count",
      type: "number",
      render: (c) => c.vendorPolicy?.bindRetryCount ?? "-",
    },
    {
      key: "connectionRecoveryDelay",
      label: "Conn Recovery Delay (s)",
      type: "number",
      render: (c) => c.vendorPolicy?.connectionRecoveryDelay ?? "-",
    },
    {
      key: "tlvTag",
      label: "TLV Tag",
      type: "text",
      render: (c) => c.vendorPolicy?.tlvTag ?? "-",
    },
  ];

  const visibleSearchFields = allColumns.filter((col) =>
    searchColumns.includes(col.key),
  );
  const visibleTableFields = allColumns.filter((col) =>
    tableColumns.includes(col.key),
  );

  const tableFilterColumns = allColumns
    .filter((c) => !c.isSearchOnly)
    .map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const fetchVendors = async (
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
            const selectedOption = columnDef.options.find(
              (opt) => opt.value === value,
            );
            currentSearchParams[columnDef.filterKey || key] = selectedOption
              ? selectedOption.value
              : value;
          } else if (columnDef?.type === "date") {
            currentSearchParams[`${key}__range`] =
              `${value}T00:00:00,${value}T23:59:59`;
          } else if (columnDef?.type === "date_range") {
            const baseKey = key.split("__")[0];
            const [start, end] = value.split(",");
            if (start && end) {
              currentSearchParams[key] = `${start}T00:00:00,${end}T23:59:59`;
            } else {
              if (start)
                currentSearchParams[`${baseKey}__gt`] = `${start}T00:00:00`;
              if (end)
                currentSearchParams[`${baseKey}__lt`] = `${end}T23:59:59`;
            }
          } else if (columnDef?.type === "date_gt_lt") {
            const baseKey = key.replace("__gt_lt", "");
            const [gt, lt] = value.split(",");
            if (gt) currentSearchParams[`${baseKey}__gt`] = `${gt}T23:59:59`;
            if (lt) currentSearchParams[`${baseKey}__lt`] = `${lt}T00:00:00`;
          } else if (columnDef?.type === "number_range") {
            const baseKey = key.split("__")[0];
            const [start, end] = value.split(",");
            if (start && end) {
              currentSearchParams[key] = value;
            } else {
              if (start) currentSearchParams[`${baseKey}__gt`] = start;
              if (end) currentSearchParams[`${baseKey}__lt`] = end;
            }
          } else if (columnDef?.type === "number_gt_lt") {
            const baseKey = key.replace("__gt_lt", "");
            const [gt, lt] = value.split(",");
            if (gt) currentSearchParams[`${baseKey}__gt`] = gt;
            if (lt) currentSearchParams[`${baseKey}__lt`] = gt;
          } else if (columnDef?.type === "text") {
            const filterKey = columnDef.filterKey || `${key}__icontains`;
            currentSearchParams[filterKey] = value;
          } else {
            currentSearchParams[columnDef?.filterKey || key] = value;
          }
        }
      });

      const response: any = await getVendorsApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams,
      );

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setVendors(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setVendors(response);
        setTotalItems(response.length);
      } else {
        setVendors([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch vendors.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVendors();
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
    fetchVendors({});
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteVendorApi(deleteId, routeName);
        toast.success("Vendor deleted.");
        fetchVendors();
      } catch (error) {
        toast.error("Failed to delete vendor.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (vendor: VendorData) => {
    if (!canUpdate) return;
    setEditingVendor(vendor);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingVendor(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (vendor: VendorData) => {
    setEditingVendor(vendor);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent, vendor: VendorData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowVendor(vendor);
  };

  const handleManualRetry = async (vendor: VendorData) => {
    try {
      const retryData = {
        lastRetryAt: new Date().toISOString(),
      };
      await updateVendorApi(vendor.id!, retryData, routeName);
      toast.info(`Connection retry signaled for ${vendor.profileName}`);
      setContextMenuPos(null);
    } catch (err) {
      console.error("Manual retry failed", err);
      toast.error("Failed to send retry signal.");
    }
  };

  const menuItems: ContextMenuItem[] = selectedRowVendor
    ? [
        {
          label: "View Details",
          icon: <Eye size={16} />,
          onClick: () => handleView(selectedRowVendor),
        },
        ...(selectedRowVendor.bindStatus === "OFFLINE"
          ? [
              {
                label: "Retry Bind",
                icon: <RefreshCw size={16} />,
                onClick: () => handleManualRetry(selectedRowVendor),
              },
            ]
          : []),
        ...(canUpdate
          ? [
              {
                label: "Edit Vendor",
                icon: <Edit size={16} />,
                onClick: () => handleEdit(selectedRowVendor),
              },
            ]
          : []),
        ...(canDelete
          ? [
              {
                label: "Delete Vendor",
                icon: <Trash size={16} />,
                variant: "danger" as const,
                onClick: () => setDeleteId(selectedRowVendor.id!),
              },
            ]
          : []),
      ]
    : [];

  const tableHeaders = [
    "S.N.",
    ...visibleTableFields.map((col) => col.tableLabel || col.label),
  ];

  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

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
            Vendor Profiles
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
              columns={tableFilterColumns}
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
          <span className="text-text-primary dark:text-white">Vendor</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          const baseLabel = getBaseLabel(col.label);

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
                    const newVal =
                      newStart || currentEnd ? `${newStart},${currentEnd}` : "";
                    handleFilterChange(col.key, newVal);
                  }}
                />
                <DatePicker
                  label={`Search ${baseLabel} (To)`}
                  selected={endStr ? new Date(endStr) : null}
                  onChange={(val: Date | null) => {
                    const newEnd = val ? formatLocalDate(val) : "";
                    const currentStart = startStr || "";
                    const newVal =
                      currentStart || newEnd ? `${currentStart},${newEnd}` : "";
                    handleFilterChange(col.key, newVal);
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
                    const newVal =
                      newGt || currentLt ? `${newGt},${currentLt}` : "";
                    handleFilterChange(col.key, newVal);
                  }}
                />
                <DatePicker
                  label={`Search ${baseLabel} (< Before)`}
                  selected={ltStr ? new Date(ltStr) : null}
                  onChange={(val: Date | null) => {
                    const newLt = val ? formatLocalDate(val) : "";
                    const currentGt = gtStr || "";
                    const newVal =
                      currentGt || newLt ? `${currentGt},${newLt}` : "";
                    handleFilterChange(col.key, newVal);
                  }}
                />
              </React.Fragment>
            );
          }

          if (col.type === "number_range") {
            const [minStr, maxStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <Input
                  type="number"
                  label={`Search ${baseLabel} (Min)`}
                  value={minStr || ""}
                  onChange={(e) => {
                    const newMin = e.target.value;
                    const currentMax = maxStr || "";
                    const newVal =
                      newMin || currentMax ? `${newMin},${currentMax}` : "";
                    handleFilterChange(col.key, newVal);
                  }}
                  placeholder={`> Min`}
                />
                <Input
                  type="number"
                  label={`Search ${baseLabel} (Max)`}
                  value={maxStr || ""}
                  onChange={(e) => {
                    const newMax = e.target.value;
                    const currentMin = minStr || "";
                    const newVal =
                      currentMin || newMax ? `${currentMin},${newMax}` : "";
                    handleFilterChange(col.key, newVal);
                  }}
                  placeholder={`< Max`}
                />
              </React.Fragment>
            );
          }

          if (col.type === "number_gt_lt") {
            const [gtStr, ltStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <Input
                  type="number"
                  label={`Search ${baseLabel} (> Greater)`}
                  value={gtStr || ""}
                  onChange={(e) => {
                    const newGt = e.target.value;
                    const currentLt = ltStr || "";
                    const newVal =
                      newGt || currentLt ? `${newGt},${currentLt}` : "";
                    handleFilterChange(col.key, newVal);
                  }}
                  placeholder={`> Greater than`}
                />
                <Input
                  type="number"
                  label={`Search ${baseLabel} (< Less)`}
                  value={ltStr || ""}
                  onChange={(e) => {
                    const newLt = e.target.value;
                    const currentGt = gtStr || "";
                    const newVal =
                      currentGt || newLt ? `${currentGt},${newLt}` : "";
                    handleFilterChange(col.key, newVal);
                  }}
                  placeholder={`< Less than`}
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
        data={vendors}
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
              Add Vendor
            </Button>
          ) : null
        }
        renderRow={(vendor: any, index) => (
          <tr
            key={vendor.id || index}
            onContextMenu={(e) => handleContextMenu(e, vendor)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              let cellData = (vendor as any)[col.key];

              if (col.key === "companyName") {
                cellData = vendor.companyName || vendor.company;
              }

              if (col.render) {
                return (
                  <td
                    key={col.key}
                    className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                  >
                    {col.render(vendor)}
                  </td>
                );
              }
              if (col.options) {
                const match = col.options.find(
                  (opt) => opt.value === String(cellData),
                );
                cellData = match ? match.label : cellData;
              }
              return (
                <td
                  key={col.key}
                  className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${col.key === "profileName" ? "font-medium text-text-primary dark:text-white" : ""}`}
                >
                  {col.key === "connectionType" ? (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${cellData === "SMPP" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {cellData}
                    </span>
                  ) : (
                    cellData || "-"
                  )}
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

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchVendors}
        moduleName={routeName}
        editingVendor={editingVendor}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
      />
    </div>
  );
};

export default Vendor;