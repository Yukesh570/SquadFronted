import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCurrenciesApi,
  deleteCurrencyApi,
  type CurrencyData,
} from "../../../api/settingApi/currencyApi/currencyApi";
import { CurrencyModal } from "../../../components/modals/Settings/CurrencyModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ViewButton from "../../../components/ui/ViewButton";

const Currency: React.FC = () => {
  const [currencies, setCurrencies] = useState<CurrencyData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "currency";

  const fetchCurrencies = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response: any = await getCurrenciesApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setCurrencies(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setCurrencies(response);
        setTotalItems(response.length);
      } else {
        setCurrencies([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch currencies.");
      //   console.error("Fetch error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, [routeName, currentPage, rowsPerPage]);
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCurrencies();
  };
  const handleClearFilters = () => {
    setNameFilter("");
    setCurrentPage(1);
    fetchCurrencies({ name: "" });
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteCurrencyApi(deleteId, routeName);
        toast.success("Currency deleted.");
        fetchCurrencies();
      } catch (error) {
        toast.error("Failed to delete currency.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (currency: CurrencyData) => {
    setEditingCurrency(currency);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCurrency(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (currency: CurrencyData) => {
    setEditingCurrency(currency);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = [
    "S.N.",
    "Currency Name",
    "Country ID",
    "Country Name",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Currency Settings
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Currency</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Currency"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Currency Name..."
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={currencies}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={headers}
        isLoading={isLoading}
        headerActions={
          <div className="flex gap-2">
            {/* <Button
              variant="secondary"
              onClick={handleExport}
              leftIcon={<Download size={18} />}
            >
              Export
            </Button> */}
            <Button
              variant="primary"
              onClick={handleAdd}
              leftIcon={<Plus size={18} />}
            >
              Add Currency
            </Button>
          </div>
        }
        renderRow={(currency, index) => (
          <tr
            key={currency.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {currency.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {currency.country}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {currency.countryName || "-"}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(currency)} />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(currency)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(currency.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />
      <CurrencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCurrencies}
        moduleName={routeName}
        editingCurrency={editingCurrency}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Currency"
        message="Are you sure?"
      />
    </div>
  );
};

export default Currency;
