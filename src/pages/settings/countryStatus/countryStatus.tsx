import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCompanyStatusApi,
  deleteCompanyStatusApi,
  type CompanyStatusData,
} from "../../../api/settingApi/companyStatusApi/companyStatusApi";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import { CompanyStatusModal } from "../../../components/modals/Settings/companyStatusModal";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

interface ColumnConfig {
  key: string;
  label: string;
  render: (data: CompanyStatusData) => React.ReactNode;
}

const DEFAULT_TABLE_COLUMNS = ["name"];

const CompanyStatus: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [entities, setEntities] = useState<CompanyStatusData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyStatus, setEditingCompanyStatus] = useState<CompanyStatusData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowStatus, setSelectedRowStatus] = useState<CompanyStatusData | null>(null);

  const [nameFilter, setNameFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Column Order State & Persistence ---
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("companystatus_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("companystatus_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "CompanyStatus";

  // Column definitions for dynamic rendering & dragging
  const allColumns: ColumnConfig[] = [
    {
      key: "name",
      label: "Company Status Name",
      render: (CompanyStatus) => (
        <span className="font-medium text-text-primary dark:text-white">
          {CompanyStatus.name}
        </span>
      ),
    },
  ];

  // Map columns according to custom reordered user preference
  const visibleTableFields = tableColumns
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is ColumnConfig => Boolean(col));

  const headers = ["S.N.", ...visibleTableFields.map((col) => col.label)];

  const fetchCompanyStatus = async (
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

      const response: any = await getCompanyStatusApi(
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
    fetchCompanyStatus();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCompanyStatus();
  };
  const handleClearFilters = () => {
    setNameFilter("");
    setCurrentPage(1);
    fetchCompanyStatus({ name: "" });
  };
  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCompanyStatusApi(deleteId, routeName);
        toast.success("Company Status deleted.");
        fetchCompanyStatus();
      } catch (error) {
        toast.error("Failed to delete Company Status.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (CompanyStatus: CompanyStatusData) => { if (!canUpdate) return; setEditingCompanyStatus(CompanyStatus); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingCompanyStatus(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (CompanyStatus: CompanyStatusData) => { setEditingCompanyStatus(CompanyStatus); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: CompanyStatusData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowStatus(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowStatus ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowStatus) },
    ...(canUpdate ? [{ label: "Edit Company Status", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowStatus) }] : []),
    ...(canDelete ? [{ label: "Delete Company Status", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowStatus.id!) }] : []),
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
          Company Status Settings
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Company Status
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Company Status"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Company Status Name"
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
              Add Company Status
            </Button>
          ) : null
        }
        renderRow={(CompanyStatus, index) => (
          <tr
            key={CompanyStatus.id || index}
            onContextMenu={(e) => handleContextMenu(e, CompanyStatus)}
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
                {col.render(CompanyStatus)}
              </td>
            ))}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <CompanyStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCompanyStatus}
        moduleName={routeName}
        editingCompanyStatus={editingCompanyStatus}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Company Status"
        message="Are you sure you want to delete this company status? This action cannot be undone."
      />
    </div>
  );
};

export default CompanyStatus;