import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateClientApi, getClientRateOverViewApi, type ClientData } from "../../api/clientApi/clientApi";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal";

interface Option { label: string; value: string; }

interface ClientRoutingRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingClient: ClientData | null;
  routeGroupOptions: Option[];
  // ⚡️ FIX: Added customerRateGroupOptions
  customerRateGroupOptions: Option[];
}

export const ClientRoutingRateModal: React.FC<ClientRoutingRateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingClient,
  routeGroupOptions,
  customerRateGroupOptions,
}) => {
  const [formData, setFormData] = useState({
    routeGroup: "",
    customerRateGroup: "", // ⚡️ FIX: Swapped ratePlanName for customerRateGroup
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && editingClient) {
      setFormData({
        routeGroup: editingClient.routeGroup != null ? String(editingClient.routeGroup) : "",
        customerRateGroup: editingClient.customerRateGroup != null ? String(editingClient.customerRateGroup) : "",
      });
      setWarningMessage(null); 
    }
  }, [isOpen, editingClient]);

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    setWarningMessage(null); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.id) return;

    if (!warningMessage) {
      setIsSubmitting(true);
      try {
        const routeGroupName = routeGroupOptions.find(o => o.value === formData.routeGroup)?.label || formData.routeGroup;
        const customerRateGroupName = customerRateGroupOptions.find(o => o.value === formData.customerRateGroup)?.label || formData.customerRateGroup;

        // ⚡️ FIX: Passed the group name/ID appropriately for the Overview check
        const overviewRes = await getClientRateOverViewApi({
          client: editingClient.id,
          routeGroup: routeGroupName || "", 
          customerRateGroup: customerRateGroupName || "",
        });

        if (overviewRes && overviewRes.warning) {
          setWarningMessage(overviewRes.warning); 
          setIsSubmitting(false);
          return; 
        }
      } catch (error: any) {
        setIsSubmitting(false);
        const serverError = error.response?.data;
        if (serverError && serverError.detail) {
           toast.error(serverError.detail);
        } else {
           toast.error("Error validating Route & Rate Plan.");
        }
        return; 
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        routeGroup: formData.routeGroup ? Number(formData.routeGroup) : null,
        // ⚡️ FIX: Used customerRateGroup
        customerRateGroup: formData.customerRateGroup ? Number(formData.customerRateGroup) : null,
      };

      await updateClientApi(editingClient.id, payload, moduleName);
      toast.success("Route & Rate Plan updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Failed to update Route & Rate Plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ⚡️ FIX: Dynamic title checking if routing info already exists
  const modalTitle = (!editingClient?.routeGroup && !editingClient?.customerRateGroup) 
    ? "Add Route & Rate Plan" 
    : "Edit Route & Rate Plan";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Select
            label="Route Group"
            value={formData.routeGroup}
            onChange={(v) => handleSelect("routeGroup", v)}
            options={routeGroupOptions}
            placeholder="Select Route Group"
          />
          {/* ⚡️ FIX: Updated to Customer Rate Group */}
          <Select
            label="Customer Rate Group"
            value={formData.customerRateGroup}
            onChange={(v) => handleSelect("customerRateGroup", v)}
            options={customerRateGroupOptions}
            placeholder="Select Rate Group"
          />
        </div>

        {warningMessage && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-in fade-in zoom-in duration-300">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
              {warningMessage}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting || !formData.routeGroup || !formData.customerRateGroup}
            className={warningMessage ? "bg-yellow-600 hover:bg-yellow-700 text-white border-none" : ""}
          >
            {isSubmitting ? "Saving..." : warningMessage ? "Update Anyway" : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};