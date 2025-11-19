import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createCountryApi,
  createStateApi,
  updateCountryApi,
  type CountryData,
  type StateData,
} from "../../api/settingApi/countryApi/countryApi";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface StateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingServer: StateData | null;
}

export const StateModal: React.FC<StateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingServer,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    country: 0,
    countryName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingServer) {
        setFormData({
          name: editingServer.name,
          country: editingServer.country,
          countryName: editingServer.countryName!,
        });
      } else {
        setFormData({
          name: "",
          country: 0,
          countryName: "",
        });
      }
    }
  }, [isOpen, editingServer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dataToSend = {
      name: formData.name,
      country: formData.country,
    };

    try {
      if (editingServer) {
        await updateCountryApi(
          editingServer.id!,
          dataToSend as any,
          moduleName
        );
        toast.success("Country updated successfully!");
      } else {
        await createStateApi(dataToSend as any, moduleName);
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
      title={editingServer ? "Edit Country" : "Add Country"}
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
          value={formData.country}
          onChange={handleChange}
          placeholder="e.g., NP"
          required
        />
        <Input
          label="Country"
          name="Country"
          value={formData.countryName}
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
              : editingServer
              ? "Save Changes"
              : "Add Country"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
