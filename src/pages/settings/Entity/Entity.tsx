import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
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
import Select from "../../../components/ui/Select";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import AdvancedFilter, { type FilterColumn } from "../../../components/ui/AdvancedFilter";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

interface Option { label: string; value: string; }
interface ColumnConfig extends FilterColumn { render?: (data: any) => React.ReactNode; options?: Option[]; filterKey?: string; }

// FIXED: Defined all Advanced Columns
const DEFAULT_SEARCH_COLUMNS = ["companyName"];
const DEFAULT_TABLE_COLUMNS = ["companyLogo", "companyName", "legalEntityName", "weekCommencing", "emailAddress", "phone"];

const Entity: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowEntity, setSelectedRowEntity] = useState<EntityData | null>(null);

  // --- Advanced Filter States ---
  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("entity_table_columns_v1");
    try { return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS; } catch (e) { return DEFAULT_TABLE_COLUMNS; }
  });

  useEffect(() => { localStorage.setItem("entity_table_columns_v1", JSON.stringify(tableColumns)); }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "entity";

  // FIXED: Define all available columns for the entity table
  const allColumns: ColumnConfig[] = [
    { 
      key: "companyLogo", 
      label: "Logo", 
      type: "text",
      render: (data: any) => data.companyLogo ? (
        <img src={data.companyLogo} alt="logo" className="h-8 w-8 rounded-full object-cover bg-gray-100 border border-gray-200" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400">N/A</div>
      )
    },
    { key: "companyName", label: "Company Name", type: "text" },
    { key: "legalEntityName", label: "Legal Entity", type: "text" },
    { key: "weekCommencing", label: "Week Commencing", type: "text", options: [{ label: "Sunday", value: "SUNDAY" }, { label: "Monday", value: "MONDAY" }] },
    { key: "vatRegistrationNumber", label: "VAT Registration", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "emailAddress", label: "Email Address", type: "text" },
    { key: "businessAddress", label: "Business Address", type: "text" },
    { key: "bankAccountDetail", label: "Bank Details", type: "text" },
  ];

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key) && col.key !== "companyLogo");
  const visibleTableFields = allColumns.filter((col) => tableColumns.includes(col.key));

  const fetchEntities = async (filters: Record<string, string> | null = null) => {
    setIsLoading(true);
    try {
      const activeFilters = filters || filterValues;
      const currentSearchParams: Record<string, string> = {};
      
      searchColumns.forEach((key) => {
        const value = activeFilters[key];
        if (value) {
          const columnDef = allColumns.find((c) => c.key === key);
          if (columnDef?.options) {
            const selectedOption = columnDef.options.find((opt: Option) => opt.value === value);
            currentSearchParams[columnDef.filterKey || key] = selectedOption ? selectedOption.value : value; 
          } else { 
            currentSearchParams[columnDef?.filterKey || key] = value; 
          }
        }
      });

      const response: any = await getEntityApi(routeName, currentPage, rowsPerPage, currentSearchParams);

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
      toast.error("Failed to fetch entities.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEntities(); }, [routeName, currentPage, rowsPerPage, searchColumns]);

  const handleDelete = async () => {
    if (deleteId && canDelete) {
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

  const handleEdit = (entity: EntityData) => { if (!canUpdate) return; setEditingEntity(entity); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingEntity(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (entity: EntityData) => { setEditingEntity(entity); setIsViewMode(true); setIsModalOpen(true); };

  const handleContextMenu = (e: React.MouseEvent, item: EntityData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowEntity(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowEntity ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowEntity) },
    ...(canUpdate ? [{ label: "Edit Entity", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowEntity) }] : []),
    ...(canDelete ? [{ label: "Delete Entity", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowEntity.id!) }] : []),
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">Entity Settings</h1>
          
          {/* FIXED: Advanced Filters Integrated */}
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns.filter(c => c.key !== 'companyLogo')} selectedColumns={searchColumns} onFilter={setSearchColumns} onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)} isLoading={isLoading} buttonLabel="Search Fields" />
          </div>
          <div className="relative z-20">
            <AdvancedFilter columns={allColumns} selectedColumns={tableColumns} onFilter={setTableColumns} onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)} buttonLabel="Columns" />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span><span className="text-text-primary dark:text-white">Entity</span>
        </div>
      </div>

      <FilterCard onSearch={() => { setCurrentPage(1); fetchEntities(); }} onClear={() => { setFilterValues({}); setCurrentPage(1); fetchEntities({}); }}>
        {visibleSearchFields.map((col) => {
          if (col.options) {
            return (
              <Select 
                key={col.key} 
                label={`Search ${col.label}`} 
                value={filterValues[col.key] || ""} 
                onChange={(val) => setFilterValues(p => ({...p, [col.key]: val}))} 
                options={col.options} 
                placeholder={`Select ${col.label}`} 
              />
            );
          }
          return (
            <Input
              key={col.key}
              label={`Search ${col.label}`}
              value={filterValues[col.key] || ""}
              onChange={(e) => setFilterValues(p => ({...p, [col.key]: e.target.value}))}
              placeholder={`Search ${col.label}`}
            />
          );
        })}
      </FilterCard>

      <DataTable
        serverSide={true}
        data={entities}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={["S.N.", ...visibleTableFields.map(c => c.label)]}
        isLoading={isLoading}
        headerActions={
          canCreate ? (
            <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>
              Add Entity
            </Button>
          ) : null
        }
        renderRow={(entity, index) => (
          <tr
            key={entity.id || index}
            onContextMenu={(e) => handleContextMenu(e, entity)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              let cellContent: React.ReactNode = "-";
              const rawValue = (entity as any)[col.key];

              if (col.render) {
                cellContent = col.render(entity);
              } else if (col.key === "weekCommencing") {
                cellContent = rawValue ? <span className="capitalize">{rawValue.toLowerCase()}</span> : "-";
              } else {
                cellContent = rawValue || "-";
              }

              return (
                <td key={col.key} className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${col.key === "companyName" ? "font-medium text-primary" : ""}`}>
                  {cellContent}
                </td>
              );
            })}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

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