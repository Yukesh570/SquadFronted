import React, { useState, useEffect } from "react";
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
import ViewButton from "../../components/ui/ViewButton";
import { usePagePermissions } from "../../hooks/usePagePermissions";

const CampaignList: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [campaigns, setCampaigns] = useState<CampaignFormData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] =
    useState<CampaignFormData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [nameFilter, setNameFilter] = useState("");
  const [objectiveFilter, setObjectiveFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "";

  const formatContent = (content: string) => {
    if (!content) return "";
    const strippedContent = content.replace(/<[^>]*>/g, "");
    const limit = 15;
    return strippedContent.length > limit
      ? `${strippedContent.substring(0, limit)}...`
      : strippedContent;
  };

  const fetchCampaigns = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        name: nameFilter,
        objective: objectiveFilter,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );

      const response: any = await getCampaignsApi(
        routeName,
        currentPage,
        rowsPerPage,
        cleanParams
      );
      if (response && response.results) {
        setCampaigns(response.results);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        setCampaigns(response);
        setTotalItems(response.length);
      } else {
        setCampaigns([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [routeName, currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCampaigns();
  };

  const handleClearFilters = () => {
    setNameFilter("");
    setObjectiveFilter("");
    setCurrentPage(1);
    fetchCampaigns({ name: "", objective: "" });
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
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
    if (!canUpdate) return;
    setEditingCampaign(campaign);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setEditingCampaign(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (campaign: CampaignFormData) => {
    setEditingCampaign(campaign);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const headers = [
    "S.N.",
    "Name",
    "Objective",
    "Content",
    "Schedule",
    "Actions",
  ];
  const objectiveOptions = [
    { label: "All", value: "" },
    { label: "Promotion", value: "Promotion" },
    { label: "Announcement", value: "Announcement" },
    { label: "Re-engagement", value: "Re-engagement" },
  ];

  return (
    <div className="container mx-auto">
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

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Campaign Name"
        />
        <Select
          label="Search Objective"
          value={objectiveFilter}
          onChange={setObjectiveFilter}
          options={objectiveOptions}
          placeholder="Filter by Objective"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={campaigns}
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
              Create Campaign
            </Button>
          ) : null
        }
        renderRow={(campaign, index) => (
          <tr
            key={campaign.id || index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
              {campaign.name}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Megaphone size={14} /> {campaign.objective}
              </span>
            </td>
            <td
              className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300"
              title={campaign.content?.replace(/<[^>]*>/g, "")}
            >
              {formatContent(campaign.content)}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Calendar size={14} /> {campaign.schedule}
              </span>
            </td>
            <td className="px-4 py-4 text-sm">
              <div className="flex items-center space-x-2">
                <ViewButton onClick={() => handleView(campaign)} />
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleEdit(campaign)}
                    title="Edit Campaign"
                  >
                    <Edit size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeleteId(campaign.id!)}
                    title="Delete Campaign"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCampaigns}
        moduleName={routeName}
        editingCampaign={editingCampaign}
        isViewMode={isViewMode}
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
