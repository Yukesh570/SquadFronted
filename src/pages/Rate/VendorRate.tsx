import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getVendorRatesApi,
  deleteVendorRateApi,
  type VendorRateData,
} from "../../api/rateApi/vendorRateApi";
import { VendorRateModal } from "../../components/modals/Rate/VendorRateModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import ViewButton from "../../components/ui/ViewButton";

const VendorRate: React.FC = () => {
  const [rates, setRates] = useState<VendorRateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<VendorRateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [planNameFilter, setPlanNameFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "vendor";

  const fetchRates = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        ratePlan: planNameFilter,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );

      const response: any = await getVendorRatesApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setRates(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setRates(response);
        setTotalItems(response.length);
      } else {
        setRates([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch vendor rates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRates();
  };

  const handleClearFilters = () => {
    setPlanNameFilter("");
    setCurrentPage(1);
    fetchRates({ ratePlan: "" });
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteVendorRateApi(deleteId, routeName);
        toast.success("Vendor rate deleted successfully.");
        fetchRates();
      } catch (error) {
        toast.error("Failed to delete vendor rate.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (rate: VendorRateData) => {
    setEditingRate(rate);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRate(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (rate: VendorRateData) => {
    setEditingRate(rate);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  // Columns: Rate Plan, Country, MCC, Rate, Currency, Timezone, Actions
  const headers = [
    "S.N.",
    "Rate Plan",
    "Country",
    "MCC",
    "Rate",
    "Currency",
    "Timezone",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Vendor Rates
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Vendor Rates
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Plan"
          value={planNameFilter}
          onChange={(e) => setPlanNameFilter(e.target.value)}
          placeholder="Rate Plan..."
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={rates}
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
            Add Rate
          </Button>
        }
        renderRow={(item, index) => (
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
              {item.countryName}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.MCC}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.rate}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.currencyCode}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.timeZoneName}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(item)} />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(item)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(item.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      <VendorRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRates}
        moduleName={routeName}
        editingRate={editingRate}
        isViewMode={isViewMode}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor Rate"
        message="Are you sure you want to delete this vendor rate? This action cannot be undone."
      />
    </div>
  );
};

export default VendorRate;
