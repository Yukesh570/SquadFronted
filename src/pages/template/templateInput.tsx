import { useState, useEffect } from "react";
import { Home, Plus, ChevronLeft, ChevronRight, Edit, Trash } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { getTemplatesApi, type templateData } from "../../api/campaignApi/campaignApi";
import { AddTemplateModal } from "../../components/modals/AddTemplateModal";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

const rowsOptions = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
];

// This is the new page component
const TemplatePage = () => {
  const [templates, setTemplates] = useState<templateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState("10");

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getTemplatesApi();
      setTemplates(data);
    } catch (error) {
      toast.error("Failed to fetch templates.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const headers = ["Template Name", "Content", "Actions"];

  return (
    <div className="container mx-auto">
      {/* 1. BREADCRUMBS AND TITLE */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Manage Templates
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink
            to="/dashboard"
            className="text-gray-400 hover:text-primary"
          >
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Templates</span>
        </div>
      </div>

      {/* 2. FILTER CARD (We can add filters here later) */}
      {/* <div className="mb-6 rounded-xl bg-white p-5 shadow-card dark:bg-gray-800">
        ...
      </div> */}

      {/* 3. DATA TABLE CARD */}
      <div className="rounded-xl bg-white shadow-card overflow-hidden dark:bg-gray-800">
        {/* --- PAGINATION & "Add Template" BUTTON --- */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">Rows per page:</span>
              <div className="w-20">
                <Select
                  value={rowsPerPage}
                  onChange={setRowsPerPage}
                  options={rowsOptions}
                />
              </div>
            </div>
            <span className="text-sm text-text-secondary">
              1-10 of {templates.length}
            </span>
            <div className="flex items-center space-x-2">
              <button className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 disabled:text-gray-300" disabled>
                <ChevronLeft size={20} />
              </button>
              <button className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 disabled:text-gray-300" disabled>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Template
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-gray-300"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-4 py-6 text-center text-text-secondary"
                  >
                    Loading...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-4 py-6 text-center text-text-secondary"
                  >
                    No templates found.
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">{template.name}</td>
                    {/* Render HTML content safely and limit its height */}
                    <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
                      <div
                        className="max-h-20 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: template.content }}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <Button variant="secondary" size="xs">
                          <Edit size={14} />
                        </Button>
                        <Button variant="danger" size="xs">
                          <Trash size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render the Modal */}
      <AddTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTemplateAdded={() => {
          fetchTemplates(); // Refresh the table
        }}
      />
    </div>
  );
};

export default TemplatePage;