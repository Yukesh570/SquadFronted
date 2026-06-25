import React, { useState } from "react";
import { DeleteModal } from "../DeleteModal";
import { 
  deleteCustomerRateApi, 
  getCustomerRatesApi 
} from "../../../api/rateApi/customerRateApi";
import { CustomerRateModal } from "./CustomerRateModal"; 
import { toast } from "react-toastify";
import { RateVersionTableModal } from "./RateVersionTableModal";

interface CustomerRateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateGroup: string | null;
  moduleName: string;
  canUpdate: boolean;
  canDelete: boolean;
  countryMap: Record<string, string>;
  timezoneMap: Record<string, string>;
}

export const CustomerRateTableModal: React.FC<CustomerRateTableModalProps> = ({
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
  // ⚡️ FIX: Used refreshTrigger as key to force remount/refresh of the inner table
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
  const [editingRate, setEditingRate] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCustomerRateApi(deleteId, moduleName);
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
          fetchApi={getCustomerRatesApi}
          deleteApi={deleteCustomerRateApi}
          countryMap={countryMap}
          timezoneMap={timezoneMap}
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
        title="Delete Customer Rate"
        message="Are you sure you want to delete this specific rate? This action cannot be undone."
      />

      <CustomerRateModal
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