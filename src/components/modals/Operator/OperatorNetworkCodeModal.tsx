import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createOperatorNetworkCodeApi,
  updateOperatorNetworkCodeApi,
  type OperatorNetworkCodeData,
} from "../../../api/operatorNetworkCodeApi/operatorNetworkCodeApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
// ⚡️ FIX: Commented out operator API import
// @ts-ignore
// import { getOperatorsApi } from "../../../api/operatorApi/operatorApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";
import TextArea from "../../ui/TextArea";
import ToggleSwitch from "../../ui/ToggleSwitch";

interface OperatorNetworkCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: OperatorNetworkCodeData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const OperatorNetworkCodeModal: React.FC<
  OperatorNetworkCodeModalProps
> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingData,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    operator: "",
    country: "",
    MCC: "",
    MNC: "",
    networkType: "GSM",
    isPrimary: false,
    status: "ACTIVE",
    notes: "",
  });

  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const networkTypeOptions: Option[] = [
    { label: "GSM", value: "GSM" },
    { label: "LTE", value: "LTE" },
    { label: "5G", value: "5G" },
    { label: "CDMA", value: "CDMA" },
    { label: "UNKNOWN", value: "UNKNOWN" },
  ];

  const statusOptions: Option[] = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  useEffect(() => {
    if (isOpen) {
      getCountriesApi("country", 1, 1000)
        .then((res: any) => {
          const list = res.results || (Array.isArray(res) ? res : []);
          setCountryOptions(
            list.map((c: any) => ({ label: c.name, value: String(c.id) })),
          );
        })
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingData) {
      setFormData({
        operator: String(editingData.operator || ""),
        country: String(editingData.country || ""),
        MCC: editingData.MCC || "",
        MNC: editingData.MNC || "",
        networkType: editingData.networkType || "GSM",
        isPrimary: editingData.isPrimary || false,
        status: editingData.status || "ACTIVE",
        notes: editingData.notes || "",
      });
    } else if (isOpen) {
      setFormData({
        operator: "",
        country: "",
        MCC: "",
        MNC: "",
        networkType: "GSM",
        isPrimary: false,
        status: "ACTIVE",
        notes: "",
      });
    }
  }, [isOpen, editingData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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

     if (!formData.operator.trim()) {
        toast.error("Operator is required.");
        return;
      }
     if (!formData.country.trim()) {
        toast.error("Country is required.");
        return;
      }
     if (!formData.MCC.trim()) {
        toast.error("MCC is required.");
        return;
      }
     if (!formData.MNC.trim()) {
        toast.error("MNC is required.");
        return;
      }   
        setIsSubmitting(true);

    const payload: any = {
      operator: formData.operator,
      country: Number(formData.country),
      MCC: formData.MCC,
      MNC: formData.MNC,
      networkType: formData.networkType,
      isPrimary: formData.isPrimary,
      status: formData.status,
    };

    if (formData.notes) payload.notes = formData.notes;

    try {
      if (editingData) {
        await updateOperatorNetworkCodeApi(
          editingData.id!,
          payload,
          moduleName,
        );
        toast.success("Operator Network Code updated!");
      } else {
        await createOperatorNetworkCodeApi(payload, moduleName);
        toast.success("Operator Network Code created!");
      }
      onSuccess();
      onClose();
   } catch (error: any) {
  console.error(error);
  const raw = error?.response?.data?.error;
  const message = Array.isArray(raw)
    ? raw.join(" ")
    : typeof raw === "string"
      ? raw
      : "Failed to save data.";
  toast.error(message);
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
          ? "View Network Code"
          : editingData
            ? "Edit Network Code"
            : "Add Network Code"
      }
      className="max-w-3xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-[80vh] overflow-y-auto px-1" noValidate
      >
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Linkages
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Operator"
              name="operator"
              value={formData.operator}
              onChange={handleChange}
              placeholder="Operator"
              required
              disabled={isViewMode}
            />

            <Select
              label="Country"
              value={formData.country}
              onChange={(v) => handleSelect("country", v)}
              options={countryOptions}
              placeholder="Select Country"
              required
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Network Identity
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="MCC"
              name="MCC"
              value={formData.MCC}
              onChange={handleChange}
              placeholder="e.g. 429"
              required
              disabled={isViewMode}
            />
            <Input
              label="MNC"
              name="MNC"
              value={formData.MNC}
              onChange={handleChange}
              placeholder="e.g. 02"
              required
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Configuration
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Network Type"
              value={formData.networkType}
              onChange={(v) => handleSelect("networkType", v)}
              options={networkTypeOptions}
              disabled={isViewMode}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(v) => handleSelect("status", v)}
              options={statusOptions}
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Notes
          </legend>
          <TextArea
            label="Internal Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={isViewMode}
            rows={2}
            placeholder="Optional remarks"
          />
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Settings
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className={isViewMode ? "pointer-events-none opacity-50" : ""}>
              <ToggleSwitch
                label="Is Primary"
                checked={formData.isPrimary}
                onChange={(v) => handleToggle("isPrimary", v)}
              />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingData
                  ? "Save Details"
                  : "Create"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};