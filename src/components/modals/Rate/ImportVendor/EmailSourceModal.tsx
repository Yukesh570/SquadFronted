import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createEmailSourceApi,
  updateEmailSourceApi,
  type EmailSourceData,
} from "../../../../api/rateApi/ImportVendor/emailSourceApi";
import { getVendorsApi } from "../../../../api/connectivityApi/vendorApi";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import Select from "../../../ui/Select";
import Modal from "../../../ui/Modal";
import ToggleSwitch from "../../../ui/ToggleSwitch";

interface EmailSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: EmailSourceData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const EmailSourceModal: React.FC<EmailSourceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingData,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    vendor: "",
    allowedEmail: "",
    allowedDomain: "",
    subjectPattern: "",
    active: true,
  });

  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch Vendors
      getVendorsApi("vendor", 1, 1000)
        .then((res: any) => {
          let list = res.results || (Array.isArray(res) ? res : []);
          setVendorOptions(
            list.map((v: any) => ({
              label: v.profileName || v.name || `Vendor ${v.id}`,
              value: String(v.id),
            }))
          );
        })
        .catch((err: any) => console.error("Failed to load vendors", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setFormData({
          vendor: editingData.vendor ? String(editingData.vendor) : "",
          allowedEmail: editingData.allowedEmail || "",
          allowedDomain: editingData.allowedDomain || "",
          subjectPattern: editingData.subjectPattern || "",
          active: editingData.active ?? true,
        });
      } else {
        setFormData({
          vendor: "",
          allowedEmail: "",
          allowedDomain: "",
          subjectPattern: "",
          active: true,
        });
      }
    }
  }, [isOpen, editingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleToggle = (name: string, value: boolean) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    setIsSubmitting(true);

    try {
      // Build payload strictly matching Swagger specs (omitting isDeleted, createdBy, updatedBy)
      const payload: any = {
        allowedEmail: formData.allowedEmail,
        allowedDomain: formData.allowedDomain,
        subjectPattern: formData.subjectPattern,
        active: formData.active,
        vendor: formData.vendor ? Number(formData.vendor) : null,
      };

      if (editingData && editingData.id) {
        await updateEmailSourceApi(editingData.id, payload, moduleName);
        toast.success("Email Source updated successfully!");
      } else {
        await createEmailSourceApi(payload, moduleName);
        toast.success("Email Source created successfully!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const serverError = error.response?.data;
      if (serverError && typeof serverError === "object") {
        Object.entries(serverError).forEach(([key, msgs]) => {
          const msgText = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
          toast.error(`${key}: ${msgText}`);
        });
      } else {
        toast.error("Failed to save Email Source.");
      }
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
          ? "View Email Source"
          : editingData
          ? "Edit Email Source"
          : "Add Email Source"
      }
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-1 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Configuration
          </legend>
          <div className="grid grid-cols-1 gap-4">
            <Select
              label="Vendor"
              value={formData.vendor}
              onChange={(v: string) => handleSelect("vendor", v)}
              options={vendorOptions}
              placeholder="Select Vendor"
              disabled={isViewMode}
            />
            <Input
              label="Allowed Email"
              name="allowedEmail"
              type="email"
              value={formData.allowedEmail}
              onChange={handleChange}
              placeholder="user@example.com"
              disabled={isViewMode}
            />
            <Input
              label="Allowed Domain"
              name="allowedDomain"
              value={formData.allowedDomain}
              onChange={handleChange}
              placeholder="example.com"
              disabled={isViewMode}
            />
            <Input
              label="Subject Pattern"
              name="subjectPattern"
              value={formData.subjectPattern}
              onChange={handleChange}
              placeholder="e.g. *Invoice*"
              disabled={isViewMode}
            />
            <div className={`mt-2 ${isViewMode ? "pointer-events-none opacity-50" : ""}`}>
              <ToggleSwitch
                label="Active Status"
                checked={formData.active}
                onChange={(v: boolean) => handleToggle("active", v)}
              />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingData ? "Update" : "Add"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};