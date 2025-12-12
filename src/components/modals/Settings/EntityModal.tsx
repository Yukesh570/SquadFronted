import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createEntityApi,
  updateEntityApi,
  type EntityData,
} from "../../../api/settingApi/entityApi/entityApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingEntity: EntityData | null;
  isViewMode?: boolean;
}

export const EntityModal: React.FC<EntityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingEntity,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingEntity) {
        setFormData({ name: editingEntity.name });
      } else {
        setFormData({ name: "" });
      }
    }
  }, [isOpen, editingEntity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name.trim()) {
      toast.error("Entity Name is required");
      return;
    }

    setIsSubmitting(true);
    const dataToSend = { name: formData.name };

    try {
      if (editingEntity) {
        await updateEntityApi(editingEntity.id!, dataToSend, moduleName);
        toast.success("Entity updated successfully!");
      } else {
        await createEntityApi(dataToSend, moduleName);
        toast.success("Entity added successfully!");
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
        toast.error("Failed to save entity.");
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
          ? "View Entity"
          : editingEntity
          ? "Edit Entity"
          : "Add Entity"
      }
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Entity Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Head Office"
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
                : editingEntity
                ? "Save Changes"
                : "Add Entity"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
