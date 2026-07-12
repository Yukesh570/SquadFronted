import React, { useState, useRef, useEffect } from "react";
import { Upload, FileSpreadsheet, Loader2, Info } from "lucide-react";
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

  const formatErrorMessage = (msg: string): string => {
    if (typeof msg === 'string' && msg.toLowerCase().includes('utf-8')) {
      return "Encoding Error: Please save your Excel file as 'CSV UTF-8 (Comma delimited)' and try again.";
    }
    return msg;
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
        const status = (res.state || res.status || "").toUpperCase();

        if (res.progress) {
          setProgress(res.progress);
        } else {
          setProgress((prev) => (prev && prev < 90 ? prev + 10 : 90));
        }

        if (status === "FAILURE" || status === "FAILED" || status === "ERROR") {
          clearInterval(intervalId);
          let errorMsg = res.error || res.result || res.message || "Unknown error";
          errorMsg = formatErrorMessage(String(errorMsg));
          
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
            let errorText =
              typeof firstError === "string"
                ? firstError
                : `Row ${firstError.row}: ${firstError.error}`;

            toast.error(formatErrorMessage(errorText));
          } else {
            const resultMessage = res.result?.message;
            toast.success(resultMessage || "Import completed successfully!");
            setIsPolling(false);
            setIsSubmitting(false);
            onSuccess();
            onClose();
          }
          return;
        }

        // Still processing — keep polling regardless of elapsed time/attempts.
        // No timeout-based cancellation here: large imports can legitimately
        // take a long time, and the backend job keeps running whether or not
        // we're still watching it, so we just keep asking until it reports
        // completed/failed.
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
      const jobId = response.task_id || response.batch_id;

      if (jobId && checkStatusApi) {
        toast.info("Import started. Processing...");
        setIsPolling(true);
        pollStatus(jobId);
      } else {
        if (response.status === "error" || response.error) {
          let msg = response.error || response.message || "Import failed.";
          toast.error(formatErrorMessage(String(msg)));
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
          let msg =
            data.error ||
            data.message ||
            data.detail ||
            (data.result?.errors
              ? data.result.errors[0]?.error
              : "Validation failed.");
          toast.error(formatErrorMessage(String(msg)));
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
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-lg overflow-visible">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center mb-1">
          
          <div className="text-sm text-text-secondary dark:text-gray-400 flex items-center gap-1.5">
            <span>Upload a CSV file to bulk import records.</span>
            
            {/* Prominent Hover Tooltip */}
            <div className="group relative flex items-center mt-0.5">
              <Info size={16} className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 cursor-help transition-colors drop-shadow-sm" />
              
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] text-center pointer-events-none border border-gray-700 dark:border-gray-600">
                If using Microsoft Excel, please use <strong>"Save As"</strong> and select <strong>"CSV UTF-8 (Comma delimited)"</strong> to prevent formatting errors.
                {/* Arrow Pointer */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
              </div>
            </div>
          </div>

          {sampleFileLink && (
            <button
              type="button"
              onClick={handleDownloadSample}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              title="Download Sample Format"
              disabled={isSubmitting}
            >
              <FileSpreadsheet size={18} />
              Sample Format
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 transition-colors">
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