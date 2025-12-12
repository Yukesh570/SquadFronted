import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getVendorsApi,
  deleteVendorApi,
  type VendorData,
} from "../../../api/connectivityApi/vendorApi";
import { VendorModal } from "../../../components/modals/Connectivity/VendorModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ViewButton from "../../../components/ui/ViewButton";
import Select from "../../../components/ui/Select";
import { usePagePermissions } from "../../../hooks/usePagePermissions";

const Vendor: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");
  const [companyNameFilter, setCompanyNameFilter] = useState("");
  const [connectionTypeFilter, setConnectionTypeFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "vendor";

  const fetchVendors = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const params = overrideParams || {
        profileName: nameFilter,
        companyName: companyNameFilter,
        connectionType: connectionTypeFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== "")
      );

      const response: any = await getVendorsApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setVendors(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setVendors(response);
        setTotalItems(response.length);
      } else {
        setVendors([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch vendors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVendors();
  };

  const handleClearFilters = () => {
    setNameFilter("");
    setCompanyNameFilter("");
    setConnectionTypeFilter("");
    setCurrentPage(1);
    fetchVendors({ profileName: "", companyName: "", connectionType: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteVendorApi(deleteId, routeName);
        toast.success("Vendor deleted.");
        fetchVendors();
      } catch (error) {
        toast.error("Failed to delete vendor.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (vendor: VendorData) => {
    if (!canUpdate) return;
    setEditingVendor(vendor);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingVendor(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (vendor: VendorData) => {
    setEditingVendor(vendor);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Profile Name", "Company Name", "Type", "Actions"];

  const connectionTypeOptions = [
    { label: "SMPP", value: "SMPP" },
    { label: "HTTP", value: "HTTP" },
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Vendor Profiles
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Vendor</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Profile"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Profile Name"
          className="md:col-span-2"
        />
        <Input
          label="Search Company Name"
          value={companyNameFilter}
          onChange={(e) => setCompanyNameFilter(e.target.value)}
          placeholder="Company Name"
          className="md:col-span-2"
        />
        <Select
          label="Connection Type"
          value={connectionTypeFilter}
          onChange={setConnectionTypeFilter}
          options={connectionTypeOptions}
          placeholder="Select Type"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={vendors}
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
              Add Vendor
            </Button>
          ) : null
        }
        renderRow={(vendor: any, index) => (
          <tr
            key={vendor.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {vendor.profileName}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {vendor.companyName}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  vendor.connectionType === "SMPP"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {vendor.connectionType}
              </span>
            </td>

            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(vendor)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(vendor)}
                    title="Edit Vendor"
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(vendor.id!)}
                    title="Delete Vendor"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />
      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchVendors}
        moduleName={routeName}
        editingVendor={editingVendor}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
      />
    </div>
  );
};

export default Vendor;
