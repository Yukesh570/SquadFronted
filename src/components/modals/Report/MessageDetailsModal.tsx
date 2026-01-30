import React from "react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import { Copy } from "lucide-react";
import type { MessageLogData } from "../../../api/reportApi/messageReportApi";

interface MessageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MessageLogData | null;
}

const MessageDetailsModal: React.FC<MessageDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.text);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Message Details (ID: ${data.id})`}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold">
              Status
            </span>
            <p
              className={`text-sm font-medium ${
                data.status === "Failed"
                  ? "text-red-600"
                  : data.status === "Delivered"
                    ? "text-green-600"
                    : "text-text-primary"
              }`}
            >
              {data.status}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold">
              Created At
            </span>
            <p className="text-sm font-medium text-text-primary dark:text-white">
              {new Date(data.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Full Text View */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-xs font-semibold text-text-secondary uppercase">
              Message Content
            </span>
            <Button variant="secondary" size="xs" onClick={handleCopy}>
              <Copy size={12} className="mr-1" /> Copy Text
            </Button>
          </div>
          <div className="p-4 bg-white dark:bg-gray-900 text-sm text-text-primary dark:text-gray-200 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {data.text}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MessageDetailsModal;
