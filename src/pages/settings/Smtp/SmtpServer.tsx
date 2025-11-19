import React, { useState, useEffect, useMemo } from "react";
import { Home, Plus, Trash, Edit } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSmtpServersApi,
  deleteSmtpServerApi,
  type SmtpServerData,
} from "../../../api/settingApi/smtpApi/smtpApi";
import { SmtpModal } from "../../../components/modals/SmtpModal";
// import Select from "../../components/ui/Select";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ViewButton from "../../../components/ui/ViewButton";

const SmtpServer: React.FC = () => {
  const [servers, setServers] = useState<SmtpServerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<SmtpServerData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [isViewMode, setIsViewMode] = useState(false);
  // Filter States
  const [nameFilter, setNameFilter] = useState("");
  const [hostFilter, setHostFilter] = useState("");

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  const fetchServers = async () => {
    setIsLoading(true);
    try {
      const data = await getSmtpServersApi(routeName);
      setServers(data);
    } catch (error) {
      toast.error("Failed to fetch SMTP servers.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [routeName]);

  // Search Logic
  const filteredServers = useMemo(() => {
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
        server.smtpHost.toLowerCase().includes(hostFilter.toLowerCase())
    );
  }, [servers, nameFilter, hostFilter]);

  const handleClearFilters = () => {
    setNameFilter("");
    setHostFilter("");
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteSmtpServerApi(deleteId, routeName);
        toast.success("Email Host deleted.");
        fetchServers(); // Refresh list
      } catch (error) {
        toast.error("Failed to delete host.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (server: SmtpServerData) => {
    setEditingServer(server);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingServer(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (server: SmtpServerData) => {
    setEditingServer(server);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = [
    "Name (From Email)",
    "SMTP Host",
    "SMTP Port",
    "SMTP User",
    "Security",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
      {/* Header */}
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

      {/* Filter Card */}
      <FilterCard onSearch={fetchServers} onClear={handleClearFilters}>
        <Input
          label="Search by Name"
          type="text"
          placeholder="user@email.com"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="md:col-span-2"
        />
        <Input
          label="Search by SMTP Host"
          type="text"
          placeholder="smtp.gmail.com"
          value={hostFilter}
          onChange={(e) => setHostFilter(e.target.value)}
          className="md:col-span-2"
        />
      </FilterCard>

      {/* Data Table */}
      <DataTable
        data={filteredServers}
        headers={headers}
        isLoading={isLoading}
        headerActions={
          <Button
            variant="primary"
            onClick={handleAdd}
            leftIcon={<Plus size={18} />}
          >
            Add Host
          </Button>
        }
        renderRow={(server, index) => (
          <tr
            key={server.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">
              {server.name}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">
              {server.smtpHost}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">
              {server.smtpPort}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">
              {server.smtpUser}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">
              {server.security}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(server)} />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(server)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(server.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Modals */}
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
        title="Delete Email Host"
        message="Are you sure you want to delete this host? This action cannot be undone."
      />
    </div>
  );
};

export default SmtpServer;
