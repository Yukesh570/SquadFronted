import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, ShieldPlus, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// --- APIs ---
import {
  getClientsApi,
  deleteClientApi,
  type ClientData,
} from "../../api/clientApi/clientApi";

// --- Components ---
import { ClientModal } from "../../components/modals/ClientModal";
import IpWhitelistModal from "../../components/modals/WhiteListIPModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
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

// --- Interfaces ---
interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  render?: (data: ClientData) => React.ReactNode;
  options?: Option[];
  filterKey?: string;
}

// --- Default Configuration ---
const DEFAULT_SEARCH_COLUMNS = ["name", "status"];
const DEFAULT_TABLE_COLUMNS = ["name", "companyName", "status", "route", "creditLimit"];

const Client: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
  const [selectedRowClient, setSelectedRowClient] = useState<ClientData | null>(null);

  // --- Dynamic Filters & Columns State ---
  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
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
        const activeLinks = document.querySelectorAll("aside a.active, nav a.active");
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split("\n")[0].trim() || "Module";

        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);

      hasLoggedOpening.current = true;
    }
  }, []);

  // --- Column Configuration ---
  const statusOptions: Option[] = [
    { label: "Active", value: "ACTIVE" },
    { label: "Trial", value: "TRIAL" },
    { label: "Suspended", value: "SUSPENDED" },
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
    { key: "name", label: "Client Name", type: "text", filterKey: "name__icontains" },
    { key: "companyName", label: "Company", type: "text", filterKey: "company__name__icontains" },
    { key: "status", label: "Status", type: "text", options: statusOptions, render: (c) => renderStatusBadge(c.status) },
    { key: "route", label: "Route Type", type: "text", options: routeOptions },
    { key: "paymentTerms", label: "Payment Terms", type: "text", options: paymentTermOptions },
    { key: "creditLimit", label: "Credit Limit", type: "number" },
    { key: "balanceAlertAmount", label: "Balance Alert", type: "number" },
    { key: "allowNetting", label: "Allow Netting", type: "boolean", options: booleanOptions, render: (c) => renderBooleanBadge(c.allowNetting) },
    { key: "smppUsername", label: "SMPP Username", type: "text" },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  // --- Fetch Data (Advanced Filter Logic) ---
  const fetchClients = async (filters: Record<string, string> | null = null) => {
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
              const selectedOption = columnDef.options.find((opt) => opt.value === value);
              currentSearchParams[columnDef.filterKey] = selectedOption ? selectedOption.value : value; // Sending value instead of label usually better for ENUMS
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

      const response: any = await getClientsApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams
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

  // --- Handlers ---
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

  // --- Context Menu Logic ---
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

  const tableHeaders = ["S.N.", ...visibleTableFields.map((col) => col.label)];

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
          <span className="text-text-primary dark:text-white">Clients</span>
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

              // Handle fallback for companyName vs company
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
                  (opt) => opt.value === String(cellData)
                );
                cellData = match ? match.label : cellData;
              }
              return (
                <td
                  key={col.key}
                  className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${
                    col.key === "name" ? "font-medium text-text-primary dark:text-white" : ""
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