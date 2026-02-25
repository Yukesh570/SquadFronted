import React, { useState, useEffect, useContext, useRef } from "react";
import { Plus, Edit, Trash, Home, Eye } from "lucide-react"; // Added Eye icon
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
// ViewButton removed
import { usePagePermissions } from "../../hooks/usePagePermissions";
// NEW: Context Menu
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

const ModuleList: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [modules, setModules] = useState<SideBarApi[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<SideBarApi | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowModule, setSelectedRowModule] = useState<SideBarApi | null>(null);

  // --- Filters ---
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

  const handleEdit = (module: SideBarApi) => { if (!canUpdate) return; setEditingModule(module); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingModule(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (module: SideBarApi) => { setEditingModule(module); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, module: SideBarApi) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowModule(module);
  };

  const menuItems: ContextMenuItem[] = selectedRowModule ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowModule) },
    ...(canUpdate ? [{ label: "Edit Module", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowModule) }] : []),
    ...(canDelete ? [{ label: "Delete Module", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowModule.id!) }] : []),
  ] : [];

  // Removed "Actions" from headers
  const headers = [
    "S.N.",
    "Label",
    "URL",
    "Icon",
    "Order",
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
            onContextMenu={(e) => handleContextMenu(e, module)} // Right Click Handler
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
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
            {/* ACTION COLUMN REMOVED */}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

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