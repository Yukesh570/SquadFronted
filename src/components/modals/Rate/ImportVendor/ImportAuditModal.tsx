import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateImportAuditApi, type ImportAuditData } from "../../../../api/rateApi/ImportVendor/importAuditApi";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import TextArea from "../../../ui/TextArea";
import Modal from "../../../ui/Modal";
import { formatDateTime } from "../../../../helper/dateFormatter";

interface ImportAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: ImportAuditData | null;
  isViewMode?: boolean;
}

export const ImportAuditModal: React.FC<ImportAuditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingData,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    action: "",
    actionBy: "",
    notes: "",
    batch: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && editingData) {
      setFormData({
        action: editingData.action || "",
        actionBy: editingData.actionBy || "",
        notes: editingData.notes || "",
        batch: editingData.batch ? String(editingData.batch) : "",
      });
    }
  }, [isOpen, editingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode || !editingData?.id) return;

    setIsSubmitting(true);
    try {
      // Omitting isDeleted as per rules
      const payload = {
        action: formData.action,
        actionBy: formData.actionBy,
        notes: formData.notes,
        batch: formData.batch ? Number(formData.batch) : null,
      };

      await updateImportAuditApi(editingData.id, payload, moduleName);
      toast.success("Audit log updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Failed to update audit log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewMode ? "View Audit Log" : "Edit Audit Log"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-1 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <Input 
          label="Action" 
          name="action" 
          value={formData.action} 
          onChange={handleChange} 
          disabled={isViewMode} 
        />
        <Input 
          label="Action By" 
          name="actionBy" 
          value={formData.actionBy} 
          onChange={handleChange} 
          disabled={isViewMode} 
        />
        <Input 
          label="Batch ID" 
          name="batch" 
          type="number"
          value={formData.batch} 
          onChange={handleChange} 
          disabled={isViewMode} 
        />

        {isViewMode && editingData?.actionTime && (
          <Input 
            label="Action Time" 
            name="actionTime" 
            value={formatDateTime(editingData.actionTime)} 
            disabled={true} 
            onChange={() => {}}
          />
        )}

        <TextArea 
          label="Notes" 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange} 
          disabled={isViewMode} 
          rows={3} 
        />

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} className={isViewMode ? "" : "mr-2"}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};