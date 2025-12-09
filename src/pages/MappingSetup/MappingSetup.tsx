import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getMappingSetupsApi,
  deleteMappingSetupApi,
  type MappingSetupData,
} from "../../api/mappingSetupApi/mappingSetupApi";
import { MappingSetupModal } from "../../components/modals/MappingSetupModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import ViewButton from "../../components/ui/ViewButton";

const MappingSetup: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [data, setData] = useState<MappingSetupData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MappingSetupData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [headerFilter, setHeaderFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "mappingSetup";

  const fetchMappings = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        ratePlan: headerFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response = await getMappingSetupsApi(
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
      toast.error("Failed to fetch mappings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMappings();
  };

  const handleClearFilters = () => {
    setHeaderFilter("");
    setCurrentPage(1);
    fetchMappings({ ratePlan: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteMappingSetupApi(deleteId, routeName);
        toast.success("Mapping deleted.");
        fetchMappings();
      } catch (error) {
        toast.error("Failed to delete mapping.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (item: MappingSetupData) => {
    if (!canUpdate) return;
    setEditingMapping(item);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingMapping(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (item: MappingSetupData) => {
    setEditingMapping(item);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = [
    "S.N.",
    "RatePlan",
    "Country",
    "CountryCode",
    "TimeZone",
    "Network",
    "MCC",
    "MNC",
    "Rate",
    "CreatedAt",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Mapping Setup
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Mapping Setup
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search by RatePlan"
          value={headerFilter}
          onChange={(e) => setHeaderFilter(e.target.value)}
          placeholder="RatePlan..."
          className="md:col-span-2"
        />
      </FilterCard>

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
              Add Mapping Setup
            </Button>
          ) : null
        }
        renderRow={(item: MappingSetupData, index: number) => (
          <tr
            key={item.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {item.ratePlan}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.country}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.countryCode}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.timeZone}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.network || "-"}
            </td>

            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.MCC}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.MNC}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.rate || "-"}
            </td>

            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
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

      <MappingSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMappings}
        moduleName={routeName}
        editingMapping={editingMapping}
        isViewMode={isViewMode}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Mapping Setup"
        message="Are you sure you want to delete this mapping setup? This action cannot be undone."
      />
    </div>
  );
};

export default MappingSetup;
