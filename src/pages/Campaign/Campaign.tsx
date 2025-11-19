import React, { useState, useEffect, useMemo } from "react";
import { Home, Plus, Trash, Edit, Megaphone, Calendar } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCampaignsApi,
  deleteCampaignApi,
  type CampaignFormData,
} from "../../api/campaignApi/campaignApi";
import CampaignModal from "../../components/modals/CampaignModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";

const CampaignList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] =
    useState<CampaignFormData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter States
  const [nameFilter, setNameFilter] = useState("");
  const [objectiveFilter, setObjectiveFilter] = useState("");

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await getCampaignsApi(routeName);
      setCampaigns(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [routeName]);

  // Search Logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const name = String(c.name || "");
      const objective = String(c.objective || "");
      return (
        name.toLowerCase().includes(nameFilter.toLowerCase()) &&
        objective.toLowerCase().includes(objectiveFilter.toLowerCase())
      );
    });
  }, [campaigns, nameFilter, objectiveFilter]);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteCampaignApi(deleteId, routeName);
        toast.success("Campaign deleted.");
        fetchCampaigns();
      } catch (error) {
        toast.error("Failed to delete campaign.");
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (campaign: CampaignFormData) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCampaign(null);
    setIsModalOpen(true);
  };

  const headers = ["S.N.", "Name", "Objective", "Schedule", "Actions"];

  const objectiveOptions = [
    { label: "All", value: "" },
    { label: "Promotion", value: "Promotion" },
    { label: "Announcement", value: "Announcement" },
    { label: "Re-engagement", value: "Re-engagement" },
  ];

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Campaigns
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Campaigns</span>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard
        onSearch={fetchCampaigns}
        onClear={() => {
          setNameFilter("");
          setObjectiveFilter("");
        }}
      >
        <Input
          label="Search Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Campaign Name..."
        />
        <Select
          label="Search Objective"
          value={objectiveFilter}
          onChange={setObjectiveFilter}
          options={objectiveOptions}
          placeholder="Filter by Objective"
        />
      </FilterCard>

      {/* Data Table */}
      <DataTable
        data={filteredCampaigns}
        headers={headers}
        isLoading={isLoading}
        headerActions={
          <Button
            variant="primary"
            onClick={handleAdd}
            leftIcon={<Plus size={18} />}
          >
            Create Campaign
          </Button>
        }
        renderRow={(campaign, index) => (
          <tr
            key={campaign.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {campaign.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Megaphone size={14} /> {campaign.objective}
              </span>
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Calendar size={14} /> {campaign.schedule}
              </span>
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleEdit(campaign)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteId(campaign.id!)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Modals */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCampaigns}
        moduleName={routeName}
        editingCampaign={editingCampaign}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone."
      />
    </div>
  );
};

export default CampaignList;
