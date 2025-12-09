import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createMappingSetupApi,
  updateMappingSetupApi,
  type MappingSetupData,
} from "../../api/mappingSetupApi/mappingSetupApi";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface MappingSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingMapping: MappingSetupData | null;
  isViewMode?: boolean;
}

export const MappingSetupModal: React.FC<MappingSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingMapping,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    ratePlan: "",
    country: "",
    countryCode: "",
    timeZone: "",
    network: "",
    MCC: "",
    MNC: "",
    rate: "",
    dateTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingMapping) {
        setFormData({
          ratePlan: editingMapping.ratePlan,
          country: editingMapping.country,
          countryCode: editingMapping.countryCode,
          timeZone: editingMapping.timeZone,
          network: editingMapping.network,
          MCC: editingMapping.MCC,
          MNC: editingMapping.MNC,
          rate: editingMapping.rate,
          dateTime: editingMapping.dateTime,
        });
      } else {
        setFormData({
          ratePlan: "",
          country: "",
          countryCode: "",
          timeZone: "",
          network: "",
          MCC: "",
          MNC: "",
          rate: "",
          dateTime: "",
        });
      }
    }
  }, [isOpen, editingMapping]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.ratePlan) {
      toast.error("RatePlan is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingMapping) {
        await updateMappingSetupApi(editingMapping.id!, formData, moduleName);
        toast.success("Mapping setup updated successfully!");
      } else {
        await createMappingSetupApi(formData, moduleName);
        toast.success("Mapping setup added successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const serverError = error.response?.data;
      if (serverError && typeof serverError === "object") {
        Object.entries(serverError).forEach(([key, msg]) => {
          toast.error(`${key}: ${msg}`);
        });
      } else {
        toast.error("Failed to save mapping setup.");
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
          ? "View Mapping setup"
          : editingMapping
          ? "Change mapping setup"
          : "Add mapping setup"
      }
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
          Enter the specific <strong>Column Header Name</strong> from your file
          that corresponds to each system field below.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Input
            label="RatePlan"
            name="ratePlan"
            value={formData.ratePlan}
            onChange={handleChange}
            required
            disabled={isViewMode}
          />
          <Input
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={isViewMode}
          />
          <Input
            label="CountryCode"
            name="countryCode"
            value={formData.countryCode}
            onChange={handleChange}
            disabled={isViewMode}
          />
          <Input
            label="TimeZone"
            name="timeZone"
            value={formData.timeZone}
            onChange={handleChange}
            disabled={isViewMode}
          />
          <Input
            label="Network"
            name="network"
            value={formData.network}
            onChange={handleChange}
            disabled={isViewMode}
          />
          <Input
            label="MCC"
            name="MCC"
            value={formData.MCC}
            onChange={handleChange}
            disabled={isViewMode}
          />
          <Input
            label="MNC"
            name="MNC"
            value={formData.MNC}
            onChange={handleChange}
            disabled={isViewMode}
          />
          <Input
            label="Rate"
            name="rate"
            value={formData.rate}
            onChange={handleChange}
            disabled={isViewMode}
          />
          <Input
            label="DateTime"
            name="dateTime"
            value={formData.dateTime}
            onChange={handleChange}
            disabled={isViewMode}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingMapping ? "Save" : "Save"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
