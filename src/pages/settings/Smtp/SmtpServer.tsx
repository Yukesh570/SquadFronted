import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
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
import ViewButton from "../../../components/ui/ViewButton";

const SmtpServer: React.FC = () => {
  const [servers, setServers] = useState<SmtpServerData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<SmtpServerData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

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
    if (deleteId) {
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
    "S.N.",
    "Name",
    "Host",
    "Port",
    "User",
    "Security",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
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
          placeholder="Name..."
          className="md:col-span-2"
        />
        <Input
          label="Search Host"
          value={hostFilter}
          onChange={(e) => setHostFilter(e.target.value)}
          placeholder="Host..."
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
            key={server.id}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
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
            <td className="px-4 py-4 text-sm">
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
        message="Are you sure?"
      />
    </div>
  );
};
export default SmtpServer;
