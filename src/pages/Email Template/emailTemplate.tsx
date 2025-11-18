import React, { useState, useEffect, useMemo } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getEmailTemplatesApi, deleteEmailTemplateApi, type EmailTemplateData } from "../../api/emailTemplateApi/emailTemplateApi";
import { EmailTemplateModal } from "../../components/modals/EmailTemplateModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const EmailTemplatePage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter State
  const [nameFilter, setNameFilter] = useState("");

  const location = useLocation();
  const routeName = location.pathname.split('/')[1] || ''; 

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getEmailTemplatesApi(routeName);
      setTemplates(data);
    } catch (error) {
      toast.error("Failed to fetch email templates.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [routeName]); 

  // Search Logic
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const name = template.name || "";
      return name.toLowerCase().includes(nameFilter.toLowerCase());
    });
  }, [templates, nameFilter]);

  // Delete Logic
  const handleDelete = async () => {
    if (deleteId) {
        try {
            await deleteEmailTemplateApi(deleteId, routeName);
            toast.success("Template deleted successfully.");
            fetchTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to delete template.");
        }
        setDeleteId(null);
    }
  };
  
  const handleEdit = (template: EmailTemplateData) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };
  
  const handleAdd = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Name", "Content", "Actions"];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Email Templates
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Email Templates</span>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard
        onSearch={fetchTemplates}
        onClear={() => setNameFilter("")}
      >
          <Input
            label="Search by Name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Template name"
            className="md:col-span-2"
          />
      </FilterCard>

      {/* Data Table */}
      <DataTable 
        data={filteredTemplates}
        headers={headers}
        isLoading={isLoading}
        headerActions={
            <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>
                Add Email Template
            </Button>
        }
        renderRow={(template, index) => (
          <tr key={template.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
             <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
               {index + 1}
             </td>
             <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">{template.name}</td>
             
             <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
               <div 
                 className="block w-full max-w-xs overflow-hidden truncate whitespace-nowrap"
                 style={{
                   display: '-webkit-box',
                   WebkitLineClamp: 2,
                   WebkitBoxOrient: 'vertical',
                   overflow: 'hidden',
                   textOverflow: 'ellipsis',
                   whiteSpace: 'normal',
                   maxHeight: '2.5rem'
                 }}
               >
                 {stripHtml(template.content)}
               </div>
             </td>
             
             <td className="px-4 py-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="xs" onClick={() => handleEdit(template)}>
                      <Edit size={14} />
                  </Button>
                  <Button variant="danger" size="xs" onClick={() => setDeleteId(template.id!)}>
                      <Trash size={14} />
                  </Button>
                </div>
             </td>
          </tr>
        )}
      />

      {/* Modals */}
      <EmailTemplateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTemplates}
        moduleName={routeName}
        editingTemplate={editingTemplate}
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