import React, { useState, useEffect, useMemo, useContext } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSideBarApi,
  deleteSideBarApi,
  type SideBarApi,
} from "../../api/sidebarApi/sideBarApi";
import { ModuleModal } from "../../components/modals/ModuleModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { NavItemsContext } from "../../context/navItemsContext";
import { Home } from "lucide-react";

const ModuleList: React.FC = () => {
  const [modules, setModules] = useState<SideBarApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<SideBarApi | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter States
  const [labelFilter, setLabelFilter] = useState("");
  const [urlFilter, setUrlFilter] = useState("");

  const { refreshNavItems } = useContext(NavItemsContext);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const data = await getSideBarApi(routeName);
      setModules(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch modules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  // Search Logic
  const filteredModules = useMemo(() => {
    return modules.filter(
      (module) =>
        module.label.toLowerCase().includes(labelFilter.toLowerCase()) &&
        module.url.toLowerCase().includes(urlFilter.toLowerCase())
    );
  }, [modules, labelFilter, urlFilter]);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteSideBarApi(deleteId, routeName);
        toast.success("Module deleted successfully.");
        refreshNavItems();
        fetchModules();
      } catch (error) {
        toast.error("Failed to delete module.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (module: SideBarApi) => {
    setEditingModule(module);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingModule(null);
    setIsModalOpen(true);
  };

  const headers = [
    "S.N.",
    "Label",
    "URL",
    "Icon",
    "Order",
    "Status",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Module Management
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Modules</span>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard
        onSearch={fetchModules}
        onClear={() => {
          setLabelFilter("");
          setUrlFilter("");
        }}
      >
        <Input
          label="Search by Label"
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          placeholder="Module label"
          className="md:col-span-2"
        />
        <Input
          label="Search by URL"
          value={urlFilter}
          onChange={(e) => setUrlFilter(e.target.value)}
          placeholder="Module URL"
          className="md:col-span-2"
        />
      </FilterCard>

      {/* Data Table */}
      <DataTable
        data={filteredModules}
        headers={headers}
        isLoading={isLoading}
        headerActions={
          <Button
            variant="primary"
            onClick={handleAdd}
            leftIcon={<Plus size={18} />}
          >
            Add Module
          </Button>
        }
        renderRow={(module, index) => (
          <tr
            key={module.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {module.label}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              /{module.url}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {module.icon}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {module.order}
            </td>
            <td className="px-4 py-4 text-sm">
              {module.is_active ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Inactive
                </span>
              )}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(module)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(module.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Modals */}
      <ModuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchModules();
          refreshNavItems();
        }}
        moduleName={routeName}
        editingModule={editingModule}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Module"
        message="Are you sure you want to delete this module? This action cannot be undone."
      />
    </div>
  );
};

export default ModuleList;
