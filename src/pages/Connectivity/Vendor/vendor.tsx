import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye, RefreshCw, Layers } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getVendorsApi,
  deleteVendorApi,
  getVendorRateGroupsApi,
  type VendorData,
  updateVendorApi,
} from "../../../api/connectivityApi/vendorApi";
import { getCompaniesApi } from "../../../api/companyApi/companyApi";

import { VendorModal } from "../../../components/modals/Connectivity/VendorModal";
import { VendorRateTableModal } from "../../../components/modals/Connectivity/VendorRateTableModal";
import { VendorRateGroupModal } from "../../../components/modals/Connectivity/VendorRateGroupModal";
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

import { StatusBadge, STATUS_COLORS } from "../../../components/ui/StatusBadge";

interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: VendorData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchOnly?: boolean;
  isSearchable?: boolean;
  tableLabel?: string;
}

const DEFAULT_SEARCH_COLUMNS = ["profileName", "companyName", "connectionType"];
const DEFAULT_TABLE_COLUMNS = [
  "profileName",
  "companyName",
  "vendorRateGroup",
  "connectionType",
  "bindStatus",
  "status",
  "invoicePolicy",
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
  const [vendorRateGroupOptions, setVendorRateGroupOptions] = useState<Option[]>([]);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Modal State for Edit Rate Group ⚡️ ADDED
  const [isRateGroupModalOpen, setIsRateGroupModalOpen] = useState(false);

  // Modal State for View Rate
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateModalVendor, setRateModalVendor] = useState<{ id: number; profileName: string; } | null>(null);

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

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "vendor";
  const abortControllerRef = useRef<AbortController | null>(null);

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
        const rateRes: any = await getVendorRateGroupsApi("vendorRateGroup", 1, 1000);
        const rateList =
          rateRes.results || (Array.isArray(rateRes) ? rateRes : []);
        setVendorRateGroupOptions(
          rateList.map((r: any) => ({
            label: r.name,
            value: String(r.id),
          })),
        );
      } catch (err: any) {
        console.error("Failed to load vendor rate groups for filter", err);
      }
    };
    loadDropdowns();
  }, []);

  // --- ⚡️ UNIFIED Live WebSockets for Vendor SMPP Status ---
  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      ws = new WebSocket(`${wsBase}/ws/status/`);

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
        console.log("⚠️ Live SMPP feed disconnected. Attempting to reconnect...");
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  // --- Static Options & Renders ---
  const connectionTypeOptions: Option[] = [
    { label: "SMPP", value: "SMPP" },
    { label: "HTTP", value: "HTTP" },
  ];

  const invoicePolicyOptions: Option[] = [
    { label: "On Attempt", value: "ON_ATTEMPT" },
    { label: "On Submit", value: "ON_SUBMIT" },
    { label: "On Delivered", value: "ON_DELIVERED" },
  ];

  const bindStatusOptions: Option[] = [
    { label: "online", value: "ONLINE" },
    { label: "offline", value: "OFFLINE" },
  ];

  const statusOptions: Option[] = [
    { label: "active", value: "ACTIVE" },
    { label: "trial", value: "TRIAL" },
    { label: "suspended", value: "SUSPENDED" },
  ];

  const logLevelOptions: Option[] = [
    { label: "DEBUG", value: "DEBUG" },
    { label: "INFO", value: "INFO" },
    { label: "WARNING", value: "WARNING" },
    { label: "ERROR", value: "ERROR" },
    { label: "CRITICAL", value: "CRITICAL" },
  ];

  const renderSessionBadge = (vendor: any) => {
    const current = vendor.active_session_count || 0;
    const max = vendor.vendorPolicy?.maxSession || 1;
    const isFull = current === max && max > 0;

    const statusKey = isFull ? "UNDELIVERED" : "SUBMITTED";

    return <StatusBadge status={statusKey} customText={`${current}/${max}`} />;
  };

  const allColumns: ColumnConfig[] = [
    {
      key: "profileName",
      label: "Vendor Name",
      type: "text",
      filterKey: "profileName__icontains",
    },
    {
      key: "companyName",
      label: "Company",
      type: "text",
      options: companies,
      filterKey: "company__name__icontains",
    },
    {
      key: "vendorRateGroup",
      label: "Vendor Rate Group",
      type: "text",
      options: vendorRateGroupOptions,
      filterKey: "vendorRateGroup",
      isSearchable: false,
      render: (c: any) => c.vendorRateGroupName || c.vendorRateGroup || "-",
    },
    {
      key: "connectionType",
      label: "Connection Type",
      type: "text",
      options: connectionTypeOptions,
      filterKey: "connectionType__icontains",
      render: (c) => {
        const type = c.connectionType?.toUpperCase();
        const statusKey = type === "SMPP" ? "DELIVERED" : "SUBMITTED";
        return <StatusBadge status={statusKey} customText={c.connectionType} />;
      }
    },
    {
      key: "invoicePolicy",
      label: "Invoice Policy",
      type: "text",
      options: invoicePolicyOptions,
      filterKey: "invoicePolicy__icontains",
      render: (c) => {
        if (!c.invoicePolicy) return "-";
        const match = invoicePolicyOptions.find(opt => opt.value === c.invoicePolicy);
        return match ? match.label : c.invoicePolicy;
      }
    },
    {
      key: "smppName",
      label: "SMPP Name",
      type: "text",
      filterKey: "smpp__smppHost__icontains",
    },
    {
      key: "bindStatus",
      label: "Bind Status",
      type: "text",
      options: bindStatusOptions,
      filterKey: "bindStatus__icontains",
      render: (c) => <StatusBadge status={c.bindStatus} />,
    },
    {
      key: "status",
      label: "Status",
      type: "text",
      options: statusOptions,
      filterKey: "status__icontains",
      render: (c) => {
        const statusConfig = STATUS_COLORS[c.status?.toUpperCase() || "UNKNOWN"] || STATUS_COLORS.UNKNOWN;
        return (
          <select
            value={c.status || ""}
            onChange={(e) => handleStatusChange(c, e.target.value as VendorData["status"])}
            onClick={(e) => e.stopPropagation()}
            disabled={!canUpdate}
            className="border rounded px-2 py-0.5 text-xs font-medium focus:outline-none cursor-pointer disabled:cursor-not-allowed appearance-none pr-6 bg-no-repeat"
            style={{
              backgroundColor: statusConfig.bg,
              color: statusConfig.text,
              borderColor: statusConfig.border,
              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23${statusConfig.text.replace('#', '')}%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
              backgroundSize: '16px 16px',
              backgroundPosition: 'calc(100% - 4px) center',
            }}
          >
            <option value="ACTIVE" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Active</option>
            <option value="TRIAL" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Trial</option>
            <option value="SUSPENDED" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Suspended</option>
          </select>
        );
      },
    },
    {
      key: "session",
      label: "Sessions (Current/Max)",
      tableLabel: "Sessions",
      type: "text",
      isSearchable: false,
      render: (c) => renderSessionBadge(c),
    },
    {
      key: "maxSession",
      label: "Max Sessions",
      type: "number",
      filterKey: "vendorPolicy__maxSession",
      render: (c) => c.vendorPolicy?.maxSession ?? "-"
    },
    {
      key: "rateTps",
      label: "Rate TPS",
      type: "number",
      filterKey: "vendorPolicy__rateTps",
      render: (c) => c.vendorPolicy?.rateTps ?? "-"
    },
    {
      key: "sendQueueLimit",
      label: "Queue Limit",
      type: "number",
      filterKey: "vendorPolicy__sendQueueLimit",
      render: (c) => c.vendorPolicy?.sendQueueLimit ?? "-"
    },
    {
      key: "logLevel",
      label: "Log Level",
      type: "text",
      options: logLevelOptions,
      filterKey: "vendorPolicy__logLevel__icontains",
      render: (c) => c.vendorPolicy?.logLevel ?? "-"
    },
    {
      key: "responseTimeout",
      label: "Response Timeout (s)",
      type: "number",
      filterKey: "vendorPolicy__responseTimeout",
      render: (c) => c.vendorPolicy?.responseTimeout ?? "-"
    },
    {
      key: "enquireLinkInterval",
      label: "Enquire Link Interval (s)",
      type: "number",
      filterKey: "vendorPolicy__enquireLinkInterval",
      render: (c) => c.vendorPolicy?.enquireLinkInterval ?? "-"
    },
    {
      key: "connectionTimeout",
      label: "Conn. Timeout (s)",
      type: "number",
      filterKey: "vendorPolicy__connectionTimeout",
      render: (c) => c.vendorPolicy?.connectionTimeout ?? "-"
    },
    {
      key: "maxMessageRetries",
      label: "Max Msg Retries",
      type: "number",
      filterKey: "vendorPolicy__maxMessageRetries",
      render: (c) => c.vendorPolicy?.maxMessageRetries ?? "-"
    },
    {
      key: "connectionRetryDelay",
      label: "Conn Retry Delay (s)",
      type: "number",
      filterKey: "vendorPolicy__connectionRetryDelay",
      render: (c) => c.vendorPolicy?.connectionRetryDelay ?? "-"
    },
    {
      key: "connectionRetryCount",
      label: "Conn Retry Count",
      type: "number",
      filterKey: "vendorPolicy__connectionRetryCount",
      render: (c) => c.vendorPolicy?.connectionRetryCount ?? "-"
    },
    {
      key: "bindRetryDelay",
      label: "Bind Retry Delay (s)",
      type: "number",
      isSearchable: false,
      render: (c) => c.vendorPolicy?.bindRetryDelay ?? "-"
    },
    {
      key: "bindRetryCount",
      label: "Bind Retry Count",
      type: "number",
      isSearchable: false,
      render: (c) => c.vendorPolicy?.bindRetryCount ?? "-"
    },
    {
      key: "connectionRecoveryDelay",
      label: "Conn Recovery Delay (s)",
      type: "number",
      filterKey: "vendorPolicy__connectionRecoveryDelay",
      render: (c) => c.vendorPolicy?.connectionRecoveryDelay ?? "-"
    },
    {
      key: "tlvTag",
      label: "TLV Tag",
      type: "text",
      filterKey: "vendorPolicy__tlvTag__icontains",
      render: (c) => c.vendorPolicy?.tlvTag ?? "-"
    },
    {
      key: "tlvValue",
      label: "TLV Value",
      type: "text",
      filterKey: "vendorPolicy__tlvValue__icontains",
      render: (c) => c.vendorPolicy?.tlvValue ?? "-"
    },
  ];

  const searchableColumns = allColumns.filter((col) => col.isSearchable !== false);


  const visibleSearchFields = searchableColumns.filter((col) =>
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
            currentSearchParams[`${columnDef.filterKey || key}__range`] =
              `${value}T00:00:00,${value}T23:59:59`;
          } else if (columnDef?.type === "date_range") {
            const baseKey = key.replace("__range", "");
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
            const baseKey = key.replace("__range", "");
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
            if (lt) currentSearchParams[`${baseKey}__lt`] = lt;
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

  const handleEditRateGroup = (vendor: VendorData) => {
    if (!canUpdate) return;
    setEditingVendor(vendor);
    setIsRateGroupModalOpen(true);
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

  const handleStatusChange = async (vendor: VendorData, newStatus: VendorData["status"]) => {
    if (!canUpdate) {
      toast.error("You don't have permission to update vendors.");
      return;
    }
    try {
      await updateVendorApi(vendor.id!, { status: newStatus }, routeName);
      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, status: newStatus } : v))
      );
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update status");
    }
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
      {
        label: "View Rate",
        icon: <Layers size={16} />,
        onClick: () => {
          setRateModalVendor({ id: selectedRowVendor.id!, profileName: selectedRowVendor.profileName });
          setIsRateModalOpen(true);
        }
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
          {
            label: !selectedRowVendor.vendorRateGroup ? "Add Rate Group" : "Edit Rate Group",
            icon: !selectedRowVendor.vendorRateGroup ? <Plus size={16} /> : <Edit size={16} />,
            onClick: () => handleEditRateGroup(selectedRowVendor),
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
              columns={tableFilterColumns}
              selectedColumns={tableColumns}
              onFilter={setTableColumns}
              onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
              buttonLabel="Columns"
            />
          </div>
          <div className="relative z-20">
            <AdvancedFilter
              columns={searchableColumns}
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
        density="compact"
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

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchVendors}
        moduleName={routeName}
        editingVendor={editingVendor}
        isViewMode={isViewMode}
      />

      <VendorRateGroupModal
        isOpen={isRateGroupModalOpen}
        onClose={() => setIsRateGroupModalOpen(false)}
        onSuccess={fetchVendors}
        moduleName={routeName}
        editingVendor={editingVendor}
        vendorRateGroupOptions={vendorRateGroupOptions}
      />

      <VendorRateTableModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        vendor={rateModalVendor}
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