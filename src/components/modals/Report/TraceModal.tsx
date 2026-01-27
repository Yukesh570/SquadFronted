import React from "react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import { Copy } from "lucide-react";
import type { TrafficLogData } from "../../../api/reportApi/liveTrafficApi";

interface TraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TrafficLogData | null;
}

const TraceModal: React.FC<TraceModalProps> = ({ isOpen, onClose, data }) => {
  if (!data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Trace ID: ${data.messageId}`}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold">
              Sender ID
            </span>
            <p className="text-sm font-medium text-text-primary dark:text-white">
              {data.senderId}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold">
              Receiver
            </span>
            <p className="text-sm font-medium text-text-primary dark:text-white">
              {data.msisdn}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold">
              Latency
            </span>
            <p className="text-sm font-medium text-text-primary dark:text-white">
              {data.latency}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold">
              Cost
            </span>
            <p className="text-sm font-medium text-text-primary dark:text-white">
              {data.cost}
            </p>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-xs font-semibold text-text-secondary uppercase">
              Technical Log
            </span>
            <Button variant="secondary" size="xs" onClick={handleCopy}>
              <Copy size={12} className="mr-1" /> Copy JSON
            </Button>
          </div>
          <pre className="p-4 bg-gray-900 text-green-400 text-xs font-mono overflow-x-auto max-h-[400px]">
            {JSON.stringify(data, null, 2)}
          </pre>
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

export default TraceModal;
