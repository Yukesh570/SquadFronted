import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ViewModal: React.FC<ViewModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-lg">
      <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
        {children}
      </div>
      <div className="flex justify-end pt-6">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

// Helper sub-component for consistent rows
export const ViewRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-3 gap-4 py-3">
    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </span>
    <span className="col-span-2 text-sm text-gray-900 dark:text-white break-words">
      {value || "-"}
    </span>
  </div>
);
