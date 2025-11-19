import React, { useState, useEffect, useMemo } from "react";
import { Home, Plus, Trash, Edit} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import { deleteStateApi, getStateApi, type StateData } from "../../api/settingApi/countryApi/countryApi";
import { StateModal } from "../../components/modals/stateModal";


const State: React.FC = () => {
  const [servers, setServers] = useState<StateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<StateData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter States
  const [nameFilter, setNameFilter] = useState("");
  const [hostFilter, setHostFilter] = useState("");

  const location = useLocation();
  const routeName = location.pathname.split('/')[1] || '';

  const fetchServers = async () => {
    setIsLoading(true);
    try {
      const data = await getStateApi(routeName);
      console.log("===-=-=-=-=-=-=-=-=-=-=-=-=-=-=",data);
      setServers(data.results);
    } catch (error) {
      toast.error("Failed to fetch SMTP servers.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [routeName]);

  // Search Logic
  const filteredServers = useMemo(() => {
    return servers.filter(server => 
      server.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }, [servers, nameFilter, hostFilter]);

  const handleClearFilters = () => {
    setNameFilter("");
    setHostFilter("");
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteStateApi(deleteId, routeName);
        toast.success("Email Host deleted.");
        fetchServers(); // Refresh list
      } catch (error) {
        toast.error("Failed to delete host.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (server: StateData) => {
    setEditingServer(server);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingServer(null);
    setIsModalOpen(true);
  };

  const headers = ["State", "Country", "Actions"];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          States
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Email Hosts</span>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard
        onSearch={fetchServers} 
        onClear={handleClearFilters}
      >
        <Input
          label="Search by Name"
          type="text"
          placeholder="user@email.com"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="md:col-span-2"
        />
        <Input
          label="Search by SMTP Host"
          type="text"
          placeholder="smtp.gmail.com"
          value={hostFilter}
          onChange={(e) => setHostFilter(e.target.value)}
          className="md:col-span-2"
        />
      </FilterCard>

      {/* Data Table */}
      <DataTable 
        data={filteredServers}
        headers={headers}
        isLoading={isLoading}
        headerActions={
            <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18}/>}>
                Add State
            </Button>
        }
        renderRow={(server, index) => (
          <tr key={server.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
             <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">{server.name}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">{server.countryName}</td>

             <td className="px-4 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="xs" onClick={() => handleEdit(server)}>
                      <Edit size={14}/>
                  </Button>
                  <Button variant="danger" size="xs" onClick={() => setDeleteId(server.id!)}>
                      <Trash size={14}/>
                  </Button>
                </div>
             </td>
          </tr>
        )}
      />

      {/* Modals */}
      <StateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchServers}
        moduleName={routeName}
        editingServer={editingServer}
      />

      <DeleteModal 
         isOpen={!!deleteId} 
         onClose={() => setDeleteId(null)} 
         onConfirm={handleDelete} 
         title="Delete Email Host"
         message="Are you sure you want to delete this host? This action cannot be undone."
      />
    </div>
  );
};

export default State;