import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCustomerRatesApi,
  deleteCustomerRateApi,
  type CustomerRateData,
} from "../../api/rateApi/customerRateApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";
import { CustomerRateModal } from "../../components/modals/Rate/CustomerRateModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import ViewButton from "../../components/ui/ViewButton";
import { usePagePermissions } from "../../hooks/usePagePermissions";

const CustomerRate: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();

  const [rates, setRates] = useState<CustomerRateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const [timezoneMap, setTimezoneMap] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CustomerRateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [planNameFilter, setPlanNameFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "customer";

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

      const response: any = await getCustomerRatesApi(
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
      toast.error("Failed to fetch customer rates.");
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
        await deleteCustomerRateApi(deleteId, routeName);
        toast.success("Customer rate deleted.");
        fetchRates();
      } catch (error) {
        toast.error("Failed to delete customer rate.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (rate: CustomerRateData) => {
    if (!canUpdate) return;
    setEditingRate(rate);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingRate(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (rate: CustomerRateData) => {
    setEditingRate(rate);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const renderCountry = (rate: CustomerRateData) => {
    if ((rate as any).countryName) return (rate as any).countryName;
    return countryMap[String(rate.country)] || rate.country;
  };

  const renderTimezone = (rate: CustomerRateData) => {
    if ((rate as any).timeZoneName) return (rate as any).timeZoneName;
    return timezoneMap[String(rate.timeZone)] || rate.timeZone;
  };

  const headers = [
    "S.N.",
    "RatePlan",
    "Country",
    "CountryCode",
    "TimeZone",
    "MCC",
    "Rate",
    "DateTime",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Customer Rates
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Customer Rates
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search by RatePlan"
          value={planNameFilter}
          onChange={(e) => setPlanNameFilter(e.target.value)}
          placeholder="RatePlan..."
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
            <Button
              variant="primary"
              onClick={handleAdd}
              leftIcon={<Plus size={18} />}
            >
              Add Customer Rate
            </Button>
          ) : null
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
              {renderCountry(item)}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.countryCode}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {renderTimezone(item)}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.MCC}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.rate}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.dateTime ? new Date(item.dateTime).toLocaleString() : "-"}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(item)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(item.id!)}
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      <CustomerRateModal
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
        title="Delete Customer Rate"
        message="Are you sure you want to delete this rate?"
      />
    </div>
  );
};

export default CustomerRate;
