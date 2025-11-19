import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createCountryApi,
  updateCountryApi,
  type CountryData,
} from "../../api/settingApi/countryApi";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface CountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingCountry: CountryData | null;
}

export const CountryModal: React.FC<CountryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingCountry,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    countryCode: "",
    MCC: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingCountry) {
        setFormData({
          name: editingCountry.name,
          countryCode: editingCountry.countryCode,
          MCC: editingCountry.MCC,
        });
      } else {
        setFormData({
          name: "",
          countryCode: "",
          MCC: "",
        });
      }
    }
  }, [isOpen, editingCountry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dataToSend = {
      name: formData.name,
      countryCode: formData.countryCode,
      MCC: formData.MCC,
    };

    try {
      if (editingCountry) {
        await updateCountryApi(
          editingCountry.id!,
          dataToSend as any,
          moduleName
        );
        toast.success("Country updated successfully!");
      } else {
        await createCountryApi(dataToSend as any, moduleName);
        toast.success("Country added successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to save country.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCountry ? "Edit Country" : "Add Country"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Country"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Nepal"
          required
        />
        <Input
          label="Code"
          name="countryCode"
          value={formData.countryCode}
          onChange={handleChange}
          placeholder="e.g., NP"
          required
        />
        <Input
          label="MCC"
          name="MCC"
          value={formData.MCC}
          onChange={handleChange}
          placeholder="e.g., 429"
          required
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : editingCountry
              ? "Save Changes"
              : "Add Country"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
