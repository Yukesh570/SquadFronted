import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCompanyCategoryApi,
  deleteCompanyCategoryApi,
  type CompanyCategoryData,
} from "../../../api/settingApi/companyCategoryApi/companyCategoryApi";
import { CompanyCategoryModal } from "../../../components/modals/Settings/companyCategoryModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

interface ColumnConfig {
  key: string;
  label: string;
  render: (data: CompanyCategoryData) => React.ReactNode;
}

const DEFAULT_TABLE_COLUMNS = ["name"];

const CompanyCategory: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [entities, setEntities] = useState<CompanyCategoryData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyCategory, setEditingCompanyCategory] = useState<CompanyCategoryData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowCategory, setSelectedRowCategory] = useState<CompanyCategoryData | null>(null);

  const [nameFilter, setNameFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Column Order State & Persistence ---
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("companycategory_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("companycategory_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "CompanyCategory";

  // Column definitions for dynamic rendering & dragging
  const allColumns: ColumnConfig[] = [
    {
      key: "name",
      label: "Company Category Name",
      render: (CompanyCategory) => (
        <span className="font-medium text-text-primary dark:text-white">
          {CompanyCategory.name}
        </span>
      ),
    },
  ];

  // Map columns according to custom reordered user preference
  const visibleTableFields = tableColumns
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is ColumnConfig => Boolean(col));

  const headers = ["S.N.", ...visibleTableFields.map((col) => col.label)];

  const fetchCompanyCategory = async (
    overrideParams?: Record<string, string>
  ) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response: any = await getCompanyCategoryApi(
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyCategory();
  }, [routeName, currentPage, rowsPerPage]);
  
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCompanyCategory();
  };
  
  const handleClearFilters = () => {
    setNameFilter("");
    setCurrentPage(1);
    fetchCompanyCategory({ name: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCompanyCategoryApi(deleteId, routeName);
        toast.success("Company Category deleted.");
        fetchCompanyCategory();
      } catch (error) {
        toast.error("Failed to delete Company Category.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (CompanyCategory: CompanyCategoryData) => { if (!canUpdate) return; setEditingCompanyCategory(CompanyCategory); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingCompanyCategory(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (CompanyCategory: CompanyCategoryData) => { setEditingCompanyCategory(CompanyCategory); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: CompanyCategoryData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowCategory(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowCategory ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowCategory) },
    ...(canUpdate ? [{ label: "Edit Category", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowCategory) }] : []),
    ...(canDelete ? [{ label: "Delete Category", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowCategory.id!) }] : []),
  ] : [];

  const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Module";
        
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      
      hasLoggedOpening.current = true;
    }
  }, []);

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Company Category Settings
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Company Category
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Company Category"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Company Category Name"
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
        density="compact"
        headers={headers}
        isLoading={isLoading}
        onReorderColumns={(fromIdx, toIdx) => {
          setTableColumns((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            return next;
          });
        }}
        headerActions={
          canCreate ? (
            <Button
              variant="primary"
              onClick={handleAdd}
              leftIcon={<Plus size={18} />}
            >
              Add Company Category
            </Button>
          ) : null
        }
        renderRow={(CompanyCategory, index) => (
          <tr
            key={CompanyCategory.id || index}
            onContextMenu={(e) => handleContextMenu(e, CompanyCategory)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => (
              <td
                key={col.key}
                className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
              >
                {col.render(CompanyCategory)}
              </td>
            ))}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <CompanyCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCompanyCategory}
        moduleName={routeName}
        editingCompanyCategory={editingCompanyCategory}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Company Category"
        message="Are you sure you want to delete this company category? This action cannot be undone."
      />
    </div>
  );
};

export default CompanyCategory;