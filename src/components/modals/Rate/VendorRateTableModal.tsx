import React, { useState } from "react";
import { DeleteModal } from "../DeleteModal";
import { 
  deleteVendorRateApi, 
  getVendorRatesApi 
} from "../../../api/rateApi/vendorRateApi";
import { VendorRateModal } from "./VendorRateModal"; 
import { toast } from "react-toastify";
import { RateVersionTableModal } from "./RateVersionTableModal";

interface VendorRateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateGroup: string | null;
  moduleName: string;
  canUpdate: boolean;
  canDelete: boolean;
  countryMap: Record<string, string>;
  timezoneMap: Record<string, string>;
}

export const VendorRateTableModal: React.FC<VendorRateTableModalProps> = ({
  isOpen,
  onClose,
  rateGroup,
  moduleName,
  canUpdate,
  canDelete,
  countryMap,
  timezoneMap
}) => {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // ⚡️ FIX: Used refreshTrigger as key to force remount/refresh of the inner table when a rate is deleted or added.
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
  const [editingRate, setEditingRate] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteVendorRateApi(deleteId, moduleName);
        toast.success("Rate deleted successfully.");
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        toast.error("Failed to delete rate.");
      }
      setDeleteId(null);
    }
  };

  return (
    <div key={refreshTrigger}> 
      {rateGroup && (
        <RateVersionTableModal
          isOpen={isOpen}
          onClose={onClose}
          ratePlan={rateGroup}
          moduleName={moduleName}
          fetchApi={getVendorRatesApi}
          deleteApi={deleteVendorRateApi}
          countryMap={countryMap}
          timezoneMap={timezoneMap}
          isVendorMode={true} 
          onEdit={(rateData) => {
             setEditingRate(rateData);
             setIsViewMode(false);
             setIsCreateModalOpen(true);
          }}
          onView={(rateData) => {
             setEditingRate(rateData);
             setIsViewMode(true);
             setIsCreateModalOpen(true);
          }}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}

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
        onSuccess={() => {
           setRefreshTrigger((prev) => prev + 1);
        }}
        moduleName={moduleName}
        editingRate={editingRate}
        isViewMode={isViewMode}
      />
    </div>
  );
};