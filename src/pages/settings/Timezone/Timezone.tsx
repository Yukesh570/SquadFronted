import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react"; // Added Eye icon
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
// ViewButton removed
import { TimezoneModal } from "../../../components/modals/Settings/timezonemodal";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
// NEW: Context Menu
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

const TimeZone: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [timezones, setTimezones] = useState<TimezoneData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimezone, setEditingTimezone] = useState<TimezoneData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowTimezone, setSelectedRowTimezone] = useState<TimezoneData | null>(null);

  const [nameFilter, setNameFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "timezone";

  const fetchTimezones = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      const response: any = await getTimezoneApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimezones();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTimezones();
  };
  const handleClearFilters = () => {
    setNameFilter("");
    setCurrentPage(1);
    fetchTimezones({ name: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
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

  const handleEdit = (timezone: TimezoneData) => { if (!canUpdate) return; setEditingTimezone(timezone); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingTimezone(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (timezone: TimezoneData) => { setEditingTimezone(timezone); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: TimezoneData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowTimezone(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowTimezone ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowTimezone) },
    ...(canUpdate ? [{ label: "Edit Timezone", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowTimezone) }] : []),
    ...(canDelete ? [{ label: "Delete Timezone", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowTimezone.id!) }] : []),
  ] : [];

  // Removed "Actions" from headers
  const headers = ["S.N.", "Timezone Name"];

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

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Timezone"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Timezone Name"
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={timezones}
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
              Add Timezone
            </Button>
          ) : null
        }
        renderRow={(timezone, index) => (
          <tr
            key={timezone.id || index}
            onContextMenu={(e) => handleContextMenu(e, timezone)} // Right Click Handler
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {timezone.name}
            </td>
            {/* ACTION COLUMN REMOVED */}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

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
        message="Are you sure you want to delete this timezone? This action cannot be undone."
      />
    </div>
  );
};

export default TimeZone;