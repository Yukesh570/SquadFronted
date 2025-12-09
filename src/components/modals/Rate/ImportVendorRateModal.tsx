import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  importVendorRatesApi,
  getImportStatusApi,
} from "../../../api/rateApi/vendorRateApi";
import {
  getMappingSetupsApi,
  type MappingSetupData,
} from "../../../api/mappingSetupApi/mappingSetupApi";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Input from "../../ui/Input";
import Modal from "../../ui/Modal";

interface ImportVendorRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportVendorRateModal: React.FC<ImportVendorRateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [allMappings, setAllMappings] = useState<MappingSetupData[]>([]);
  const [mappingOptions, setMappingOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    ratePlan: "",
    country: "",
    countryCode: "",
    timeZone: "",
    network: "",
    MCC: "",
    MNC: "",
    rate: "",
    dateTime: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMounted = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const MAX_ATTEMPTS = 5;
  const POLL_INTERVAL_MS = 2000;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      getMappingSetupsApi("mappingSetup", 1, 1000).then((res: any) => {
        if (!isMounted.current) return;
        let list: MappingSetupData[] = [];
        if (res && res.results) list = res.results;
        else if (Array.isArray(res)) list = res;

        setAllMappings(list);
        setMappingOptions(
          list.map((m) => ({
            label: m.ratePlan,
            value: String(m.id),
          }))
        );
      });
    } else {
      setCsvFile(null);
      setSelectedMappingId("");
      setProgress(null);
      setIsSubmitting(false);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMappingId) {
      const selected = allMappings.find(
        (m) => String(m.id) === selectedMappingId
      );
      if (selected) {
        setFormData({
          ratePlan: selected.ratePlan,
          country: selected.country,
          countryCode: selected.countryCode,
          timeZone: selected.timeZone,
          network: selected.network,
          MCC: selected.MCC,
          MNC: selected.MNC,
          rate: selected.rate,
          dateTime: selected.dateTime,
        });
      }
    } else {
      setFormData({
        ratePlan: "",
        country: "",
        countryCode: "",
        timeZone: "",
        network: "",
        MCC: "",
        MNC: "",
        rate: "",
        dateTime: "",
      });
    }
  }, [selectedMappingId, allMappings]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const checkStatus = async (taskId: string, attempt = 1) => {
    if (!isMounted.current) return;

    try {
      const statusRes = await getImportStatusApi(taskId);
      console.log(
        `Polling Status (Attempt ${attempt}/${MAX_ATTEMPTS}):`,
        statusRes
      );

      const state =
        statusRes?.state?.toUpperCase() || statusRes?.status?.toUpperCase();

      if (state === "SUCCESS" || state === "COMPLETED") {
        setIsSubmitting(false);
        setProgress(100);
        toast.success("Import completed successfully!");
        onSuccess();
        onClose();
        return;
      }

      if (state === "FAILURE" || state === "FAILED") {
        setIsSubmitting(false);
        toast.error(statusRes?.error || "Import failed.");
        return;
      }

      if (attempt >= MAX_ATTEMPTS) {
        setIsSubmitting(false);
        setProgress(null);
        toast.error("Import timed out (Server took too long).");
        return;
      }

      setProgress((prev) => (prev && prev < 90 ? prev + 15 : 90));
      timeoutRef.current = window.setTimeout(
        () => checkStatus(taskId, attempt + 1),
        POLL_INTERVAL_MS
      );
    } catch (err) {
      console.error("Polling error", err);
      if (attempt >= MAX_ATTEMPTS) {
        setIsSubmitting(false);
        toast.error("Network error checking status.");
        return;
      }
      timeoutRef.current = window.setTimeout(
        () => checkStatus(taskId, attempt + 1),
        POLL_INTERVAL_MS
      );
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMappingId || !csvFile) {
      toast.error("Please select a mapping setup and a CSV file.");
      return;
    }

    setIsSubmitting(true);
    setProgress(0);

    try {
      const { task_id } = await importVendorRatesApi(
        csvFile,
        selectedMappingId
      );

      if (!task_id) {
        throw new Error("No Task ID returned.");
      }

      toast.info("Import started...");

      checkStatus(task_id, 1);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Failed to start import.";
      toast.error(msg);
      setIsSubmitting(false);
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Vendor Rates"
      className="max-w-4xl"
    >
      <form onSubmit={handleImport} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <Select
            label="Select Mapping Setup"
            value={selectedMappingId}
            onChange={setSelectedMappingId}
            options={mappingOptions}
            placeholder="Choose a mapping..."
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">
              CSV File
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload size={16} />}
                disabled={isSubmitting}
                className="w-full"
              >
                {csvFile ? "Change File" : "Select File"}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                className="hidden"
                accept=".csv,.xlsx,.xls"
              />
            </div>
          </div>
        </div>

        {csvFile && (
          <div className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
            <FileSpreadsheet size={18} className="mr-2" />
            <span className="truncate font-medium">{csvFile.name}</span>
            <button
              type="button"
              onClick={() => setCsvFile(null)}
              className="ml-auto text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              disabled={isSubmitting}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <hr className="border-gray-100 dark:border-gray-700" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Expected File Headers
            </h4>
            {selectedMappingId && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                File MUST match these headers
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-80">
            <Input
              label="Rate Plan Header"
              value={formData.ratePlan}
              readOnly
              disabled
              placeholder="-"
            />
            <Input
              label="Country Header"
              value={formData.country}
              readOnly
              disabled
              placeholder="-"
            />
            <Input
              label="Country Code Header"
              value={formData.countryCode}
              readOnly
              disabled
              placeholder="-"
            />
            <Input
              label="Time Zone Header"
              value={formData.timeZone}
              readOnly
              disabled
              placeholder="-"
            />
            <Input
              label="Network Header"
              value={formData.network}
              readOnly
              disabled
              placeholder="-"
            />
            <Input
              label="MCC Header"
              value={formData.MCC}
              readOnly
              disabled
              placeholder="-"
            />
            <Input
              label="MNC Header"
              value={formData.MNC}
              readOnly
              disabled
              placeholder="-"
            />
            <Input
              label="Rate Header"
              value={formData.rate}
              readOnly
              disabled
              placeholder="-"
            />
            <Input
              label="Date Time Header"
              value={formData.dateTime}
              readOnly
              disabled
              placeholder="-"
            />
          </div>
        </div>

        {isSubmitting && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress || 5}%` }}
            ></div>
            <p className="text-xs text-center text-gray-500 mt-1">
              Processing... {progress ? `${progress}%` : ""}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !csvFile || !selectedMappingId}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" /> Importing...
              </>
            ) : (
              "Start Import"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
