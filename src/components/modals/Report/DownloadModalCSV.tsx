import React, { useState } from "react";
import { X, Download } from "lucide-react";
import { toast } from "react-toastify";
import Select from "../../ui/Select";
import DatePicker from "../../ui/DatePicker";

// Make sure you import both your start API and status check API
import { downloadCSVApi } from "../../../api/reportApi/messageReportApi";
import { downloadStatus } from "../../../api/downloadApi/downloadApi";

interface DownloadReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    moduleName: string;
}

const formatToYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const DownloadReportModal: React.FC<DownloadReportModalProps> = ({
    isOpen,
    onClose,
    moduleName,
}) => {

    const [downloadMode, setDownloadMode] = useState("last24");
    const [singleDate, setSingleDate] = useState<Date | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0); // Add this line!
    if (!isOpen) return null;

    const modeOptions = [
        { label: "Last 24 Hours", value: "last24" },
        { label: "Specific Date", value: "single" },
        { label: "Date Range (31 Days Max)", value: "range" },
    ];

    const handleExport = async () => {
        try {
            setIsDownloading(true);

            // 1. Construct the Date searchParams
            const searchParams: Record<string, string> = {};

            if (downloadMode === "single") {
                if (!singleDate) {
                    toast.error("Please select a date.");
                    setIsDownloading(false);
                    return;
                }
                searchParams.date = formatToYMD(singleDate);
            } else if (downloadMode === "range") {
                if (!startDate || !endDate) {
                    toast.error("Please select start and end dates.");
                    setIsDownloading(false);
                    return;
                }
                if (startDate > endDate) {
                    toast.error("Start date must be before end date.");
                    setIsDownloading(false);
                    return;
                }

                // --- ADD 1-MONTH (31 DAYS) VALIDATION HERE ---
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 31) {
                    toast.error("Maximum allowed date range cannot exceed 1 month.");
                    setIsDownloading(false);
                    return;
                }
                // ---------------------------------------------

                searchParams.startDate = formatToYMD(startDate);
                searchParams.endDate = formatToYMD(endDate);
            }
            // 2. Initiate Export
            const data: any = await downloadCSVApi(moduleName, searchParams);

            if (!data || !data.task_id) {
                toast.error("Failed to start export process.");
                setIsDownloading(false);
                return;
            }

            const taskId = data.task_id;
            let attempts = 0;
            const maxAttempts = 60; // 120 seconds total limit for big SMS files

            toast.info("Export started. Please wait...");

            // 3. Poll for Status (Just like your Company pattern)
            const checkStatus = setInterval(async () => {
                attempts += 1;
                try {
                    const res = await downloadStatus(moduleName, taskId);

                    // Update the progress bar state so the UI rerenders!
                    if (res && res.progress) {
                        setProgress(res.progress);
                    }

                    if (res && res.ready) {
                        clearInterval(checkStatus);
                        setIsDownloading(false);
                        setProgress(0); // Reset for next time
                        onClose();

                        if (res.download_url) {
                            window.location.href = res.download_url;
                            toast.success("Export successful!");
                        } else {
                            toast.error(res.error || "Export generated but URL is missing.");
                        }
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkStatus);
                        setIsDownloading(false);
                        setProgress(0);
                        toast.error("Export timed out.");
                    }
                } catch (error) {
                    if (attempts >= maxAttempts) {
                        clearInterval(checkStatus);
                        setIsDownloading(false);
                        toast.error("Failed to check status.");
                    }
                }
            }, 2000);

        } catch (error) {
            console.error(error);
            toast.error("Failed to initiate export.");
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Download CSV Report
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <Select
                        label="Date Filter"
                        options={modeOptions}
                        value={downloadMode}
                        onChange={(val) => setDownloadMode(val)}
                        placeholder="Select a timeframe"
                    />

                    {downloadMode === "single" && (
                        <DatePicker
                            label="Select Date"
                            selected={singleDate}
                            onChange={(date) => setSingleDate(date)}
                            placeholder="YYYY-MM-DD"
                            showTimeSelect={false}
                        />
                    )}

                    {downloadMode === "range" && (
                        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                            <div className="flex-1">
                                <DatePicker
                                    label="Start Date"
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    placeholder="YYYY-MM-DD"
                                    showTimeSelect={false}
                                />
                            </div>
                            <div className="flex-1">
                                <DatePicker
                                    label="End Date"
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    placeholder="YYYY-MM-DD"
                                    showTimeSelect={false}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isDownloading}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isDownloading}
                        className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                    >
                        <Download size={16} />
                        <span>
                            {isDownloading ? `Generating... ${progress}%` : "Download CSV"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};