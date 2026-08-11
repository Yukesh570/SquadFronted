import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getTimezoneApi,
  deleteTimezoneApi,
  type TimezoneData,
} from "../../../api/settingApi/timezoneApi/timezoneApi";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import { TimezoneModal } from "../../../components/modals/Settings/timezonemodal";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

interface ColumnConfig {
  key: string;
  label: string;
  render: (timezone: TimezoneData) => React.ReactNode;
}

const DEFAULT_TABLE_COLUMNS = ["name", "utcOffset", "abbreviation"];

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

  // --- Filter States ---
  const [nameFilter, setNameFilter] = useState("");
  const [abbreviationFilter, setAbbreviationFilter] = useState("");

  // --- Dropdown Options ---
  const [abbreviationOptions, setAbbreviationOptions] = useState<{ label: string; value: string }[]>([]);

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Column Order State & Persistence ---
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("timezone_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("timezone_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeName = pathParts[pathParts.length - 1] || "timezone";

  // Column definitions for dynamic rendering & dragging
  const allColumns: ColumnConfig[] = [
    {
      key: "name",
      label: "Timezone Name",
      render: (timezone) => (
        <span className="font-medium text-text-primary dark:text-white">
          {timezone.name}
        </span>
      ),
    },
    {
      key: "utcOffset",
      label: "UTC Offset",
      render: (timezone) => timezone.utcOffset || "-",
    },
    {
      key: "abbreviation",
      label: "Abbreviation",
      render: (timezone) => timezone.abbreviation || "-",
    },
  ];

  // Map columns according to custom reordered user preference
  const visibleTableFields = tableColumns
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is ColumnConfig => Boolean(col));

  const headers = ["S.N.", ...visibleTableFields.map((col) => col.label)];

  // Fetch unique abbreviations on mount to populate the dropdown
  useEffect(() => {
    const fetchAbbreviations = async () => {
      try {
        const res: any = await getTimezoneApi(routeName, 1, 1000);
        let list = res.results || (Array.isArray(res) ? res : []);
        
        const uniqueAbbreviations = Array.from(new Set(list.map((tz: TimezoneData) => tz.abbreviation)))
          .filter(Boolean)
          .sort();

        setAbbreviationOptions(uniqueAbbreviations.map((abbr) => ({
          label: String(abbr),
          value: String(abbr),
        })));
      } catch (err) {
        console.error("Failed to fetch abbreviations for filter", err);
      }
    };
    
    fetchAbbreviations();
  }, [routeName]);

  const fetchTimezones = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
        abbreviation: abbreviationFilter,
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
    setAbbreviationFilter("");
    setCurrentPage(1);
    fetchTimezones({ name: "", abbreviation: "" });
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
        />
        <Select
          label="Search Abbreviation"
          value={abbreviationFilter}
          onChange={setAbbreviationFilter}
          options={abbreviationOptions}
          placeholder="Select Abbreviation"
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
        density="compact"
        headers={headers}
        isLoading={isLoading}
        onReorderColumns={(fromIdx, toIdx) => {
          setTableColumns((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            return next;
          });
        }}
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
            onContextMenu={(e) => handleContextMenu(e, timezone)} 
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => (
              <td
                key={col.key}
                className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
              >
                {col.render(timezone)}
              </td>
            ))}
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