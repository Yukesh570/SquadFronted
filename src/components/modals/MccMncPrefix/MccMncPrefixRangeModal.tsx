import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import {
  updateMccMncPrefixRangeApi,
  createMccMncPrefixRangeApi,
  type MccMncPrefixRangeData,
} from "../../../api/mccMncPrefixApi/mccMncPrefixRangeApi";
import { getOperatorNetworkCodesApi } from "../../../api/operatorNetworkCodeApi/operatorNetworkCodeApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";
import TextArea from "../../ui/TextArea";

interface Option {
  label: string;
  value: string;
}

interface MccMncPrefixRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: MccMncPrefixRangeData | null;
  isViewMode?: boolean;
}

const emptyForm = {
  operator: "",
  operatorPrefixStartRange: "",
  operatorPrefixEndRange: "",
  externalPrefixId: "",
  sourceFileName: "",
  remark: "",
  status: "ACTIVE",
};

export const MccMncPrefixRangeModal: React.FC<MccMncPrefixRangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingData,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [operatorOptions, setOperatorOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingData;

  // Operator dropdown = every OperatorNetworkCode row.
  // value = that row's real numeric id (this is what mccMncPrefixRange.operator wants)
  // label = name + country/MCC/MNC, so rows sharing the same operator name are distinguishable
  useEffect(() => {
    if (!isOpen) return;
    getOperatorNetworkCodesApi("operatorNetworkCode", 1, 1000)
      .then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        const options: Option[] = list.map((item: any) => ({
          label: `${item.operator} (${item.country_name || "-"} — MCC ${item.MCC}/MNC ${item.MNC})`,
          value: String(item.id),
        }));
        setOperatorOptions(options.sort((a, b) => a.label.localeCompare(b.label)));
      })
      .catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingData) {
      setFormData({
        operator: editingData.operator ? String(editingData.operator) : "",
        operatorPrefixStartRange: editingData.operatorPrefixStartRange
          ? String(editingData.operatorPrefixStartRange)
          : "",
        operatorPrefixEndRange: editingData.operatorPrefixEndRange
          ? String(editingData.operatorPrefixEndRange)
          : "",
        externalPrefixId: editingData.externalPrefixId
          ? String(editingData.externalPrefixId)
          : "",
        sourceFileName: editingData.sourceFileName || "",
        remark: editingData.remark || "",
        status: editingData.status || "ACTIVE",
      });
    } else if (isOpen && !editingData) {
      setFormData(emptyForm);
    }
  }, [isOpen, editingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.operator) {
      toast.error("Operator is required.");
      return;
    }
    if (!formData.operatorPrefixStartRange || !formData.operatorPrefixEndRange) {
      toast.error("Start and End range are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        operator: Number(formData.operator), // numeric id, not the name
        operatorPrefixStartRange: formData.operatorPrefixStartRange
          ? Number(formData.operatorPrefixStartRange)
          : null,
        operatorPrefixEndRange: formData.operatorPrefixEndRange
          ? Number(formData.operatorPrefixEndRange)
          : null,
        externalPrefixId: formData.externalPrefixId ? Number(formData.externalPrefixId) : null,
        sourceFileName: formData.sourceFileName,
        remark: formData.remark,
        status: formData.status,
      };

      if (isEditMode) {
        await updateMccMncPrefixRangeApi(
          editingData!.id!,
          { ...payload, importBatch: editingData!.importBatch },
          moduleName
        );
        toast.success("Prefix Range updated successfully!");
      } else {
        await createMccMncPrefixRangeApi(payload, moduleName);
        toast.success("Prefix Range created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const raw = error?.response?.data?.error || error?.response?.data?.operator;
      const message = Array.isArray(raw)
        ? raw.join(" ")
        : typeof raw === "string"
        ? raw
        : "Failed to save prefix range.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewMode ? "View Prefix Range" : isEditMode ? "Edit Prefix Range" : "Add Prefix Range"}
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-1 max-h-[80vh] overflow-y-auto custom-scrollbar" noValidate>
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">Network Information</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isViewMode ? (
              <Input label="Operator Name" value={editingData?.operatorName || ""} disabled />
            ) : (
              <div className="md:col-span-3">
                <Select
                  label="Operator"
                  value={formData.operator}
                  onChange={(v: string) => handleSelect("operator", v)}
                  options={operatorOptions}
                  placeholder="Select Operator"
                  required
                  disabled={isViewMode}
                />
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">Prefix & Source</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Start Range" name="operatorPrefixStartRange" type="number" value={formData.operatorPrefixStartRange} onChange={handleChange} disabled={isViewMode} required />
            <Input label="End Range" name="operatorPrefixEndRange" type="number" value={formData.operatorPrefixEndRange} onChange={handleChange} disabled={isViewMode} required />
            <Input label="External Prefix ID" name="externalPrefixId" type="number" value={formData.externalPrefixId} onChange={handleChange} disabled={isViewMode} />
            <div className="md:col-span-3">
              <Input label="Source File Name" name="sourceFileName" value={formData.sourceFileName} onChange={handleChange} disabled={isViewMode} />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">Status & Remarks</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(v: string) => handleSelect("status", v)}
              options={[{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }]}
              disabled={isViewMode}
            />
            <div className="md:col-span-2">
              <TextArea label="Remarks" name="remark" value={formData.remark} onChange={handleChange} disabled={isViewMode} rows={3} />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} className={isViewMode ? "" : "mr-2"}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};