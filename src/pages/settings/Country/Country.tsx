import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Download, Upload, Eye } from "lucide-react"; // Added Eye icon
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCountriesApi,
  deleteCountryApi,
  importCountryApi,
  getImportStatusApi,
  type CountryData,
} from "../../../api/settingApi/countryApi/countryApi";
import { CountryModal } from "../../../components/modals/Settings/CountryModal";
import { ImportModal } from "../../../components/modals/ImportModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
// ViewButton removed
import {
  countryCsv,
  downloadStatus,
} from "../../../api/downloadApi/downloadApi";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
// NEW: Context Menu
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

const Country: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowCountry, setSelectedRowCountry] = useState<CountryData | null>(null);

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [mccFilter, setMccFilter] = useState("");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "country"; // Adjusted routeName fallback if needed

  const handleExport = async () => {
    try {
      const data: any = await countryCsv(
        routeName,
        currentPage,
        rowsPerPage,
        nameFilter,
        codeFilter,
        mccFilter
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

  const fetchCountries = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
        countryCode: codeFilter,
        MCC: mccFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response: any = await getCountriesApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setCountries(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setCountries(response);
        setTotalItems(response.length);
      } else {
        setCountries([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      if (error.response && error.response.status !== 404) {
        toast.error("Failed to fetch countries.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCountries();
  };
  const handleClearFilters = () => {
    setNameFilter("");
    setCodeFilter("");
    setMccFilter("");
    setCurrentPage(1);
    fetchCountries({ name: "", countryCode: "", MCC: "" }); // Pass empty filters to clear immediately
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCountryApi(deleteId, routeName);
        toast.success("Country deleted.");
        fetchCountries();
      } catch (error) {
        toast.error("Failed to delete country.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (country: CountryData) => { if (!canUpdate) return; setEditingCountry(country); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingCountry(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (country: CountryData) => { setEditingCountry(country); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: CountryData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowCountry(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowCountry ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowCountry) },
    ...(canUpdate ? [{ label: "Edit Country", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowCountry) }] : []),
    ...(canDelete ? [{ label: "Delete Country", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowCountry.id!) }] : []),
  ] : [];

  // Removed "Actions" from headers
  const headers = ["S.N.", "Country", "Code", "MCC"];

  const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      // The setTimeout is CRUCIAL here to wait for the sidebar to update
      setTimeout(() => {
        const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Module";
        
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100); // Waits 0.1 seconds
      
      hasLoggedOpening.current = true;
    }
  }, []);

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Country Settings
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Country</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Country"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Country Name"
          className="md:col-span-2"
        />
        <Input
          label="Search Code"
          value={codeFilter}
          onChange={(e) => setCodeFilter(e.target.value)}
          placeholder="Country Code"
          className="md:col-span-2"
        />
        <Input
          label="Search MCC"
          value={mccFilter}
          onChange={(e) => setMccFilter(e.target.value)}
          placeholder="MCC"
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={countries}
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
            {canCreate && (
              <Button
                variant="secondary"
                onClick={() => setIsImportModalOpen(true)}
                leftIcon={<Upload size={18} />}
              >
                Import
              </Button>
            )}
            {canCreate && (
              <Button
                variant="primary"
                onClick={handleAdd}
                leftIcon={<Plus size={18} />}
              >
                Add Country
              </Button>
            )}
          </div>
        }
        renderRow={(country, index) => (
          <tr
            key={country.id || index}
            onContextMenu={(e) => handleContextMenu(e, country)} // Right Click Handler
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {country.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {country.countryCode}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {country.MCC}
            </td>
            {/* ACTION COLUMN REMOVED */}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <CountryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCountries}
        moduleName={routeName}
        editingCountry={editingCountry}
        isViewMode={isViewMode}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchCountries}
        importApi={importCountryApi}
        checkStatusApi={getImportStatusApi}
        title="Import Countries"
        sampleFileLink="/country_sample.csv"
        sampleFileName="country_sample.csv"
        fileKey="file"
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Country"
        message="Are you sure you want to delete this country? This action cannot be undone."
      />
    </div>
  );
};

export default Country;