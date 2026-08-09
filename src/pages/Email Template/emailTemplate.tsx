import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react"; 
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getEmailTemplatesApi,
  deleteEmailTemplateApi,
  type EmailTemplateData,
} from "../../api/emailTemplateApi/emailTemplateApi";
import { getSmtpServersApi } from "../../api/settingApi/smtpApi/smtpApi";
import { EmailTemplateModal } from "../../components/modals/EmailTemplateModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const EmailTemplatePage: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [templates, setTemplates] = useState<EmailTemplateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Map State for Translating Server ID to Name ---
  const [serverMap, setServerMap] = useState<Record<number, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<EmailTemplateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowTemplate, setSelectedRowTemplate] = useState<EmailTemplateData | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "emailTemplate";

  // --- Fetch SMTP Servers to build the translation dictionary ---
  useEffect(() => {
    const loadServerDictionary = async () => {
      try {
        const res: any = await getSmtpServersApi(routeName, 1, 100);
        const list = res.results || (Array.isArray(res) ? res : []);
        const mapping: Record<number, string> = {};
        list.forEach((item: any) => {
          mapping[item.id] = item.name;
        });
        setServerMap(mapping);
      } catch (error) {
        console.error("Failed to load SMTP server dictionary", error);
      }
    };
    loadServerDictionary();
  }, [routeName]);

  const fetchTemplates = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name__icontains: nameFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response: any = await getEmailTemplatesApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );
      if (response && response.results) {
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
      console.error("Fetch error:", error);
      toast.error("Failed to fetch email templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [routeName, currentPage, rowsPerPage]);

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
        await deleteEmailTemplateApi(deleteId, routeName);
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

  const handleEdit = (template: EmailTemplateData) => {
    if (!canUpdate) return;
    setEditingTemplate(template);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingTemplate(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (template: EmailTemplateData) => {
    setEditingTemplate(template);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: EmailTemplateData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowTemplate(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowTemplate ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowTemplate) },
    ...(canUpdate ? [{ label: "Edit Template", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowTemplate) }] : []),
    ...(canDelete ? [{ label: "Delete Template", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowTemplate.id!) }] : []),
  ] : [];

  const headers = ["S.N.", "Name", "Subject", "Email Server", "Content"];

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
          Email Templates
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Email Templates
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search by Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Email Template name"
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
        headerActions={
          canCreate ? (
            <Button
              variant="primary"
              onClick={handleAdd}
              leftIcon={<Plus size={18} />}
            >
              Add Template
            </Button>
          ) : null
        }
        renderRow={(template, index) => (
          <tr
            key={template.id || index}
            onContextMenu={(e) => handleContextMenu(e, template)} 
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white font-medium">
              {template.name}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-300">
              {template.subject || "-"}
            </td>
            
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-300">
              {template.emailServer ? serverMap[template.emailServer] || `ID: ${template.emailServer}` : "-"}
            </td>

            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
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
            </td>
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <EmailTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchTemplates();
        }}
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

export default EmailTemplatePage;