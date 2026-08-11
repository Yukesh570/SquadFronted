import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getTemplatesApi,
  deleteTemplateApi,
  type templateData,
} from "../../api/campaignApi/campaignApi";
import { AddTemplateModal } from "../../components/modals/AddTemplateModal";
import { DeleteModal } from "../../components/modals/DeleteModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

interface ColumnConfig {
  key: string;
  label: string;
  render: (template: templateData) => React.ReactNode;
}

const DEFAULT_TABLE_COLUMNS = ["name", "content"];

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const CampaignTemplatePage: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [templates, setTemplates] = useState<templateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<templateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowTemplate, setSelectedRowTemplate] = useState<templateData | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Column Order State & Persistence ---
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("campaigntemplate_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("campaigntemplate_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  // Column definitions for dynamic rendering & dragging
  const allColumns: ColumnConfig[] = [
    {
      key: "name",
      label: "Name",
      render: (template) => (
        <span className="font-medium text-text-primary dark:text-white">
          {template.name}
        </span>
      ),
    },
    {
      key: "content",
      label: "Content",
      render: (template) => (
        <div
          className="block w-full max-w-xs overflow-hidden truncate"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
            maxHeight: "2.5rem",
          }}
        >
          {stripHtml(template.content)}
        </div>
      ),
    },
  ];

  // Map columns according to custom reordered user preference
  const visibleTableFields = tableColumns
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is ColumnConfig => Boolean(col));

  const headers = ["S.N.", ...visibleTableFields.map((col) => col.label)];

  const fetchTemplates = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name__icontains: nameFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response = await getTemplatesApi(
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if ("results" in response) {
        setTemplates(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setTemplates(response);
        setTotalItems(response.length);
      } else {
        setTemplates([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTemplates();
  };
  const handleClearFilters = () => {
    setNameFilter("");
    setCurrentPage(1);
    fetchTemplates({ name__icontains: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteTemplateApi(deleteId, routeName);
        toast.success("Template deleted successfully.");
        fetchTemplates();
      } catch (error: any) {
        toast.error(
          error.response?.data?.detail || "Failed to delete template."
        );
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (template: templateData) => { if (!canUpdate) return; setEditingTemplate(template); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingTemplate(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (template: templateData) => { setEditingTemplate(template); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: templateData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowTemplate(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowTemplate ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowTemplate) },
    ...(canUpdate ? [{ label: "Edit Template", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowTemplate) }] : []),
    ...(canDelete ? [{ label: "Delete Template", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowTemplate.id!) }] : []),
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
          Manage Campaign Templates
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Campaign Templates
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search by Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Template name"
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={templates}
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
              Create Template
            </Button>
          ) : null
        }
        renderRow={(template, index) => (
          <tr
            key={template.id || index}
            onContextMenu={(e) => handleContextMenu(e, template)}
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
                {col.render(template)}
              </td>
            ))}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <AddTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTemplates}
        moduleName={routeName}
        editingTemplate={editingTemplate}
        isViewMode={isViewMode}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
      />
    </div>
  );
};

export default CampaignTemplatePage;