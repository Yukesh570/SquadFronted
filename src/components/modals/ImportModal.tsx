import React, { useState, useRef, useEffect } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  importApi: (formData: FormData) => Promise<any>;
  checkStatusApi?: (taskId: string) => Promise<any>;
  title?: string;
  sampleFileLink?: string;
  sampleFileName?: string;
  fileKey?: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  importApi,
  checkStatusApi,
  title = "Import Data",
  sampleFileLink,
  sampleFileName = "sample_import.csv",
  fileKey = "file",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_ATTEMPTS = 20;
  const POLL_INTERVAL = 2000;

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setIsSubmitting(false);
      setIsPolling(false);
      setProgress(null);
    }
  }, [isOpen]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadSample = () => {
    if (!sampleFileLink) return;
    const link = document.createElement("a");
    link.href = sampleFileLink;
    link.setAttribute("download", sampleFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pollStatus = async (taskId: string) => {
    if (!checkStatusApi) return;

    let attempts = 0;

    const intervalId = setInterval(async () => {
      attempts += 1;
      let res: any = null;

      try {
        res = await checkStatusApi(taskId);
      } catch (error: any) {
        if (error.response && error.response.data) {
          res = error.response.data;
        } else {
          console.error("Polling error", error);
          if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId);
            toast.error("Network error checking status.");
            setIsPolling(false);
            setIsSubmitting(false);
            setProgress(null);
          }
          return;
        }
      }

      if (res) {
        console.log(`Polling Status (Attempt ${attempts}):`, res);

        const status = (res.state || res.status || "").toUpperCase();

        if (res.progress) {
          setProgress(res.progress);
        } else {
          setProgress((prev) => (prev && prev < 90 ? prev + 10 : 90));
        }

        if (status === "FAILURE" || status === "FAILED" || status === "ERROR") {
          clearInterval(intervalId);
          const errorMsg =
            res.error || res.result || res.message || "Unknown error";
          toast.error(`Import failed: ${errorMsg}`);
          setIsPolling(false);
          setIsSubmitting(false);
          setProgress(null);
          return;
        }

        if (
          res.progress === 100 ||
          status === "SUCCESS" ||
          status === "COMPLETED" ||
          status === "COMPLETED_WITH_ERRORS" ||
          status === "FINISHED"
        ) {
          clearInterval(intervalId);
          setProgress(100);

          const resultErrors = res.result?.errors || res.errors;

          if (
            resultErrors &&
            Array.isArray(resultErrors) &&
            resultErrors.length > 0
          ) {
            setIsPolling(false);
            setIsSubmitting(false);

            const firstError = resultErrors[0];
            const errorText =
              typeof firstError === "string"
                ? firstError
                : `Row ${firstError.row}: ${firstError.error}`;

            toast.error(errorText);
          } else {
            toast.success("Import completed successfully!");
            setIsPolling(false);
            setIsSubmitting(false);
            onSuccess();
            onClose();
          }
          return;
        }

        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(intervalId);
          toast.warning("Import is taking longer than expected.");
          setIsPolling(false);
          setIsSubmitting(false);
          onClose();
        }
      }
    }, POLL_INTERVAL);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to import.");
      return;
    }

    setIsSubmitting(true);
    setProgress(0);

    const formData = new FormData();
    formData.append(fileKey, file);

    try {
      const response = await importApi(formData);

      if (response.task_id && checkStatusApi) {
        toast.info("Import started. Processing...");
        setIsPolling(true);
        pollStatus(response.task_id);
      } else {
        if (response.status === "error" || response.error) {
          const msg = response.error || response.message || "Import failed.";
          toast.error(msg);
          setIsSubmitting(false);
          setProgress(null);
        } else {
          setProgress(100);
          toast.success("Import successful!");
          onSuccess();
          onClose();
          setIsSubmitting(false);
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === "object") {
          const msg =
            data.error ||
            data.message ||
            data.detail ||
            (data.result?.errors
              ? data.result.errors[0]?.error
              : "Validation failed.");
          toast.error(msg);
        } else {
          toast.error(data.message || "Failed to upload file.");
        }
      } else {
        toast.error("Failed to upload file.");
      }
      setIsSubmitting(false);
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm text-text-secondary dark:text-gray-400">
            Upload a CSV file to bulk import records.
          </div>
          {sampleFileLink && (
            <button
              type="button"
              onClick={handleDownloadSample}
              // Changed to dynamic theme color
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              title="Download Sample Format"
              disabled={isSubmitting}
            >
              <FileSpreadsheet size={18} />
              Sample Format
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload size={16} />}
            disabled={isSubmitting}
          >
            {file ? "Change File" : "Upload CSV"}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            className="hidden"
            accept=".csv,.xlsx,.xls"
          />

          <div className="flex-1 text-sm text-gray-500 truncate font-medium">
            {file ? (
              <span className="text-gray-900 dark:text-gray-100">
                {file.name}
              </span>
            ) : (
              "No file selected"
            )}
          </div>
        </div>

        {isSubmitting && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4 overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress || 5}%` }}
            >
              <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-pulse"></div>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2 animate-pulse">
              Processing... {progress ? `${progress}%` : ""}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          {!isPolling && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isPolling ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Importing...
              </>
            ) : isSubmitting ? (
              "Uploading..."
            ) : (
              "Start Import"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
