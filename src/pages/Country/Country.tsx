import React, { useState, useEffect, useMemo } from "react";
import { Home, Plus, Edit, Trash, Search, Trash2, Download } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getCountriesApi, deleteCountryApi, type CountryData } from "../../api/settingApi/countryApi";
import { CountryModal } from "../../components/modals/CountryModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
// import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";

const Country: React.FC = () => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter States
  const [nameFilter, setNameFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");

  const location = useLocation();
  const routeName = location.pathname.split('/')[1] || '';

  const fetchCountries = async () => {
    setIsLoading(true);
    try {
      const data = await getCountriesApi(routeName);
      setCountries(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch countries.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, [routeName]);

  // Search Logic
  const filteredCountries = useMemo(() => {
    return countries.filter(c => 
      c.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
      c.code.toLowerCase().includes(codeFilter.toLowerCase())
    );
  }, [countries, nameFilter, codeFilter]);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteCountryApi(deleteId, routeName);
        toast.success("Country deleted.");
        fetchCountries();
      } catch (error) {
        toast.error("Failed to delete country.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (country: CountryData) => {
    setEditingCountry(country);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCountry(null);
    setIsModalOpen(true);
  };

  // Placeholder for Export function
  const handleExport = () => {
    toast.info("Export functionality coming soon!");
  };

  const headers = ["S.N.", "Country", "Code", "MCC", "Actions"];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">Country Settings</h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Country</span>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard
        onSearch={fetchCountries}
        onClear={() => { setNameFilter(""); setCodeFilter(""); }}
      >
        <Input label="Search Country" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Country Name..." />
        <Input label="Search Code" value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} placeholder="Country Code..." />
      </FilterCard>

      {/* Data Table */}
      <DataTable 
        data={filteredCountries}
        headers={headers}
        isLoading={isLoading}
        headerActions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport} leftIcon={<Download size={18}/>}>
              Export
            </Button>
            <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18}/>}>
              Add Country
            </Button>
          </div>
        }
        renderRow={(country, index) => (
          <tr key={country.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
             <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
               {index + 1}
             </td>
             <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">{country.name}</td>
             <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">{country.code}</td>
             <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">{country.mcc}</td>
             <td className="px-4 py-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="xs" onClick={() => handleEdit(country)}>
                      <Edit size={14}/>
                  </Button>
                  <Button variant="danger" size="xs" onClick={() => setDeleteId(country.id!)}>
                      <Trash size={14}/>
                  </Button>
                </div>
             </td>
          </tr>
        )}
      />

      {/* Modals */}
      <CountryModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         onSuccess={fetchCountries} 
         moduleName={routeName}
         editingCountry={editingCountry}
      />

      <DeleteModal 
         isOpen={!!deleteId} 
         onClose={() => setDeleteId(null)} 
         onConfirm={handleDelete} 
         title="Delete Country"
         message="Are you sure you want to delete this country? This action cannot be undone."
      />
    </div>
  );
};

export default Country;