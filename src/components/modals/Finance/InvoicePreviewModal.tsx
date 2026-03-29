import React from "react";
import { X, FileText } from "lucide-react";
import Button from "../../ui/Button";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  pdfUrl: string | null; 
  isGenerating: boolean;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  pdfUrl,
  isGenerating,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <FileText className="text-primary" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Preview</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Clean PDF View (Removed padding, borders, and rounded corners for flush fit) */}
        <div className="w-full h-[70vh] bg-white dark:bg-gray-900 relative">
          {pdfUrl ? (
            <iframe 
              // Added scrollbar=0 and view=FitH to force edge-to-edge stretching
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
              title="Invoice Preview" 
              className="w-full h-full border-0 outline-none bg-transparent"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading document...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
};