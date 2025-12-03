import React from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "max-w-md",
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 dark:bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Full-screen container for centering the panel */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel
            className={`w-full rounded-xl p-6 text-left align-middle shadow-xl 
            
            /* LIGHT MODE */
            bg-white text-gray-900 
            
            /* DARK MODE */
            dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700
            
            ${className}`}
          >
            <div className="flex items-center justify-between mb-6">
              {title && (
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6"
                >
                  {title}
                </Dialog.Title>
              )}
              <button
                type="button"
                className="rounded-md p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="text-text-secondary dark:text-gray-300">
              {children}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;
