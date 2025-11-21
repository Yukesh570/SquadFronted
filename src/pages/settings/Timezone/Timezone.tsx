import React, { useState, useEffect, useMemo } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getTimezoneApi,
  deleteTimezoneApi,
  type TimezoneData,
} from "../../../api/settingApi/timezoneApi/timezoneApi";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ViewButton from "../../../components/ui/ViewButton";
import { TimezoneModal } from "../../../components/modals/Settings/timezonemodal";

const Timezone: React.FC = () => {
  const [timezones, setTimezones] = useState<TimezoneData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimezone, setEditingTimezone] = useState<TimezoneData | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "timezone";

  const fetchTimezones = async () => {
    setIsLoading(true);
    try {
      const response: any = await getTimezoneApi(
        routeName,
        currentPage,
        rowsPerPage
      );

      if (response && response.results) {
        setTimezones(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setTimezones(response);
        setTotalItems(response.length);
      } else {
        setTimezones([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      // Only show toast if it's a real error, not just empty list on load
      // toast.error("Failed to fetch entities.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimezones();
  }, [routeName, currentPage, rowsPerPage]);

  const filteredTimezones = useMemo(() => {
    if (!Array.isArray(timezones)) return [];
    return timezones.filter((c) =>
      (c.name || "").toLowerCase().includes(nameFilter.toLowerCase())
    );
  }, [timezones, nameFilter]);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteTimezoneApi(deleteId, routeName);
        toast.success("Timezone deleted.");
        fetchTimezones();
      } catch (error) {
        toast.error("Failed to delete timezone.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (timezone: TimezoneData) => {
    setEditingTimezone(timezone);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingTimezone(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (timezone: TimezoneData) => {
    setEditingTimezone(timezone);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Timezone Name", "Actions"];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Timezone Settings
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Timezone</span>
        </div>
      </div>

      <FilterCard onSearch={fetchTimezones} onClear={() => setNameFilter("")}>
        <Input
          label="Search Timezone"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Timezone Name..."
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={filteredTimezones}
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
            Add Timezone
          </Button>
        }
        renderRow={(timezone, index) => (
          <tr
            key={timezone.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {timezone.name}
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(timezone)} />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(timezone)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(timezone.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />
      <TimezoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTimezones}
        moduleName={routeName}
        editingTimezone={editingTimezone}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Timezone"
        message="Are you sure?"
      />
    </div>
  );
};

export default Timezone;
