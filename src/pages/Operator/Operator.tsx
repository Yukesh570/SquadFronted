import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getOperatorsApi,
  deleteOperatorApi,
  type OperatorData,
} from "../../api/operatorApi/operatorApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { OperatorModal } from "../../components/modals/OperatorModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import ViewButton from "../../components/ui/ViewButton";

const Operators: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [data, setData] = useState<OperatorData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [countryMap, setCountryMap] = useState<Record<number, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<OperatorData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Filters
  const [searchName, setSearchName] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "operator";

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response: any = await getCountriesApi("country", 1, 1000);
        let countryList = [];

        if (response && response.results) {
          countryList = response.results;
        } else if (Array.isArray(response)) {
          countryList = response;
        } else if (response && Array.isArray(response.data)) {
          countryList = response.data;
        }

        const mapping: Record<number, string> = {};
        countryList.forEach((c: any) => {
          mapping[c.id] = c.name;
        });
        setCountryMap(mapping);
      } catch (error) {
        console.error("Failed to load countries for mapping", error);
      }
    };

    fetchCountries();
  }, []);

  // 2. Fetch Operators
  const fetchOperators = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: searchName,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );

      const response = await getOperatorsApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setData(response.results);
        setTotalItems(response.count);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch operators.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOperators();
  };

  const handleClearFilters = () => {
    setSearchName("");
    setCurrentPage(1);
    fetchOperators({ name: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteOperatorApi(deleteId, routeName);
        toast.success("Operator deleted.");
        fetchOperators();
      } catch (error) {
        toast.error("Failed to delete operator.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (item: OperatorData) => {
    if (!canUpdate) return;
    setEditingOperator(item);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingOperator(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (item: OperatorData) => {
    setEditingOperator(item);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Operator Name", "Country", "MNC", "Actions"];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Operators
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Operators</span>
        </div>
      </div>

      {/* Filters */}
      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Operator Name..."
          className="md:col-span-2"
        />
      </FilterCard>

      {/* Table */}
      <DataTable
        serverSide={true}
        data={data}
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
              Add Operator
            </Button>
          ) : null
        }
        renderRow={(item: OperatorData, index: number) => (
          <tr
            key={item.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {item.name}
            </td>

            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {countryMap[item.country] || item.country}
            </td>

            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.MNC}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(item)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(item)}
                    title="Edit"
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(item.id!)}
                    title="Delete"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      <OperatorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchOperators}
        moduleName={routeName}
        editingOperator={editingOperator}
        isViewMode={isViewMode}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Operator"
        message="Are you sure you want to delete this operator? This action cannot be undone."
      />
    </div>
  );
};

export default Operators;
