import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
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
import ViewButton from "../../../components/ui/ViewButton";

const CompanyCategory: React.FC = () => {
  const [entities, setEntities] = useState<CompanyCategoryData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyCategory, setEditingCompanyCategory] =
    useState<CompanyCategoryData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "CompanyCategory";

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
      // Only show toast if it's a real error, not just empty list on load
      // toast.error("Failed to fetch entities.");
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
    if (deleteId) {
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

  const handleEdit = (CompanyCategory: CompanyCategoryData) => {
    setEditingCompanyCategory(CompanyCategory);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCompanyCategory(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (CompanyCategory: CompanyCategoryData) => {
    setEditingCompanyCategory(CompanyCategory);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Company Category Name", "Actions"];

  return (
    <div className="container mx-auto">
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
          placeholder="Company Category Name..."
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
        headers={headers}
        isLoading={isLoading}
        headerActions={
          <Button
            variant="primary"
            onClick={handleAdd}
            leftIcon={<Plus size={18} />}
          >
            Add Company Category
          </Button>
        }
        renderRow={(CompanyCategory, index) => (
          <tr
            key={CompanyCategory.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {CompanyCategory.name}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(CompanyCategory)} />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(CompanyCategory)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(CompanyCategory.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />
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
