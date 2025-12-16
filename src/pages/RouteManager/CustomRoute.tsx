import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCustomRoutesApi,
  deleteCustomRouteApi,
  type CustomRouteData,
} from "../../api/routeManagerApi/customRouteApi";
// Import Dropdown APIs
import { getCompaniesApi } from "../../api/companyApi/companyApi";
import { getClientsApi } from "../../api/clientApi/clientApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getOperatorsApi } from "../../api/operatorApi/operatorApi";
import { getVendorsApi } from "../../api/connectivityApi/vendorApi";

import { CustomRouteModal } from "../../components/modals/RouteManager/CustomRouteModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import ViewButton from "../../components/ui/ViewButton";
import { usePagePermissions } from "../../hooks/usePagePermissions";

interface Option {
  label: string;
  value: string;
}

const CustomRoute: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [routes, setRoutes] = useState<CustomRouteData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<CustomRouteData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Filter State ---
  const [nameFilter, setNameFilter] = useState("");
  const [orgCompanyFilter, setOrgCompanyFilter] = useState("");
  const [orgClientFilter, setOrgClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [termCompanyFilter, setTermCompanyFilter] = useState("");
  const [termVendorFilter, setTermVendorFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // --- Options State ---
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<Option[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

  const location = useLocation();
  const routeName = location.pathname.split("/")[2] || "customRoute";

  const extractOptions = (response: any, labelKey: string = "name") => {
    let data = [];
    if (response && response.results) {
      data = response.results;
    } else if (Array.isArray(response)) {
      data = response;
    } else if (response && Array.isArray(response.data)) {
      data = response.data;
    }
    return data.map((item: any) => ({
      label: item[labelKey] || item.name || "Unknown",
      value: String(item.id),
    }));
  };

  useEffect(() => {
    const fetchAllOptions = async () => {
      try {
        const [companies, clients, countries, operators, vendors] =
          await Promise.all([
            getCompaniesApi("company", 1, 1000),
            getClientsApi("client", 1, 1000),
            getCountriesApi("country", 1, 1000),
            getOperatorsApi("operator", 1, 1000),
            getVendorsApi("vendor", 1, 1000),
          ]);

        setCompanyOptions(extractOptions(companies, "name"));
        setClientOptions(extractOptions(clients, "name"));
        setCountryOptions(extractOptions(countries, "name"));
        setOperatorOptions(extractOptions(operators, "name"));
        setVendorOptions(extractOptions(vendors, "profileName"));
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    };
    fetchAllOptions();
  }, []);

  const fetchRoutes = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
        orginatingCompany: orgCompanyFilter,
        orginatingClient: orgClientFilter,
        status: statusFilter,
        country: countryFilter,
        operator: operatorFilter,
        terminatingCompany: termCompanyFilter,
        terminatingVendor: termVendorFilter,
        priority: priorityFilter,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );

      const response: any = await getCustomRoutesApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setRoutes(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setRoutes(response);
        setTotalItems(response.length);
      } else {
        setRoutes([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      if (error.response?.status === 403) {
        toast.error("Permission denied: Cannot access Custom Routes.");
      } else {
        toast.error("Failed to fetch custom routes.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRoutes();
  };

  const handleClearFilters = () => {
    setNameFilter("");
    setOrgCompanyFilter("");
    setOrgClientFilter("");
    setStatusFilter("");
    setCountryFilter("");
    setOperatorFilter("");
    setTermCompanyFilter("");
    setTermVendorFilter("");
    setPriorityFilter("");
    setCurrentPage(1);

    fetchRoutes({
      name: "",
      orginatingCompany: "",
      orginatingClient: "",
      status: "",
      country: "",
      operator: "",
      terminatingCompany: "",
      terminatingVendor: "",
      priority: "",
    });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCustomRouteApi(deleteId, routeName);
        toast.success("Route deleted successfully.");
        fetchRoutes();
      } catch (error) {
        toast.error("Failed to delete route.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (route: CustomRouteData) => {
    if (!canUpdate) return;
    setEditingRoute(route);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingRoute(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (route: CustomRouteData) => {
    setEditingRoute(route);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    handleDelete();
  };

  const headers = [
    "S.N.",
    "Name",
    "Originating Company",
    "Originating Client",
    "Status",
    "Country",
    "Operator",
    "Terminating Company",
    "Terminating Vendor",
    // "Priority",
    "Actions",
  ];

  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Custom Route
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Custom Route
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Route Name"
        />
        <Select
          label="Originating Company"
          value={orgCompanyFilter}
          onChange={setOrgCompanyFilter}
          options={companyOptions}
          placeholder="Select Company"
        />
        <Select
          label="Originating Client"
          value={orgClientFilter}
          onChange={setOrgClientFilter}
          options={clientOptions}
          placeholder="Select Client"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="Select Status"
        />
        <Select
          label="Country"
          value={countryFilter}
          onChange={setCountryFilter}
          options={countryOptions}
          placeholder="Select Country"
        />
        <Select
          label="Operator"
          value={operatorFilter}
          onChange={setOperatorFilter}
          options={operatorOptions}
          placeholder="Select Operator"
        />
        <Select
          label="Terminating Company"
          value={termCompanyFilter}
          onChange={setTermCompanyFilter}
          options={companyOptions}
          placeholder="Select Company"
        />
        <Select
          label="Terminating Vendor"
          value={termVendorFilter}
          onChange={setTermVendorFilter}
          options={vendorOptions}
          placeholder="Select Vendor"
        />
        {/* Optional Priority Filter */}
        {/* <Input
          label="Priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          placeholder="Priority"
        /> */}
      </FilterCard>

      <DataTable
        serverSide={true}
        data={routes}
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
              Create Route
            </Button>
          ) : null
        }
        renderRow={(route, index) => (
          <tr
            key={route.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {route.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {route.orginatingCompanyName || "-"}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {route.orginatingClientName || "-"}
            </td>
            <td className="px-4 py-4 text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  route.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {route.status}
              </span>
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {route.countryName || "-"}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {route.operatorName || "-"}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {route.terminatingCompanyName || "-"}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {route.terminatingVendorProfileName || "-"}
            </td>
            {/* <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {route.priority || "-"}
            </td> */}
            <td className="px-4 py-4 text-sm whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(route)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(route)}
                    title="Edit Route"
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(route.id!)}
                    title="Delete Route"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      <CustomRouteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRoutes}
        moduleName={routeName}
        editingRoute={editingRoute}
        isViewMode={isViewMode}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Route"
        message="Are you sure you want to delete this route? This action cannot be undone."
      />
    </div>
  );
};

export default CustomRoute;
