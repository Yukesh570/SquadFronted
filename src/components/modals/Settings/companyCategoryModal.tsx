import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createCompanyCategoryApi,
  updateCompanyCategoryApi,
  type CompanyCategoryData,
} from "../../../api/settingApi/companyCategoryApi/companyCategoryApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";

interface CompanyCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingCompanyCategory: CompanyCategoryData | null;
  isViewMode?: boolean;
}

export const CompanyCategoryModal: React.FC<CompanyCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingCompanyCategory,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingCompanyCategory) {
        setFormData({ name: editingCompanyCategory.name });
      } else {
        setFormData({ name: "" });
      }
    }
  }, [isOpen, editingCompanyCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name.trim()) {
      toast.error("Company Category Name is required");
      return;
    }

    setIsSubmitting(true);
    const dataToSend = { name: formData.name };

    try {
      if (editingCompanyCategory) {
        await updateCompanyCategoryApi(
          editingCompanyCategory.id!,
          dataToSend,
          moduleName
        );
        toast.success("Company Category updated successfully!");
      } else {
        await createCompanyCategoryApi(dataToSend, moduleName);
        toast.success("Company Category added successfully!");
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
        toast.error("Failed to save Company Category.");
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
          ? "View Company Category"
          : editingCompanyCategory
          ? "Edit Company Category"
          : "Add Company Category"
      }
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Company Category Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Manufacturing"
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
                ? "Saving..."
                : editingCompanyCategory
                ? "Save Changes"
                : "Add Company Category"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
