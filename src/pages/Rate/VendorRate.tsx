import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash, Upload, Eye } from "lucide-react"; // Added Eye icon
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getVendorRatesApi,
  deleteVendorRateApi,
  type VendorRateData,
} from "../../api/rateApi/vendorRateApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";
import { VendorRateModal } from "../../components/modals/Rate/VendorRateModal";
import { ImportVendorRateModal } from "../../components/modals/Rate/ImportVendorRateModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { usePagePermissions } from "../../hooks/usePagePermissions";
// ViewButton removed
// NEW: Context Menu
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";

const VendorRate: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();

  const [rates, setRates] = useState<VendorRateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const [timezoneMap, setTimezoneMap] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<VendorRateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowRate, setSelectedRowRate] = useState<VendorRateData | null>(null);

  const [planNameFilter, setPlanNameFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "vendor";

  // Fetch Lookups
  useEffect(() => {
    getCountriesApi("country", 1, 1000)
      .then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        const map: Record<string, string> = {};
        list.forEach((c: any) => {
          map[String(c.id)] = c.name;
        });
        setCountryMap(map);
      })
      .catch((err) => console.error(err));

    if (typeof getTimezoneApi === "function") {
      getTimezoneApi("timezone", 1, 1000)
        .then((res: any) => {
          const list = res.results || (Array.isArray(res) ? res : []);
          const map: Record<string, string> = {};
          list.forEach((t: any) => {
            map[String(t.id)] = t.name;
          });
          setTimezoneMap(map);
        })
        .catch((err) => console.error(err));
    }
  }, []);

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
      console.error(error);
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
    if (deleteId && canDelete) {
      try {
        await deleteVendorRateApi(deleteId, routeName);
        toast.success("Vendor rate deleted.");
        fetchRates();
      } catch (error) {
        toast.error("Failed to delete vendor rate.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (rate: VendorRateData) => { if (!canUpdate) return; setEditingRate(rate); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingRate(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleImportClick = () => { if (!canCreate) return; setIsImportModalOpen(true); };
  const handleView = (rate: VendorRateData) => { setEditingRate(rate); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: VendorRateData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowRate(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowRate ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowRate) },
    ...(canUpdate ? [{ label: "Edit Rate", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowRate) }] : []),
    ...(canDelete ? [{ label: "Delete Rate", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowRate.id!) }] : []),
  ] : [];

  const renderCountry = (rate: VendorRateData) => {
    if (rate.countryName) return rate.countryName;
    return countryMap[String(rate.country)] || rate.country;
  };

  const renderTimezone = (rate: VendorRateData) => {
    if (rate.timeZoneName) return rate.timeZoneName;
    return timezoneMap[String(rate.timeZone)] || rate.timeZone;
  };

  // Removed "Actions" from headers
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
    "DateTime",
  ];

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
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
          label="Search by RatePlan"
          value={planNameFilter}
          onChange={(e) => setPlanNameFilter(e.target.value)}
          placeholder="RatePlan"
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
          canCreate ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleImportClick}
                leftIcon={<Upload size={18} />}
              >
                Import CSV
              </Button>
              <Button
                variant="primary"
                onClick={handleAdd}
                leftIcon={<Plus size={18} />}
              >
                Add Vendor Rate
              </Button>
            </div>
          ) : null
        }
        renderRow={(item, index) => (
          <tr
            key={item.id || index}
            onContextMenu={(e) => handleContextMenu(e, item)} // Right Click Handler
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {item.ratePlan}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {renderCountry(item)}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.countryCode}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {renderTimezone(item)}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.network}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.MCC}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.MNC}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.rate}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.dateTime ? new Date(item.dateTime).toLocaleString() : "-"}
            </td>
            {/* ACTION COLUMN REMOVED */}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <VendorRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRates}
        moduleName={routeName}
        editingRate={editingRate}
        isViewMode={isViewMode}
      />

      <ImportVendorRateModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchRates}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor Rate"
        message="Are you sure you want to delete this rate? Action cannot be undone."
      />
    </div>
  );
};

export default VendorRate;