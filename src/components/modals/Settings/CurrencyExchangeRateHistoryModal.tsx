import React, { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { toast } from "react-toastify";
import {
  getCurrencyExchangeRateHistoryApi,
  type CurrencyExchangeRateData,
} from "../../../api/settingApi/currencyExchangeRateApi/currencyExchangeRateApi";
import Modal from "../../ui/Modal";
import { StatusBadge } from "../../ui/StatusBadge";
import { formatDateTime } from "../../../helper/dateFormatter";

interface CurrencyExchangeRateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateId: number | null;
  moduleName: string;
}

export const CurrencyExchangeRateHistoryModal: React.FC<CurrencyExchangeRateHistoryModalProps> = ({
  isOpen,
  onClose,
  rateId,
  moduleName,
}) => {
  const [history, setHistory] = useState<CurrencyExchangeRateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && rateId) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [isOpen, rateId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await getCurrencyExchangeRateHistoryApi(moduleName, rateId!);
      // Assuming paginated response
      setHistory(response.results || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to fetch currency history"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Currency Exchange Rate History"
      className="max-w-6xl"
    >
      <div className="mt-4">
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4 text-sm text-blue-800 flex items-start gap-2 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p>The highlighted row represents the latest active version. Only the latest version can be edited to trigger an upgrade.</p>
            <p className="mt-1">Right-click a row for view, edit, or delete options.</p>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[60vh]">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <span className="text-gray-500">Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No history found.
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800 text-text-secondary dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Base Currency</th>
                <th className="px-4 py-3 font-medium">Target Currency</th>
                <th className="px-4 py-3 font-medium">Exchange Rate</th>
                <th className="px-4 py-3 font-medium">Effective From</th>
                <th className="px-4 py-3 font-medium">Effective To</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {history.map((rate, idx) => (
                <tr key={rate.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-text-primary dark:text-gray-100 flex items-center gap-2">
                    {rate.status === "ACTIVE" && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                        LATEST
                      </span>
                    )}
                    v{(rate as any).version || idx + 1}
                  </td>
                  <td className="px-4 py-3 text-text-primary dark:text-gray-100">
                    {rate.baseCurrency_name ? rate.baseCurrency_name : rate.baseCurrency}{" "}
                    {rate.baseCurrency_name && (
                      <span className="text-gray-400">({rate.baseCurrency})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary dark:text-gray-100">
                    {rate.targetCurrency_name ? rate.targetCurrency_name : rate.targetCurrency}{" "}
                    {rate.targetCurrency_name && (
                      <span className="text-gray-400">({rate.targetCurrency})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary dark:text-gray-100 font-medium">
                    {rate.targetCurrency_symbol ? `${rate.targetCurrency_symbol} ` : ""}
                    {rate.exchangeRate}
                  </td>
                  <td className="px-4 py-3 text-text-secondary dark:text-gray-400">
                    {rate.effectiveFrom ? formatDateTime(rate.effectiveFrom) : "-"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary dark:text-gray-400">
                    {(rate as any).effectiveTo ? formatDateTime((rate as any).effectiveTo) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={rate.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </Modal>
  );
};
