import React, { useState, useEffect } from "react";
import { Home, Plus, Edit, Trash } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSmppApi,
  deleteSmppApi,
  type SmppData,
} from "../../../api/connectivityApi/smppApi";
import { SmppModal } from "../../../components/modals/Connectivity/SmppModal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/ui/DataTable";
import FilterCard from "../../../components/ui/FilterCard";
import Select from "../../../components/ui/Select";
import { DeleteModal } from "../../../components/modals/DeleteModal";
import ViewButton from "../../../components/ui/ViewButton";
import { usePagePermissions } from "../../../hooks/usePagePermissions";

const Smpp: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [smpps, setSmpps] = useState<SmppData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSmpp, setEditingSmpp] = useState<SmppData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [hostFilter, setHostFilter] = useState("");
  const [portFilter, setPortFilter] = useState("");
  const [systemIDFilter, setSystemIDFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const routeName = pathSegments[pathSegments.length - 1] || "connectivity";

  const fetchSmpp = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const params = overrideParams || {
        smppHost: hostFilter,
        smppPort: portFilter,
        systemID: systemIDFilter,
        bindMode: modeFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== "")
      );

      const response: any = await getSmppApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setSmpps(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setSmpps(response);
        setTotalItems(response.length);
      } else {
        setSmpps([]);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch SMPP configs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSmpp();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSmpp();
  };

  const handleClear = () => {
    setHostFilter("");
    setPortFilter("");
    setSystemIDFilter("");
    setModeFilter("");
    setCurrentPage(1);
    fetchSmpp({
      smppHost: "",
      smppPort: "",
      systemID: "",
      bindMode: "",
    });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteSmppApi(deleteId, routeName);
        toast.success("Deleted successfully.");
        fetchSmpp();
      } catch (error) {
        toast.error("Failed to delete.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (item: SmppData) => {
    if (!canUpdate) return;
    setEditingSmpp(item);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingSmpp(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (item: SmppData) => {
    setEditingSmpp(item);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Host", "Port", "System ID", "Mode", "Actions"];
  const bindModeOptions = [
    { label: "Transmitter", value: "TRANSMITTER" },
    { label: "Receiver", value: "RECEIVER" },
    { label: "Transceiver", value: "TRANSCEIVER" },
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          SMPP Connectivity
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">SMPP</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClear}>
        <Input
          label="Search Host"
          value={hostFilter}
          onChange={(e) => setHostFilter(e.target.value)}
          placeholder="SMPP Host..."
          className="md:col-span-2"
        />
        <Input
          label="Search Port"
          value={portFilter}
          onChange={(e) => setPortFilter(e.target.value)}
          placeholder="SMPP Port..."
          className="md:col-span-2"
        />
        <Input
          label="Search System ID"
          value={systemIDFilter}
          onChange={(e) => setSystemIDFilter(e.target.value)}
          placeholder="System ID..."
          className="md:col-span-2"
        />
        <Select
          label="Search Bind Mode"
          value={modeFilter}
          onChange={setModeFilter}
          options={bindModeOptions}
          placeholder="Bind Mode..."
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={smpps}
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
              Add Connectivity
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
              {item.smppHost}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.smppPort}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.systemID}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              {item.bindMode}
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
      <SmppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSmpp}
        moduleName={routeName}
        editingSmpp={editingSmpp}
        isViewMode={isViewMode}
      />
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Config"
        message="Are you sure you want to delete this SMPP configuration? This action cannot be undone."
      />
    </div>
  );
};

export default Smpp;
