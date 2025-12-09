import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createVendorApi,
  updateVendorApi,
  type VendorData,
} from "../../../api/connectivityApi/vendorApi";
import { getCompaniesApi } from "../../../api/companyApi/companyApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingVendor: VendorData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingVendor,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    company: "",
    profileName: "",
    connectionType: "SMPP",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);

  const connectionTypeOptions = [
    { label: "SMPP", value: "SMPP" },
    { label: "HTTP", value: "HTTP" },
  ];

  // Fetch Companies
  useEffect(() => {
    if (isOpen) {
      getCompaniesApi("company", 1, 1000)
        .then((res: any) => {
          let list = [];
          if (res && res.results) list = res.results;
          else if (Array.isArray(res)) list = res;

          setCompanyOptions(
            list.map((c: any) => ({ label: c.name, value: String(c.id) }))
          );
        })
        .catch((err) => console.error("Failed to load companies", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingVendor) {
      setFormData({
        company: editingVendor.company ? String(editingVendor.company) : "",
        profileName: editingVendor.profileName,
        connectionType: editingVendor.connectionType || "SMPP",
      });
    } else if (isOpen) {
      // Reset form
      setFormData({
        company: "",
        profileName: "",
        connectionType: "SMPP",
      });
    }
  }, [isOpen, editingVendor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.company || !formData.profileName) {
      toast.error("Company and Profile Name are required.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      company: Number(formData.company),
      profileName: formData.profileName,
      connectionType: formData.connectionType,
    };

    try {
      if (editingVendor) {
        await updateVendorApi(editingVendor.id!, payload, moduleName);
        toast.success("Vendor updated successfully!");
      } else {
        await createVendorApi(payload, moduleName);
        toast.success("Vendor added successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to save vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isViewMode
          ? "View Vendor"
          : editingVendor
          ? "Edit Vendor"
          : "Add Vendor"
      }
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Select
          label="Company Name"
          value={formData.company}
          onChange={(v) => handleSelect("company", v)}
          options={companyOptions}
          placeholder="Select Company"
          disabled={isViewMode}
        />

        <Input
          label="Profile Name"
          name="profileName"
          value={formData.profileName}
          onChange={handleChange}
          placeholder="e.g., Vendor A"
          required
          disabled={isViewMode}
        />

        <Select
          label="Connection Type"
          value={formData.connectionType}
          onChange={(v) => handleSelect("connectionType", v)}
          options={connectionTypeOptions}
          placeholder="Select Type"
          disabled={isViewMode}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
