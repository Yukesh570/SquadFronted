import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateClientApi, type ClientData } from "../../api/clientApi/clientApi";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
// @ts-ignore
import { getCustomerRatesApi } from "../../api/rateApi/customerRateApi";

interface Option { label: string; value: string; }

interface ClientRoutingRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingClient: ClientData | null;
  routeGroupOptions: Option[];
}

export const ClientRoutingRateModal: React.FC<ClientRoutingRateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingClient,
  routeGroupOptions,
}) => {
  const [formData, setFormData] = useState({
    routeGroup: "",
    ratePlanName: "",
  });
  const [ratePlanOptions, setRatePlanOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCustomerRatesApi("customerRate", 1, 1000)
        .then((res: any) => {
          let list = res.results || (Array.isArray(res) ? res : []);
          
          // ⚡️ FIX: Filter out duplicates using a Set
          const uniqueOptions: Option[] = [];
          const seenNames = new Set<string>();

          list.forEach((r: any) => {
            const planName = r.ratePlan || r.ratePlanName || r.name;
            if (planName && !seenNames.has(planName)) {
              seenNames.add(planName);
              uniqueOptions.push({
                label: planName,
                value: planName,
              });
            }
          });

          setRatePlanOptions(uniqueOptions);
        })
        .catch((err: any) => console.error("Failed to load rate plans", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingClient) {
      setFormData({
        routeGroup: editingClient.routeGroup != null ? String(editingClient.routeGroup) : "",
        ratePlanName: editingClient.ratePlanName || "",
      });
    }
  }, [isOpen, editingClient]);

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        routeGroup: formData.routeGroup ? Number(formData.routeGroup) : null,
        ratePlanName: formData.ratePlanName || "",
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Route & Rate Plan" className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Select
            label="Route Group"
            value={formData.routeGroup}
            onChange={(v) => handleSelect("routeGroup", v)}
            options={routeGroupOptions}
            placeholder="Select Route Group"
          />
          <Select
            label="Rate Plan Name"
            value={formData.ratePlanName}
            onChange={(v) => handleSelect("ratePlanName", v)}
            options={ratePlanOptions}
            placeholder="Select Rate Plan"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};