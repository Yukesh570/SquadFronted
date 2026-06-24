import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

// ⚡️ FIX: Adjusted paths to match folder depth
import { updateMccMncPrefixRangeApi, type MccMncPrefixRangeData } from "../../../api/mccMncPrefixApi/mccMncPrefixRangeApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";
import TextArea from "../../ui/TextArea";

interface MccMncPrefixRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: MccMncPrefixRangeData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const MccMncPrefixRangeModal: React.FC<MccMncPrefixRangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingData,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    country: "",
    countryCode: "",
    operatorName: "",
    mcc: "",
    mnc: "",
    mccmnc: "",
    operatorPrefixStartRange: "",
    operatorPrefixEndRange: "",
    externalPrefixId: "",
    sourceFileName: "",
    remark: "",
    status: "ACTIVE",
  });

  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCountriesApi("country", 1, 1000)
        .then((res: any) => {
          let list = res.results || (Array.isArray(res) ? res : []);
          setCountryOptions(list.map((c: any) => ({ label: c.name || `Country ${c.id}`, value: String(c.id) })));
        })
        .catch(() => console.error("Failed to load countries"));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingData) {
      setFormData({
        country: editingData.country ? String(editingData.country) : "",
        countryCode: editingData.countryCode || "",
        operatorName: editingData.operatorName || "",
        mcc: editingData.mcc || "",
        mnc: editingData.mnc || "",
        mccmnc: editingData.mccmnc || "",
        operatorPrefixStartRange: editingData.operatorPrefixStartRange ? String(editingData.operatorPrefixStartRange) : "",
        operatorPrefixEndRange: editingData.operatorPrefixEndRange ? String(editingData.operatorPrefixEndRange) : "",
        externalPrefixId: editingData.externalPrefixId ? String(editingData.externalPrefixId) : "",
        sourceFileName: editingData.sourceFileName || "",
        remark: editingData.remark || "",
        status: editingData.status || "ACTIVE",
      });
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
    if (isViewMode || !editingData?.id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        country: formData.country ? Number(formData.country) : null,
        countryCode: formData.countryCode,
        operatorName: formData.operatorName,
        mcc: formData.mcc,
        mnc: formData.mnc,
        mccmnc: formData.mccmnc,
        operatorPrefixStartRange: formData.operatorPrefixStartRange ? Number(formData.operatorPrefixStartRange) : null,
        operatorPrefixEndRange: formData.operatorPrefixEndRange ? Number(formData.operatorPrefixEndRange) : null,
        externalPrefixId: formData.externalPrefixId ? Number(formData.externalPrefixId) : null,
        sourceFileName: formData.sourceFileName,
        remark: formData.remark,
        status: formData.status,
        importBatch: editingData.importBatch,
      };

      await updateMccMncPrefixRangeApi(editingData.id, payload, moduleName);
      toast.success("Prefix Range updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Failed to update prefix range.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewMode ? "View Prefix Range" : "Edit Prefix Range"}
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-1 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">Network Information</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Country" value={formData.country} onChange={(v: string) => handleSelect("country", v)} options={countryOptions} placeholder="Select Country" disabled={isViewMode} />
            <Input label="Country Code" name="countryCode" value={formData.countryCode} onChange={handleChange} disabled={isViewMode} />
            <Input label="Operator Name" name="operatorName" value={formData.operatorName} onChange={handleChange} disabled={isViewMode} />
            <Input label="MCC" name="mcc" value={formData.mcc} onChange={handleChange} disabled={isViewMode} />
            <Input label="MNC" name="mnc" value={formData.mnc} onChange={handleChange} disabled={isViewMode} />
            <Input label="MCC MNC Combo" name="mccmnc" value={formData.mccmnc} onChange={handleChange} disabled={isViewMode} />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">Prefix & Source</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Start Range" name="operatorPrefixStartRange" type="number" value={formData.operatorPrefixStartRange} onChange={handleChange} disabled={isViewMode} />
            <Input label="End Range" name="operatorPrefixEndRange" type="number" value={formData.operatorPrefixEndRange} onChange={handleChange} disabled={isViewMode} />
            <Input label="External Prefix ID" name="externalPrefixId" type="number" value={formData.externalPrefixId} onChange={handleChange} disabled={isViewMode} />
            <div className="md:col-span-3">
              <Input label="Source File Name" name="sourceFileName" value={formData.sourceFileName} onChange={handleChange} disabled={isViewMode} />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">Status & Remarks</legend>
          {/* ⚡️ FIX: Changed to md:grid-cols-2 to prevent the Select from becoming huge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(v: string) => handleSelect("status", v)}
              options={[{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }]}
              disabled={isViewMode}
            />
            {/* ⚡️ FIX: Make TextArea span full width below the Select */}
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
              {isSubmitting ? "Saving..." : "Update"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};