import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
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
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

const Currency: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [currencies, setCurrencies] = useState<CurrencyData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowCurrency, setSelectedRowCurrency] = useState<CurrencyData | null>(null);

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
        name__icontains: nameFilter, // Updated to use icontains for backend filtering
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
    fetchCurrencies({ name__icontains: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
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

  const handleEdit = (currency: CurrencyData) => { if (!canUpdate) return; setEditingCurrency(currency); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingCurrency(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (currency: CurrencyData) => { setEditingCurrency(currency); setIsViewMode(true); setIsModalOpen(true); };

  const handleContextMenu = (e: React.MouseEvent, item: CurrencyData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowCurrency(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowCurrency ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowCurrency) },
    ...(canUpdate ? [{ label: "Edit Currency", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowCurrency) }] : []),
    ...(canDelete ? [{ label: "Delete Currency", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowCurrency.id!) }] : []),
  ] : [];

  // Updated headers to match the new API fields
  const headers = ["S.N.", "Currency Name", "Code", "Numeric Code", "Symbol", "Decimals", "Status"];

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
          placeholder="Currency Name"
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
          canCreate ? (
            <Button
              variant="primary"
              onClick={handleAdd}
              leftIcon={<Plus size={18} />}
            >
              Add Currency
            </Button>
          ) : null
        }
        renderRow={(currency, index) => (
          <tr
            key={currency.id || index}
            onContextMenu={(e) => handleContextMenu(e, currency)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {currency.name || "-"}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {currency.currencyCode || "-"}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {currency.numericCode || "-"}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {currency.symbol || "-"}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {currency.decimalPlaces ?? "-"}
            </td>
            <td className="px-4 py-4 text-sm">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  currency.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {currency.isActive ? "Active" : "Inactive"}
              </span>
            </td>
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

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
        message="Are you sure you want to delete this currency? This action cannot be undone."
      />
    </div>
  );
};

export default Currency;