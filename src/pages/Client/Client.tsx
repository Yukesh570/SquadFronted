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
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import ViewButton from "../../components/ui/ViewButton";
import Select from "../../components/ui/Select";
import ContextMenu, {
  type ContextMenuItem,
} from "../../components/ui/ContextMenu";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import { actionHelper } from "../../helper/action";

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
  const [selectedRowClient, setSelectedRowClient] = useState<ClientData | null>(
    null,
  );

  // --- Filters ---
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/").pop() || "client";

  
  // --- Fetch Data ---
  const fetchClients = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
        status: statusFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== ""),
      );
      const response: any = await getClientsApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams,
      );
      if (response && response.results) {
        setClients(response.results);
        setTotalItems(response.count);
      } else {
        setClients([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch clients.");
    } finally {
      setIsLoading(false);
    }
  };
const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
      const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
      let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Module";
      actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      hasLoggedOpening.current = true;
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [routeName, currentPage, rowsPerPage]);

  // --- Handlers ---
  const handleSearch = () => {
    setCurrentPage(1);
    fetchClients();
  };
  const handleClearFilters = () => {
    setNameFilter("");
    setStatusFilter("");
    setCurrentPage(1);
    fetchClients({ name: "", status: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteClientApi(deleteId, routeName);
        toast.success("Client deleted successfully.");
        // ACTION LOG REMOVED: Backend handles internally now
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

  const headers = [
    "S.N.",
    "Client Name",
    "Company",
    "Status",
    "Route Type",
    "Credit Limit",
    "Actions",
  ];
  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Trial", value: "TRIAL" },
    { label: "Suspended", value: "SUSPENDED" },
  ];

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Clients
        </h1>
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
        <Input
          label="Search Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Client Name"
          className="md:col-span-2"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="Select Status"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={clients}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={headers}
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
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {client.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {client.companyName || client.company}
            </td>
            <td className="px-4 py-4 text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${client.status === "ACTIVE" ? "bg-green-100 text-green-800" : client.status === "TRIAL" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}
              >
                {client.status}
              </span>
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {client.route}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {client.creditLimit}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(client)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(client)}
                    title="Edit Client"
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(client.id!)}
                    title="Delete Client"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
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