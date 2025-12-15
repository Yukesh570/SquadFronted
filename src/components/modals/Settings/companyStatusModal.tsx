import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createCompanyStatusApi,
  updateCompanyStatusApi,
  type CompanyStatusData,
} from "../../../api/settingApi/companyStatusApi/companyStatusApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";

interface CompanyStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingCompanyStatus: CompanyStatusData | null;
  isViewMode?: boolean;
}

export const CompanyStatusModal: React.FC<CompanyStatusModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingCompanyStatus,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingCompanyStatus) {
        setFormData({ name: editingCompanyStatus.name });
      } else {
        setFormData({ name: "" });
      }
    }
  }, [isOpen, editingCompanyStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name.trim()) {
      toast.error("Company Status Name is required");
      return;
    }

    setIsSubmitting(true);
    const dataToSend = { name: formData.name };

    try {
      if (editingCompanyStatus) {
        await updateCompanyStatusApi(
          editingCompanyStatus.id!,
          dataToSend,
          moduleName
        );
        toast.success("Company Status updated successfully!");
      } else {
        await createCompanyStatusApi(dataToSend, moduleName);
        toast.success("Company Status added successfully!");
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
        toast.error("Failed to save Company Status.");
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
          ? "View Company Status"
          : editingCompanyStatus
          ? "Edit Company Status"
          : "Add Company Status"
      }
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Company Status Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Active"
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
                : editingCompanyStatus
                ? "Save Changes"
                : "Add Company Status"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
