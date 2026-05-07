import React, { useState } from "react";
import Modal from "../../ui/Modal";
import { SubRouteEditableTable } from "../../ui/SubRouteEditableTable";
import { DeleteModal } from "../DeleteModal";
import { deleteCustomRouteApi } from "../../../api/routeManagerApi/customRouteApi";
import { toast } from "react-toastify";

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
        className="max-w-[90vw] w-full" 
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 font-medium">
              <span className="bg-primary/10 text-primary px-1 py-0.5 rounded mr-2">Tip</span>
              Click cells under <span className="text-primary font-bold italic">Priority, or Status</span> to edit them instantly.
            </p>
          </div>
          {routeGroup && (
            <SubRouteEditableTable
              routeGroup={routeGroup}
              moduleName={moduleName}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onDelete={(id) => setDeleteId(id)}
              refreshTrigger={refreshTrigger}
            />
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
    </>
  );
};