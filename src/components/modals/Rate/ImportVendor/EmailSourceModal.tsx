import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createEmailSourceApi,
  updateEmailSourceApi,
  type EmailSourceData,
} from "../../../../api/rateApi/ImportVendor/emailSourceApi";
import { getVendorsApi } from "../../../../api/connectivityApi/vendorApi";
import { getMappingSetupsApi } from "../../../../api/mappingSetupApi/mappingSetupApi"; 
import { getCompaniesApi } from "../../../../api/companyApi/companyApi"; 
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

// Custom read-only field specifically mimicking MultiEmailInput without 'x' buttons
const ReadOnlyEmailField = ({ label, value }: { label: string; value: string | undefined }) => {
  // Support comma-separated emails if backend sends multiple
  const emails = value ? value.split(',').map(e => e.trim()).filter(e => e) : [];

  return (
    <div className="flex flex-col w-full">
      <label className="mb-1.5 text-xs font-medium text-text-secondary dark:text-gray-400 min-h-[32px] flex items-end">
        {label}
      </label>
      <div className="w-full rounded-lg border px-3 py-2 text-sm shadow-input transition duration-150 ease-in-out bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 min-h-[42px] flex items-center flex-wrap gap-1.5">
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
          <span className="text-gray-400 dark:text-gray-500 italic">Select Vendor</span>
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
  
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch Vendors
      getVendorsApi("vendor", 1, 1000)
        .then((res: any) => {
          let list = res.results || (Array.isArray(res) ? res : []);
          setVendorsList(list); 
          setVendorOptions(
            list.map((v: any) => ({
              label: v.profileName || v.name || `Vendor ${v.id}`,
              value: String(v.id),
            }))
          );
        })
        .catch((err: any) => console.error("Failed to load vendors", err));

      // Fetch Companies to cross-reference ratesEmail
      getCompaniesApi("company", 1, 1000)
        .then((res: any) => {
          let list = res.results || (Array.isArray(res) ? res : []);
          setCompaniesList(list); 
        })
        .catch((err: any) => console.error("Failed to load companies", err));

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

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
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

  const displayEmail = (() => {
    if (formData.vendor) {
      const selectedVendor = vendorsList.find((v) => String(v.id) === String(formData.vendor));
      if (selectedVendor && selectedVendor.company) {
        const selectedCompany = companiesList.find((c) => String(c.id) === String(selectedVendor.company));
        if (selectedCompany) {
          return selectedCompany.ratesEmail || selectedCompany.companyEmail || editingData?.allowedEmail || "";
        }
      }
    }
    return editingData?.allowedEmail || "";
  })();

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
      <div className="space-y-4 px-1 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <legend className="text-sm font-semibold text-primary px-2">
            Configuration
          </legend>
          {/* Decreased the gap to gap-2 (from gap-4) to match original compact design */}
          <div className="grid grid-cols-1 gap-2">
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
            
            <ReadOnlyEmailField label="Allowed Email" value={displayEmail} />

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
            <Button type="button" variant="primary" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Saving..." : editingData ? "Update" : "Add"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};