import React, { useState, useEffect } from "react";
import Modal from "../../ui/Modal";
import { DeleteModal } from "../DeleteModal";
import { 
  deleteVendorRateApi, 
  getVendorRatesApi 
} from "../../../api/rateApi/vendorRateApi";
import { VendorRateModal } from "./VendorRateModal"; 
import { RateVersionTableModal } from "./RateVersionTableModal";
import { ImportVendorRateModal } from "./ImportVendorRateModal"; 
import { toast } from "react-toastify";
import Button from "../../ui/Button"; 
import { Plus, Edit, Trash, Layers, Upload } from "lucide-react"; 
import { StatusBadge } from "../../ui/StatusBadge";
import ContextMenu, { type ContextMenuItem } from "../../ui/ContextMenu";

interface VendorRateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateGroup: string | null;
  rateGroupId: number | null; 
  moduleName: string;
  canUpdate: boolean;
  canDelete: boolean;
  countryMap: Record<string, string>;
  timezoneMap?: Record<string, string>;
}

export const VendorRateTableModal: React.FC<VendorRateTableModalProps> = ({
  isOpen,
  onClose,
  rateGroup,
  rateGroupId,
  moduleName,
  canUpdate,
  canDelete,
  countryMap,
}) => {
  const [latestRates, setLatestRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); 
  
  // ⚡️ FIX: Added state to hold the specific rate we want versions for
  const [versionTargetRate, setVersionTargetRate] = useState<any>(null);

  const [editingRate, setEditingRate] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  useEffect(() => {
    if (isOpen && rateGroup) {
      fetchLatestRates();
    } else {
      setLatestRates([]);
    }
  }, [isOpen, rateGroup]);

  const fetchLatestRates = async () => {
    setIsLoading(true);
    try {
      const res = await getVendorRatesApi(moduleName, 1, 1000, { rateGroup__name: rateGroup });
      const list = res.results || (Array.isArray(res) ? res : []);
      
      const groupedMap = new Map<string, any>();
      list.forEach((item: any) => {
        const key = `${item.country}-${item.network}-${item.MCC}-${item.MNC}`;
        const existing = groupedMap.get(key);
        if (!existing || (item.version || 0) > (existing.version || 0)) {
          groupedMap.set(key, item);
        }
      });

      setLatestRates(Array.from(groupedMap.values()));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load rates.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteVendorRateApi(deleteId, moduleName);
        toast.success("Rate deleted successfully.");
        fetchLatestRates();
      } catch (error) {
        toast.error("Failed to delete rate.");
      }
      setDeleteId(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, rate: any) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRate(rate);
  };

  const menuItems: ContextMenuItem[] = selectedRate ? [
    { 
      label: "Manage Versions", 
      icon: <Layers size={16} />, 
      onClick: () => {
        // ⚡️ FIX: Save the entire rate object to pass to the version modal
        setVersionTargetRate(selectedRate);
        setIsVersionsModalOpen(true);
      } 
    },
    ...(canUpdate ? [{ label: "Edit Rate", icon: <Edit size={16} />, onClick: () => { setEditingRate(selectedRate); setIsViewMode(false); setIsCreateModalOpen(true); } }] : []),
    ...(canDelete ? [{ label: "Delete", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRate.id) }] : []),
  ] : [];

  const headers = [
    "Country", "MCC", "MNC", "Country Code", "Network",  
    "Rate", "Version", "Status", "Effective From", "Effective To"
  ];

  const renderCountry = (rate: any) => {
    if (rate.countryName) return rate.countryName;
    return countryMap[String(rate.country)] || String(rate.country || "-");
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Routing Group Details: ${rateGroup || ""}`}
        className="max-w-[95vw] w-full" 
      >
        <div className="p-4 w-full flex flex-col" onClick={() => setContextMenuPos(null)}>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 w-full shrink-0">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex flex-col space-y-1.5 text-[13px] text-gray-600 dark:text-gray-300 leading-tight">
                <p>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Displaying Latest Rates:</span>{" "}
                  Shows the latest version of each country/network combination in this group.
                </p>
                <p>Right-click a row and select <strong>Manage Versions</strong> to view all versions.</p>
              </div>
            </div>
            {canUpdate && (
              <div className="flex shrink-0 w-full sm:w-auto gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsImportModalOpen(true)}
                  leftIcon={<Upload size={16} />}
                  className="w-full sm:w-auto text-sm py-1.5 px-4"
                >
                  Import
                </Button>
                <Button
                  variant="primary"
                  onClick={() => { setEditingRate(null); setIsViewMode(false); setIsCreateModalOpen(true); }}
                  leftIcon={<Plus size={16} />}
                  className="w-full sm:w-auto text-sm py-1.5 px-4"
                >
                  Add Rate
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                  {headers.map((h, i) => (
                    <th key={i} className="py-3 px-4 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={headers.length} className="text-center py-8 text-gray-500">Loading rates...</td></tr>
                ) : latestRates.length === 0 ? (
                  <tr><td colSpan={headers.length} className="text-center py-8 text-gray-500">No rates found in this group.</td></tr>
                ) : (
                  latestRates.map((v) => (
                    <tr
                      key={v.id}
                      onContextMenu={(e) => handleContextMenu(e, v)}
                      className="group border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-context-menu transition-colors"
                    >
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.network || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{renderCountry(v)}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.MCC || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.MNC || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.countryCode || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 font-medium whitespace-nowrap">{v.rate || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">v{v.version || 0}</td>
                      <td className="py-3 px-4"><StatusBadge status={v.status} /></td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.effectiveFrom ? new Date(v.effectiveFrom).toLocaleString() : "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.effectiveTo ? new Date(v.effectiveTo).toLocaleString() : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ContextMenu
          position={contextMenuPos}
          items={menuItems}
          onClose={() => { setContextMenuPos(null); setSelectedRate(null); }}
        />
      </Modal>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor Rate"
        message="Are you sure you want to delete this specific rate? This action cannot be undone."
      />

      <VendorRateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchLatestRates}
        moduleName={moduleName}
        editingRate={editingRate}
        isViewMode={isViewMode}
        rateGroupId={rateGroupId} 
      />

      {/* ⚡️ FIX: Pass versionTargetRate into ratePlanFilter */}
      <RateVersionTableModal
        isOpen={isVersionsModalOpen}
        onClose={() => { 
          setIsVersionsModalOpen(false); 
          setVersionTargetRate(null); // Clear target on close
        }}
        ratePlan={rateGroup}
        ratePlanFilter={versionTargetRate} 
        moduleName={moduleName}
        fetchApi={getVendorRatesApi}
        deleteApi={deleteVendorRateApi}
        countryMap={countryMap}
        isVendorMode={true}
        onEdit={(rateData) => { setEditingRate(rateData); setIsViewMode(false); setIsCreateModalOpen(true); }}
        onView={(rateData) => { setEditingRate(rateData); setIsViewMode(true); setIsCreateModalOpen(true); }}
        onRefresh={fetchLatestRates}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <ImportVendorRateModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchLatestRates}
        rateGroupId={rateGroupId} 
      />
    </>
  );
};