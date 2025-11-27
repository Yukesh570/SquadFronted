import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getStateApi,
  deleteStateApi,
  type StateData,
} from "../../../api/settingApi/stateApi/stateApi";
import { StateModal } from "../../../components/modals/Settings/StateModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ViewButton from "../../../components/ui/ViewButton";
// import Select from "../../components/ui/Select";

const State: React.FC = () => {
  const [states, setStates] = useState<StateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  const fetchStates = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
        countryName: countryFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response: any = await getStateApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );
      if (response && response.results) {
        setStates(response.results);
        setTotalItems(response.count);
      } else {
        setStates([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch states.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, [routeName, currentPage, rowsPerPage]);
  const handleSearch = () => {
    setCurrentPage(1);
    fetchStates();
  };
  const handleClearFilters = () => {
    setNameFilter("");
    setCountryFilter("");
    setCurrentPage(1);
    fetchStates({ name: "", countryName: "" });
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteStateApi(deleteId, routeName);
        toast.success("State deleted.");
        fetchStates();
      } catch (error) {
        toast.error("Failed to delete state.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (state: StateData) => {
    setEditingState(state);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingState(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (state: StateData) => {
    setEditingState(state);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = [
    "S.N.",
    "State Name",
    "Country ID",
    "Country Name",
    "Actions",
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          State Settings
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">State</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search State"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="State Name..."
          className="md:col-span-2"
        />
        <Input
          label="Search Country"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          placeholder="Country Name..."
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={states}
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
              variant="primary"
              onClick={handleAdd}
              leftIcon={<Plus size={18} />}
            >
              Add State
            </Button>
          </div>
        }
        renderRow={(state, index) => (
          <tr
            key={state.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {state.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {state.country}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {state.countryName || "-"}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(state)} />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(state)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(state.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />
      <StateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStates}
        moduleName={routeName}
        editingState={editingState}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete State"
        message="Are you sure you want to delete this state? This action cannot be undone."
      />
    </div>
  );
};

export default State;
