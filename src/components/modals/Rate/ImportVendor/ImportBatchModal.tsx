import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateImportBatchApi, type ImportBatchData } from "../../../../api/rateApi/ImportVendor/importBatchApi";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import Select from "../../../ui/Select";
import Modal from "../../../ui/Modal";
import { formatDateTime } from "../../../../helper/dateFormatter";

interface ImportBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: ImportBatchData | null;
  isViewMode?: boolean;
}

export const ImportBatchModal: React.FC<ImportBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingData,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    sourceType: "",
    currency: "",
    batchStatus: "PARSING",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && editingData) {
      setFormData({
        sourceType: editingData.sourceType || "",
        currency: editingData.currency || "",
        batchStatus: editingData.batchStatus || "PARSING",
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
      // Omitting isDeleted, and carrying over IDs exactly as requested
      const payload = {
        sourceType: formData.sourceType,
        currency: formData.currency,
        batchStatus: formData.batchStatus,
        parserProfileId: editingData.parserProfileId,
        totalRows: editingData.totalRows,
        validRows: editingData.validRows,
        invalidRows: editingData.invalidRows,
        unmappedRows: editingData.unmappedRows,
        updatedRows: editingData.updatedRows,
        newRows: editingData.newRows,
        effectiveDate: editingData.effectiveDate,
        publishedAt: editingData.publishedAt,
        vendor: editingData.vendor,
        mail: editingData.mail,
        attachment: editingData.attachment,
      };

      await updateImportBatchApi(editingData.id, payload, moduleName);
      toast.success("Batch updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Failed to update batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewMode ? "View Import Batch" : "Edit Import Batch Status"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-1 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">Configuration</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Source Type" name="sourceType" value={formData.sourceType} onChange={handleChange} disabled={isViewMode} />
            <Input label="Currency" name="currency" value={formData.currency} onChange={handleChange} disabled={isViewMode} />
            <Select
              label="Batch Status"
              value={formData.batchStatus}
              onChange={(v: string) => handleSelect("batchStatus", v)}
              options={[
                { label: "Parsing", value: "PARSING" },
                { label: "Parsed", value: "PARSED" },
                { label: "Ready For Review", value: "READY_FOR_REVIEW" },
                { label: "Auto Approved", value: "AUTO_APPROVED" },
                { label: "Manual Approved", value: "MANUAL_APPROVED" },
                { label: "Published", value: "PUBLISHED" },
                { label: "Rolled Back", value: "ROLLED_BACK" },
              ]}
              disabled={isViewMode}
            />

          </div>
        </fieldset>

        {isViewMode && (
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold text-primary px-2">Statistics</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Total Rows" name="totalRows" value={String(editingData?.totalRows ?? 0)} disabled={true} onChange={() => { }} />
              <Input label="Valid Rows" name="validRows" value={String(editingData?.validRows ?? 0)} disabled={true} onChange={() => { }} />
              <Input label="Invalid Rows" name="invalidRows" value={String(editingData?.invalidRows ?? 0)} disabled={true} onChange={() => { }} />
              <Input label="Unmapped Rows" name="unmappedRows" value={String(editingData?.unmappedRows ?? 0)} disabled={true} onChange={() => { }} />
              <Input label="Updated Rows" name="updatedRows" value={String(editingData?.updatedRows ?? 0)} disabled={true} onChange={() => { }} />
              <Input label="Failure Reason" name="failureReason" value={String(editingData?.failureReason ?? "")} disabled={true} onChange={() => { }} />

              <Input label="New Rows" name="newRows" value={String(editingData?.newRows ?? 0)} disabled={true} onChange={() => { }} />
              {editingData?.effectiveDate && <Input label="Effective Date" name="effectiveDate" value={formatDateTime(editingData.effectiveDate)} disabled={true} onChange={() => { }} />}
              {editingData?.publishedAt && <Input label="Published At" name="publishedAt" value={formatDateTime(editingData.publishedAt)} disabled={true} onChange={() => { }} />}
            </div>
          </fieldset>
        )}

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