import React, { useState, useEffect, useRef } from "react";
import { Home, Plus, Trash, Edit, Megaphone, Calendar, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// --- APIs ---
import {
  getCampaignsApi,
  deleteCampaignApi,
  type CampaignFormData,
} from "../../api/campaignApi/campaignApi";

// --- Components ---
import CampaignModal from "../../components/modals/CampaignModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { usePagePermissions } from "../../hooks/usePagePermissions";
import { actionHelper } from "../../helper/action";

const CampaignList: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const [campaigns, setCampaigns] = useState<CampaignFormData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignFormData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Context Menu State ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowCampaign, setSelectedRowCampaign] = useState<CampaignFormData | null>(null);

  // --- Filters ---
  const [nameFilter, setNameFilter] = useState("");
  const [objectiveFilter, setObjectiveFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/")[1] || "campaign";

  const formatContent = (content: string) => {
    if (!content) return "";
    const strippedContent = content.replace(/<[^>]*>/g, "");
    const limit = 30;
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
      toast.error("Failed to fetch campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [routeName, currentPage, rowsPerPage]);

  // --- Handlers ---
  const handleSearch = () => { setCurrentPage(1); fetchCampaigns(); };
  const handleClearFilters = () => { setNameFilter(""); setObjectiveFilter(""); setCurrentPage(1); fetchCampaigns({ name: "", objective: "" }); };

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

  const handleEdit = (campaign: CampaignFormData) => { if (!canUpdate) return; setEditingCampaign(campaign); setIsViewMode(false); setIsModalOpen(true); };
  const handleAdd = () => { if (!canCreate) return; setEditingCampaign(null); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (campaign: CampaignFormData) => { setEditingCampaign(campaign); setIsViewMode(true); setIsModalOpen(true); };

  // --- Context Menu Logic ---
  const handleContextMenu = (e: React.MouseEvent, campaign: CampaignFormData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowCampaign(campaign);
  };

  const menuItems: ContextMenuItem[] = selectedRowCampaign ? [
    {
      label: "View Details",
      icon: <Eye size={16} />,
      onClick: () => handleView(selectedRowCampaign),
    },
    ...(canUpdate ? [{
      label: "Edit Campaign",
      icon: <Edit size={16} />,
      onClick: () => handleEdit(selectedRowCampaign),
    }] : []),
    ...(canDelete ? [{
      label: "Delete Campaign",
      icon: <Trash size={16} />,
      variant: "danger" as const,
      onClick: () => setDeleteId(selectedRowCampaign.id!),
    }] : []),
  ] : [];

  const headers = ["S.N.", "Name", "Vendor", "Objective", "Content", "Schedule"];
  
  const objectiveOptions = [
    { label: "All", value: "" },
    { label: "Promotion", value: "Promotion" },
    { label: "Announcement", value: "Announcement" },
    { label: "Re-engagement", value: "Re-engagement" },
  ];

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
          Campaigns
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">Home</NavLink>
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
        headerActions={canCreate ? (
          <Button variant="primary" onClick={handleAdd} leftIcon={<Plus size={18} />}>
            Create Campaign
          </Button>
        ) : null}
        renderRow={(campaign, index) => (
          <tr
            key={campaign.id || index}
            onContextMenu={(e) => handleContextMenu(e, campaign)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">{(currentPage - 1) * rowsPerPage + index + 1}</td>
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">{campaign.name}</td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">{campaign.vendor || "-"}</td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <span className="flex items-center gap-2"><Megaphone size={14} /> {campaign.objective}</span>
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300" title={campaign.content?.replace(/<[^>]*>/g, "")}>
              {formatContent(campaign.content)}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <span className="flex items-center gap-2"><Calendar size={14} /> {campaign.schedule}</span>
            </td>
          </tr>
        )}
      />

      <ContextMenu
        position={contextMenuPos}
        items={menuItems}
        onClose={() => setContextMenuPos(null)}
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