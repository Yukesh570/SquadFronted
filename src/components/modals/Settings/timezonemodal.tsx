import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createTimezoneApi,
  updateTimezoneApi,
  type TimezoneData,
} from "../../../api/settingApi/timezoneApi/timezoneApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";

interface TimezoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingTimezone: TimezoneData | null;
  isViewMode?: boolean;
}

export const TimezoneModal: React.FC<TimezoneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingTimezone,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingTimezone) {
        setFormData({ name: editingTimezone.name });
      } else {
        setFormData({ name: "" });
      }
    }
  }, [isOpen, editingTimezone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name.trim()) {
      toast.error("Timezone Name is required");
      return;
    }

    setIsSubmitting(true);
    const dataToSend = { name: formData.name };

    try {
      if (editingTimezone) {
        await updateTimezoneApi(editingTimezone.id!, dataToSend, moduleName);
        toast.success("Timezone updated successfully!");
      } else {
        await createTimezoneApi(dataToSend, moduleName);
        toast.success("Timezone added successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const serverError = error.response?.data;
      if (serverError) {
        if (typeof serverError === "object") {
          Object.entries(serverError).forEach(([key, msgs]) => {
            toast.error(`${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
          });
        } else {
          toast.error(String(serverError));
        }
      } else {
        toast.error("Failed to save timezone.");
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
          ? "View Timezone"
          : editingTimezone
          ? "Edit Timezone"
          : "Add Timezone"
      }
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Timezone Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Asia/Kathmandu"
          required
          disabled={isViewMode}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingTimezone
                ? "Save Changes"
                : "Add Timezone"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
