import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, ShieldPlus, Eye, Mail } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// --- APIs ---
import {
  getClientsApi,
  deleteClientApi,
  sendClientDetailsEmailApi,
  type ClientData,
} from "../../api/clientApi/clientApi";
import { getCompaniesApi } from "../../api/companyApi/companyApi";

// @ts-ignore
import { getCustomerRatesApi } from "../../api/rateApi/customerRateApi";

// --- Components ---
import { ClientModal } from "../../components/modals/ClientModal";
import IpWhitelistModal from "../../components/modals/WhiteListIPModal";
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
import ContextMenu, {
  type ContextMenuItem,
} from "../../components/ui/ContextMenu";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import { actionHelper } from "../../helper/action";
import { deleteClientPolicyApi } from "../../api/policyApi/clientPolicyApi";

// --- Interfaces ---
interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: ClientData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
  isSearchOnly?: boolean;
  tableLabel?: string;
}

// --- Default Configuration ---
const DEFAULT_SEARCH_COLUMNS = ["name", "status"];
const DEFAULT_TABLE_COLUMNS = [
  "name",
  "companyName",
  "ratePlanName",
  "status",
  "route",
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Client: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Dropdown States ---
  const [companies, setCompanies] = useState<Option[]>([]);
  const [ratePlanOptions, setRatePlanOptions] = useState<Option[]>([]);

  // --- Modal States ---
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [ipModalClient, setIpModalClient] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // --- Context Menu State ---
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedRowClient, setSelectedRowClient] = useState<ClientData | null>(
    null,
  );

  // --- Dynamic Filters & Columns State ---
  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS,
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("client_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("client_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/").pop() || "client";
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Tracking ---
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

  // --- Fetch Dropdowns for Search ---
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
        const rateRes: any = await getCustomerRatesApi("customerRate", 1, 1000);
        const rateList =
          rateRes.results || (Array.isArray(rateRes) ? rateRes : []);
        setRatePlanOptions(
          rateList.map((r: any) => ({
            label: r.ratePlan || r.ratePlanName || r.name,
            value: r.ratePlan || r.ratePlanName || r.name,
          })),
        );
      } catch (err: any) {
        console.error("Failed to load customer rates for filter", err);
      }
    };
    loadDropdowns();
  }, []);

  // --- Column Configuration ---
  const statusOptions: Option[] = [
    { label: "Active", value: "ACTIVE" },
    { label: "Trial", value: "TRIAL" },
    { label: "Suspended", value: "SUSPENDED" },
  ];
  const bindStatusOptions: Option[] = [
    { label: "online", value: "ONLINE" },
    { label: "offline", value: "OFFLINE" },
  ];

  const routeOptions: Option[] = [
    { label: "Direct", value: "DIRECT" },
    { label: "High Quality", value: "HIGH QUALITY" },
    { label: "SIM", value: "SIM" },
    { label: "Wholesale", value: "WHOLESALE" },
    { label: "Full", value: "FULL" },
    { label: "Spam", value: "SPAM" },
  ];

  const paymentTermOptions: Option[] = [
    { label: "Prepaid", value: "PREPAID" },
    { label: "Postpaid", value: "POSTPAID" },
    { label: "Net 7", value: "NET7" },
    { label: "Net 15", value: "NET15" },
    { label: "Net 30", value: "NET30" },
  ];

  const booleanOptions: Option[] = [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
  ];

  const renderStatusBadge = (status: string) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        status === "ACTIVE"
          ? "bg-green-100 text-green-800"
          : status === "TRIAL"
            ? "bg-blue-100 text-blue-800"
            : "bg-red-100 text-red-800"
      }`}
    >
      {status}
    </span>
  );
  const renderBindStatusBadge = (status: string) => (
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

  const renderSessionBadge = (sessionStr: string) => {
    if (!sessionStr) return "-";

    // Optional: Make it red if it's full (e.g., "2/2")
    const [current, max] = sessionStr.split("/");
    const isFull = current === max && max !== "Unlimited";

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          isFull
            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        {sessionStr}
      </span>
    );
  };
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

  const allColumns: ColumnConfig[] = [
    {
      key: "name",
      label: "Client Name",
      type: "text",
      filterKey: "name__icontains",
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
      key: "status",
      label: "Status",
      type: "text",
      options: statusOptions,
      render: (c) => renderStatusBadge(c.status),
    },
    { key: "route", label: "Route Type", type: "text", options: routeOptions },
    {
      key: "paymentTerms",
      label: "Payment Terms",
      type: "text",
      options: paymentTermOptions,
    },
    {
      key: "allowNetting",
      label: "Allow Netting",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.allowNetting),
    },
    {
      key: "enableDlr",
      label: "Enable Dlr",
      type: "boolean",
      options: booleanOptions,
      render: (c) => renderBooleanBadge(c.enableDlr),
    },
    {
      key: "smppUsername",
      label: "SMPP Username",
      type: "text",
      filterKey: "smppUsername__icontains",
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
      // Remove 'options: sessionOptions'
      render: (c) => renderSessionBadge(c.session), // ⚡️ Point it to your new data!
    },
    // --- Balance Alert Variants ---
    {
      key: "balanceAlertAmount",
      label: "Balance Alert (Exact)",
      tableLabel: "Balance Alert",
      type: "number",
    },
    {
      key: "balanceAlertAmount__range",
      label: "Balance Alert (Range)",
      type: "number_range",
      isSearchOnly: true,
    },
    {
      key: "balanceAlertAmount__gt_lt",
      label: "Balance Alert (GT / LT)",
      type: "number_gt_lt",
      isSearchOnly: true,
    },

    // --- Created At Variants ---
    {
      key: "createdAt",
      label: "Created At (Exact)",
      tableLabel: "Created At",
      type: "date",
      filterKey: "createdAt__date",
      render: (c) =>
        c.createdAt ? new Date(c.createdAt).toLocaleString() : "-",
    },
    {
      key: "createdAt__range",
      label: "Created At (Range)",
      type: "date_range",
      isSearchOnly: true,
    },
    {
      key: "createdAt__gt_lt",
      label: "Created At (After / Before)",
      type: "date_gt_lt",
      isSearchOnly: true,
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

  // --- Fetch Data (Advanced Filter Logic) ---
  const fetchClients = async (
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
            if (lt) currentSearchParams[`${baseKey}__lt`] = lt;
          } else if (columnDef?.type === "text") {
            const filterKey = columnDef.filterKey || `${key}__icontains`;
            currentSearchParams[filterKey] = value;
          } else {
            currentSearchParams[columnDef?.filterKey || key] = value;
          }
        }
      });

      const response: any = await getClientsApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams,
      );

      if (newController.signal.aborted) return;

      if (response && response.results) {
        setClients(response.results);
        setTotalItems(response.count);
      } else {
        setClients([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") toast.error("Failed to fetch clients.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);
  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    const ws = new WebSocket(`${wsBase}/ws/status/`);
    ws.onopen = () => console.log("✅ Client Table linked to live SMPP feed");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.username && data.status) {
          setClients((prevClients) =>
            prevClients.map((client) => {
              if (client.smppUsername === data.username) {
                // 1. Grab the current session string (e.g., "1/2" or "0/Unlimited")
                const currentSessionStr = client.session || "0/2";
                const [currentStr, maxLimit] = currentSessionStr.split("/");
                let currentCount = parseInt(currentStr, 10) || 0;

                // 2. Do the math based on the event
                if (data.status === "ONLINE") {
                  currentCount += 1;
                } else if (data.status === "OFFLINE") {
                  currentCount = Math.max(0, currentCount - 1); // Never drop below 0
                }

                // 3. Update BOTH the bindStatus and the session string!
                return {
                  ...client,
                  bindStatus: data.status,
                  session: `${currentCount}/${maxLimit}`,
                };
              }
              return client;
            }),
          );
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };
    ws.onclose = () => console.log("⚠️ Live SMPP feed disconnected");
    return () => {
      ws.close();
    };
  }, []);
  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    const ws = new WebSocket(`${wsBase}/ws/status/`);
    ws.onopen = () => console.log("✅ Client Table linked to live SMPP feed");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.username && data.status) {
          setClients((prevClients) =>
            prevClients.map((client) =>
              client.smppUsername === data.username
                ? { ...client, bindStatus: data.status }
                : client,
            ),
          );
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };
    ws.onclose = () => console.log("⚠️ Live SMPP feed disconnected");
    return () => {
      ws.close();
    };
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchClients();
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
    fetchClients({});
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteClientApi(deleteId, routeName);
        try {
          await deleteClientPolicyApi(deleteId);
        } catch (policyError) {
          console.warn("No policy found to delete, ignoring.");
        }
        toast.success("Client deleted successfully.");
        fetchClients();
      } catch (error) {
        toast.error("Failed to delete client.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (client: ClientData) => {
    if (!canUpdate) return;
    setEditingClient(client);
    setIsViewMode(false);
    setIsClientModalOpen(true);
  };
  const handleAdd = () => {
    if (!canCreate) return;
    setEditingClient(null);
    setIsViewMode(false);
    setIsClientModalOpen(true);
  };
  const handleView = (client: ClientData) => {
    setEditingClient(client);
    setIsViewMode(true);
    setIsClientModalOpen(true);
  };
  const handleAddIp = (client: ClientData) => {
    if (!client.id) return;
    setIpModalClient({ id: client.id, name: client.name });
    setIsIpModalOpen(true);
  };

  const handleSendDetails = async (client: ClientData) => {
    if (!client.id) return;
    const toastId = toast.loading("Sending client details...");
    try {
      await sendClientDetailsEmailApi({
        templateName: "Welcome Mail",
        clientId: client.id,
      });
      toast.update(toastId, {
        render: "Details sent successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      toast.update(toastId, {
        render: error.response?.data?.detail || "Failed to send details.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, client: ClientData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowClient(client);
  };

  const menuItems: ContextMenuItem[] = selectedRowClient
    ? [
        ...(canUpdate
          ? [
              {
                label: "Add IP Whitelist",
                icon: <ShieldPlus size={16} />,
                onClick: () => handleAddIp(selectedRowClient),
              },
            ]
          : []),
        {
          label: "View Details",
          icon: <Eye size={16} />,
          onClick: () => handleView(selectedRowClient),
        },
        {
          label: "Send Details",
          icon: <Mail size={16} />,
          onClick: () => handleSendDetails(selectedRowClient),
        },
        ...(canUpdate
          ? [
              {
                label: "Edit Client",
                icon: <Edit size={16} />,
                onClick: () => handleEdit(selectedRowClient),
              },
            ]
          : []),
        ...(canDelete
          ? [
              {
                label: "Delete Client",
                icon: <Trash size={16} />,
                variant: "danger" as const,
                onClick: () => setDeleteId(selectedRowClient.id!),
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

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Clients
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
          <span className="text-text-primary dark:text-white">Clients</span>
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
        data={clients}
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
              Add Client
            </Button>
          ) : null
        }
        renderRow={(client, index) => (
          <tr
            key={client.id || index}
            onContextMenu={(e) => handleContextMenu(e, client)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              let cellData = (client as any)[col.key];

              if (col.key === "companyName") {
                cellData = client.companyName || client.company;
              }

              if (col.render) {
                return (
                  <td
                    key={col.key}
                    className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                  >
                    {col.render(client)}
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
                  className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${
                    col.key === "name"
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

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={fetchClients}
        moduleName={routeName}
        editingClient={editingClient}
        isViewMode={isViewMode}
      />

      <IpWhitelistModal
        isOpen={isIpModalOpen}
        onClose={() => setIsIpModalOpen(false)}
        onSuccess={() => {}}
        moduleName="ipWhitelist"
        editingData={null}
        fixedClient={ipModalClient}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
      />
    </div>
  );
};

export default Client;
