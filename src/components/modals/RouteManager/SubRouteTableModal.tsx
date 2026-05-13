import React, { useState } from "react";
import Modal from "../../ui/Modal";
import { SubRouteEditableTable } from "../../ui/SubRouteEditableTable";
import { DeleteModal } from "../DeleteModal";
import { deleteCustomRouteApi } from "../../../api/routeManagerApi/customRouteApi";
import { CustomRouteModal } from "./CustomRouteModal"; 
import { toast } from "react-toastify";
import Button from "../../ui/Button"; 
import { Plus, Info } from "lucide-react"; 

interface SubRouteTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeGroup: string | null;
  moduleName: string;
  canUpdate: boolean;
  canDelete: boolean;
}

export const SubRouteTableModal: React.FC<SubRouteTableModalProps> = ({
  isOpen,
  onClose,
  routeGroup,
  moduleName,
  canUpdate,
  canDelete,
}) => {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteCustomRouteApi(deleteId, moduleName);
        toast.success("Route deleted successfully.");
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        toast.error("Failed to delete route.");
      }
      setDeleteId(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Routing Group Details: ${routeGroup || ""}`}
        className="max-w-[95vw] w-full" 
      >
        {/* FIX: Removed overflow-hidden to allow natural modal height adjustment */}
        <div className="p-4 w-full flex flex-col">
          
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 w-full shrink-0">
            <div className="flex items-start gap-3 flex-1">
              <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="flex flex-col space-y-1.5 text-[13px] text-gray-600 dark:text-gray-300 leading-tight">
                <p>
                  <span className="font-medium text-gray-900 dark:text-gray-100">To edit:</span> Click cells under <strong>Priority</strong> or <strong>Status</strong>. Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs mx-0.5 shadow-sm">Enter</kbd> to save.
                </p>
                <p>
                  <span className="font-medium text-red-500">Note:</span> Priority numbers must be unique among active routes.
                </p>
              </div>
            </div>

            {canUpdate && (
              <div className="shrink-0 w-full sm:w-auto">
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<Plus size={16} />}
                  className="w-full sm:w-auto text-sm py-1.5 px-4"
                >
                  Add Route
                </Button>
              </div>
            )}
          </div>
          
          {routeGroup && (
            // FIX: Removed min-h-[300px] and overflow-hidden to fix the massive empty space issue
            <div className="w-full">
              <SubRouteEditableTable
                routeGroup={routeGroup}
                moduleName={moduleName}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onDelete={(id) => setDeleteId(id)}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}
        </div>
      </Modal>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Specific Route"
        message="Are you sure you want to delete this route? This action cannot be undone."
      />

      <CustomRouteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
           setRefreshTrigger((prev) => prev + 1); 
        }}
        moduleName={moduleName}
        editingRoute={null}
        isViewMode={false}
        lockedName={routeGroup || undefined} 
      />
    </>
  );
};