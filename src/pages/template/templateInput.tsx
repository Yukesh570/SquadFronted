import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
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
import ViewButton from "../../components/ui/ViewButton";

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const CampaignTemplatePage: React.FC = () => {
  const [templates, setTemplates] = useState<templateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<templateData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  const fetchTemplates = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response = await getTemplatesApi(
        currentPage,
        rowsPerPage,
        cleanParams
      );

      // 1. FIX: Handle both Object and Array responses
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
    fetchTemplates({ name: "" });
  };

  const handleDelete = async () => {
    if (deleteId) {
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

  const handleEdit = (template: templateData) => {
    setEditingTemplate(template);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (template: templateData) => {
    setEditingTemplate(template);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Name", "Content", "Actions"];

  return (
    <div className="container mx-auto">
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
        headers={headers}
        isLoading={isLoading}
        headerActions={
          <Button
            variant="primary"
            onClick={handleAdd}
            leftIcon={<Plus size={18} />}
          >
            Create Template
          </Button>
        }
        renderRow={(template, index) => (
          <tr
            key={template.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {template.name}
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

            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(template)} />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(template)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(template.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

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
        message="Are you sure you want to delete this template?"
      />
    </div>
  );
};

export default CampaignTemplatePage;
