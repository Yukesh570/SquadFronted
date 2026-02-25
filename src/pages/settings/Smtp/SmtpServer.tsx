import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react"; // Added Eye icon
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSmtpServersApi,
  deleteSmtpServerApi,
  type SmtpServerData,
} from "../../../api/settingApi/smtpApi/smtpApi";
import { SmtpModal } from "../../../components/modals/Settings/SmtpModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
// ViewButton removed
import { usePagePermissions } from "../../../hooks/usePagePermissions";
// NEW: Context Menu
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

const SmtpServer: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [servers, setServers] = useState<SmtpServerData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<SmtpServerData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowServer, setSelectedRowServer] = useState<SmtpServerData | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [hostFilter, setHostFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  const fetchServers = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
        smtpHost: hostFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );

      const response: any = await getSmtpServersApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );
      if (response && response.results) {
        setServers(response.results);
        setTotalItems(response.count);
      } else {
        setServers([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch SMTP servers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchServers();
  };

  const handleClearFilters = () => {
    setNameFilter("");
    setHostFilter("");
    setCurrentPage(1);
    fetchServers({ name: "", smtpHost: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteSmtpServerApi(deleteId, routeName);
        toast.success("Email Host deleted.");
        fetchServers();
      } catch (error) {
        toast.error("Failed to delete host.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (server: SmtpServerData) => { if (!canUpdate) return; setEditingServer(server); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingServer(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (server: SmtpServerData) => { setEditingServer(server); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: SmtpServerData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowServer(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowServer ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowServer) },
    ...(canUpdate ? [{ label: "Edit Server", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowServer) }] : []),
    ...(canDelete ? [{ label: "Delete Server", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowServer.id!) }] : []),
  ] : [];

  // Removed "Actions" from headers
  const headers = [
    "S.N.",
    "Name",
    "Host",
    "Port",
    "User",
    "Security",
  ];

  const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      // The setTimeout is CRUCIAL here to wait for the sidebar to update
      setTimeout(() => {
        const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Module";
        
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100); // Waits 0.1 seconds
      
      hasLoggedOpening.current = true;
    }
  }, []);

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Email Hosts (SMTP)
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Email Hosts</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Name"
          className="md:col-span-2"
        />
        <Input
          label="Search Host"
          value={hostFilter}
          onChange={(e) => setHostFilter(e.target.value)}
          placeholder="Host"
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={servers}
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
              Add Host
            </Button>
          ) : null
        }
        renderRow={(server, index) => (
          <tr
            key={server.id}
            onContextMenu={(e) => handleContextMenu(e, server)} // Right Click Handler
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {server.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {server.smtpHost}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {server.smtpPort}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {server.smtpUser}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {server.security}
            </td>
            {/* ACTION COLUMN REMOVED */}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <SmtpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchServers}
        moduleName={routeName}
        editingServer={editingServer}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Host"
        message="Are you sure you want to delete this email host? This action cannot be undone."
      />
    </div>
  );
};
export default SmtpServer;