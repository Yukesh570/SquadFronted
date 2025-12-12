import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/30">
          <AlertTriangle size={40} className="text-red-600 dark:text-red-500" />
        </div>

        <p className="text-text-secondary text-sm leading-relaxed dark:text-gray-300">
          {message}
        </p>

        <div className="flex justify-center space-x-3 w-full pt-4">
          <Button variant="secondary" onClick={onClose} className="w-1/2">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-1/2"
          >
            {isDeleting ? "Deleting" : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
