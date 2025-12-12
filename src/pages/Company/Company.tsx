import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash, Download } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCompaniesApi,
  deleteCompanyApi,
  type CompanyData,
} from "../../api/companyApi/companyApi";
import { CompanyModal } from "../../components/modals/CompanyModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import ViewButton from "../../components/ui/ViewButton";
import { companyCsv, downloadStatus } from "../../api/downloadApi/downloadApi";
import { usePagePermissions } from "../../hooks/usePagePermissions";

const CompanyList: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "company";
  const handleExport = async () => {
    try {
      const data: any = await companyCsv(
        routeName,
        currentPage,
        rowsPerPage,
        nameFilter
      );

      if (!data || !data.task_id) {
        toast.error("Failed to start export process.");
        return;
      }

      const taskId = data.task_id;
      let attempts = 0;
      const maxAttempts = 5;

      toast.info("Export started. Please wait");

      const checkStatus = setInterval(async () => {
        attempts += 1;

        try {
          const res = await downloadStatus(routeName, taskId);

          if (res && res.ready) {
            clearInterval(checkStatus);

            if (res.download_url) {
              window.location.href = res.download_url;
              toast.success("Export successful!");
            } else {
              console.error("Download URL is missing from response:", res);
              toast.error("Export generated but URL is missing.");
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(checkStatus);
            toast.error(
              "Export timed out after 5 attempts. Please try again later."
            );
          }
        } catch (error) {
          console.error("Error checking CSV status:", error);
          if (attempts >= maxAttempts) {
            clearInterval(checkStatus);
            toast.error("Failed to check export status.");
          }
        }
      }, 2000);
    } catch (error) {
      console.error("Export API failed:", error);
      toast.error("Failed to initiate export.");
    }
  };
  const fetchCompanies = async (overrideParams?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );

      const response: any = await getCompaniesApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );
      if (response && response.results) {
        setCompanies(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setCompanies(response);
        setTotalItems(response.length);
      } else {
        setCompanies([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch companies.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCompanies();
  };
  const handleClearFilters = () => {
    setNameFilter("");
    setCurrentPage(1);
    fetchCompanies({ name: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCompanyApi(deleteId, routeName);
        toast.success("Company deleted.");
        fetchCompanies();
      } catch (error) {
        toast.error("Failed to delete company.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (company: CompanyData) => {
    if (!canUpdate) return;
    setEditingCompany(company);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingCompany(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (company: CompanyData) => {
    setEditingCompany(company);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Name", "Short Name", "Email", "Phone", "Actions"];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Companies
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Company</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Company"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Company Name"
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={companies}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={headers}
        isLoading={isLoading}
        headerActions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              leftIcon={<Download size={18} />}
            >
              Export
            </Button>
            {canCreate ? (
              <Button
                variant="primary"
                onClick={handleAdd}
                leftIcon={<Plus size={18} />}
              >
                Add Company
              </Button>
            ) : null}
          </div>
        }
        renderRow={(company, index) => (
          <tr
            key={company.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {company.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {company.shortName}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {company.companyEmail}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {company.phone}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(company)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(company)}
                    title="Edit Company"
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(company.id!)}
                    title="Delete Company"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCompanies}
        moduleName={routeName}
        editingCompany={editingCompany}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone."
      />
    </div>
  );
};

export default CompanyList;
