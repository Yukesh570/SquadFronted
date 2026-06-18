import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateImportAttachmentApi, type ImportAttachmentData } from "../../../../api/rateApi/ImportVendor/importAttachmentApi";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import Select from "../../../ui/Select";
import Modal from "../../../ui/Modal";

interface ImportAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: ImportAttachmentData | null;
  isViewMode?: boolean;
}

export const ImportAttachmentModal: React.FC<ImportAttachmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingData,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    fileName: "",
    fileType: "",
    fileHash: "",
    localPath: "",
    parseStatus: "PENDING",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && editingData) {
      setFormData({
        fileName: editingData.fileName || "",
        fileType: editingData.fileType || "",
        fileHash: editingData.fileHash || "",
        localPath: editingData.localPath || "",
        parseStatus: editingData.parseStatus || "PENDING",
      });
    }
  }, [isOpen, editingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode || !editingData?.id) return;

    setIsSubmitting(true);
    try {
      // Omitting isDeleted, createdBy, updatedBy as requested
      const payload = {
        fileName: formData.fileName,
        fileType: formData.fileType,
        fileHash: formData.fileHash,
        localPath: formData.localPath,
        parseStatus: formData.parseStatus,
        mail: editingData.mail,
      };

      await updateImportAttachmentApi(editingData.id, payload, moduleName);
      toast.success("Attachment updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Failed to update attachment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewMode ? "View Attachment" : "Edit Attachment Status"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="File Name" name="fileName" value={formData.fileName} onChange={handleChange} disabled={true} />
        <Input label="File Type" name="fileType" value={formData.fileType} onChange={handleChange} disabled={true} />
        <Input label="File Hash" name="fileHash" value={formData.fileHash} onChange={handleChange} disabled={true} />
        <Input label="Local Path" name="localPath" value={formData.localPath} onChange={handleChange} disabled={true} />
        <Select
          label="Parse Status"
          value={formData.parseStatus}
          onChange={(v: string) => handleSelect("parseStatus", v)}
          options={[
            { label: "Pending", value: "PENDING" },
            { label: "Parsed", value: "PARSED" },
            { label: "Failed", value: "FAILED" },
            { label: "Manual Review", value: "MANUAL_REVIEW" },
          ]}
          disabled={isViewMode}
        />
        {!isViewMode && (
          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
             <Button type="button" variant="secondary" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update"}
            </Button>
          </div>
        )}
        {isViewMode && (
           <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
             <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
};