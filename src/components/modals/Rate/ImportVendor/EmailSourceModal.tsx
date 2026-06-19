import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createEmailSourceApi,
  updateEmailSourceApi,
  type EmailSourceData,
} from "../../../../api/rateApi/ImportVendor/emailSourceApi";
import { getVendorsApi } from "../../../../api/connectivityApi/vendorApi";
import { getMappingSetupsApi } from "../../../../api/mappingSetupApi/mappingSetupApi"; 
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

// ⚡️ FIX: Custom read-only field specifically mimicking MultiEmailInput without 'x' buttons
const ReadOnlyEmailField = ({ label, value }: { label: string; value: string | undefined }) => {
  // Support comma-separated emails if backend sends multiple
  const emails = value ? value.split(',').map(e => e.trim()).filter(e => e) : [];

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="min-h-[38px] px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center flex-wrap gap-2 cursor-not-allowed opacity-80">
        {emails.length > 0 ? (
          emails.map((email, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
            >
              {email}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not set</span>
        )}
      </div>
    </div>
  );
};

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
    mappingSetup: "", 
    allowedDomain: "",
    subjectPattern: "",
    active: true,
  });

  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);
  const [mappingOptions, setMappingOptions] = useState<Option[]>([]); 
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

      // Fetch Mapping Setups
      getMappingSetupsApi("mappingSetup", 1, 1000)
        .then((res: any) => {
          let list = res.results || (Array.isArray(res) ? res : []);
          setMappingOptions(
            list.map((m: any) => ({
              label: m.name || `Setup ${m.id}`,
              value: String(m.id),
            }))
          );
        })
        .catch((err: any) => console.error("Failed to load mappings", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setFormData({
          vendor: editingData.vendor ? String(editingData.vendor) : "",
          mappingSetup: editingData.mappingSetup ? String(editingData.mappingSetup) : "", 
          allowedDomain: editingData.allowedDomain || "",
          subjectPattern: editingData.subjectPattern || "",
          active: editingData.active ?? true,
        });
      } else {
        setFormData({
          vendor: "",
          mappingSetup: "",
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
      // Omit allowedEmail from payload entirely as per backend requirements
      const payload: any = {
        allowedDomain: formData.allowedDomain,
        subjectPattern: formData.subjectPattern,
        active: formData.active,
        vendor: formData.vendor ? Number(formData.vendor) : null,
        mappingSetup: formData.mappingSetup ? Number(formData.mappingSetup) : null, 
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
            <Select
              label="Mapping Setup"
              value={formData.mappingSetup}
              onChange={(v: string) => handleSelect("mappingSetup", v)}
              options={mappingOptions}
              placeholder="Select Mapping Setup"
              disabled={isViewMode}
            />
            
            {/* ⚡️ Show read-only allowedEmail block ONLY when viewing/editing existing data */}
            {editingData && (
               <ReadOnlyEmailField label="Allowed Email" value={editingData.allowedEmail} />
            )}

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