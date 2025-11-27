import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getEntityApi,
  deleteEntityApi,
  type EntityData,
} from "../../../api/settingApi/entityApi/entityApi";
import { EntityModal } from "../../../components/modals/Settings/EntityModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ViewButton from "../../../components/ui/ViewButton";

const Entity: React.FC = () => {
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "entity";

  const fetchEntities = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response: any = await getEntityApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setEntities(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setEntities(response);
        setTotalItems(response.length);
      } else {
        setEntities([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      // Only show toast if it's a real error, not just empty list on load
      // toast.error("Failed to fetch entities.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEntities();
  };

  const handleClearFilters = () => {
    setNameFilter("");
    setCurrentPage(1);
    fetchEntities({ name: "" });
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteEntityApi(deleteId, routeName);
        toast.success("Entity deleted.");
        fetchEntities();
      } catch (error) {
        toast.error("Failed to delete entity.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (entity: EntityData) => {
    setEditingEntity(entity);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingEntity(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (entity: EntityData) => {
    setEditingEntity(entity);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Entity Name", "Actions"];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Entity Settings
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Entity</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Entity"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Entity Name..."
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={entities}
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
            Add Entity
          </Button>
        }
        renderRow={(entity, index) => (
          <tr
            key={entity.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {entity.name}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(entity)} />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(entity)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(entity.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />
      <EntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEntities}
        moduleName={routeName}
        editingEntity={editingEntity}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Entity"
        message="Are you sure you want to delete this entity? This action cannot be undone."
      />
    </div>
  );
};

export default Entity;
