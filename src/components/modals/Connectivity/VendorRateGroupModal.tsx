import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateVendorApi, type VendorData } from "../../../api/connectivityApi/vendorApi";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";

interface Option { label: string; value: string; }

interface VendorRateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingVendor: VendorData | null;
  vendorRateGroupOptions: Option[];
}

export const VendorRateGroupModal: React.FC<VendorRateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingVendor,
  vendorRateGroupOptions,
}) => {
  const [formData, setFormData] = useState({
    vendorRateGroup: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && editingVendor) {
      setFormData({
        vendorRateGroup: editingVendor.vendorRateGroup != null ? String(editingVendor.vendorRateGroup) : "",
      });
    }
  }, [isOpen, editingVendor]);

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !editingVendor.id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        vendorRateGroup: formData.vendorRateGroup ? Number(formData.vendorRateGroup) : null,
      };

      await updateVendorApi(editingVendor.id, payload, moduleName);
      toast.success("Vendor Rate Group updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Failed to update Vendor Rate Group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = !editingVendor?.vendorRateGroup 
    ? "Add Vendor Rate Group" 
    : "Edit Vendor Rate Group";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Select
            label="Vendor Rate Group"
            value={formData.vendorRateGroup}
            onChange={(v) => handleSelect("vendorRateGroup", v)}
            options={vendorRateGroupOptions}
            placeholder="Select Rate Group"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting || !formData.vendorRateGroup}
          >
            {isSubmitting ? "Saving..." : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};