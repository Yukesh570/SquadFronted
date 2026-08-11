import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Edit, Trash, Eye } from "lucide-react";
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
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import ContextMenu, { type ContextMenuItem } from "../../../components/ui/ContextMenu";
import { actionHelper } from "../../../helper/action";

interface ColumnConfig {
  key: string;
  label: string;
  render: (state: StateData) => React.ReactNode;
}

const DEFAULT_TABLE_COLUMNS = ["name", "country", "countryName"];

const State: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [states, setStates] = useState<StateData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowState, setSelectedRowState] = useState<StateData | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Column Order State & Persistence ---
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("state_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("state_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  // Column definitions for dynamic rendering & dragging
  const allColumns: ColumnConfig[] = [
    {
      key: "name",
      label: "State Name",
      render: (state) => (
        <span className="font-medium text-text-primary dark:text-white">
          {state.name}
        </span>
      ),
    },
    {
      key: "country",
      label: "Country ID",
      render: (state) => state.country || "-",
    },
    {
      key: "countryName",
      label: "Country Name",
      render: (state) => state.countryName || "-",
    },
  ];

  // Map columns according to custom reordered user preference
  const visibleTableFields = tableColumns
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is ColumnConfig => Boolean(col));

  const headers = ["S.N.", ...visibleTableFields.map((col) => col.label)];

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
    if (deleteId && canDelete) {
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

  const handleEdit = (state: StateData) => { if (!canUpdate) return; setEditingState(state); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingState(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (state: StateData) => { setEditingState(state); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, item: StateData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowState(item);
  };

  const menuItems: ContextMenuItem[] = selectedRowState ? [
    { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowState) },
    ...(canUpdate ? [{ label: "Edit State", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowState) }] : []),
    ...(canDelete ? [{ label: "Delete State", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowState.id!) }] : []),
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
          placeholder="State Name"
          className="md:col-span-2"
        />
        <Input
          label="Search Country"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          placeholder="Country Name"
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
              Add State
            </Button>
          ) : null
        }
        renderRow={(state, index) => (
          <tr
            key={state.id || index}
            onContextMenu={(e) => handleContextMenu(e, state)}
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
                {col.render(state)}
              </td>
            ))}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

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