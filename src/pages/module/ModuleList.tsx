import React, { useState, useEffect, useContext } from "react";
import { Plus, Edit, Trash, Home } from "lucide-react";
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
import ViewButton from "../../components/ui/ViewButton";
import { usePagePermissions } from "../../hooks/usePagePermissions";

const ModuleList: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [modules, setModules] = useState<SideBarApi[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<SideBarApi | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [labelFilter, setLabelFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { refreshNavItems } = useContext(NavItemsContext);
  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  const fetchModules = async (overrideParams?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        label: labelFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );

      const response: any = await getSideBarApi(
        routeName,

        currentPage,
        rowsPerPage,
        cleanParams
      );
      if (response && response.results) {
        setModules(response.results);
        setTotalItems(response.count);
      } else {
        setModules([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch modules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [currentPage, rowsPerPage, routeName]);
  const handleSearch = () => {
    setCurrentPage(1);
    fetchModules();
  };

  const handleClearFilters = () => {
    setLabelFilter("");
    setCurrentPage(1);
    fetchModules({ label: "", url: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
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
    if (!canUpdate) return;
    setEditingModule(module);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleAdd = () => {
    if (!canCreate) return;
    setEditingModule(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };
  const handleView = (module: SideBarApi) => {
    setEditingModule(module);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = [
    "S.N.",
    "Label",
    "URL",
    "Icon",
    "Order",
    // "Status",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
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

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search by Label"
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          placeholder="Module label"
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={modules}
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
              Add Module
            </Button>
          ) : null
        }
        renderRow={(module, index) => (
          <tr
            key={module.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
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
            {/* <td className="px-4 py-4 text-sm">
              {module.is_active ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </td> */}
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(module)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(module)}
                    title="Edit Module"
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(module.id!)}
                    title="Delete Module"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />
      <ModuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchModules();
          refreshNavItems();
        }}
        moduleName={routeName}
        editingModule={editingModule}
        isViewMode={isViewMode}
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
