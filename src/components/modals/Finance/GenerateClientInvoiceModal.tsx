import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

// --- APIs ---
import { generateClientInvoiceApi } from "../../../api/financeApi/clientInvoiceApi";
import { getClientsApi } from "../../../api/clientApi/clientApi";

// --- Components ---
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import DatePicker from "../../ui/DatePicker";
import Modal from "../../ui/Modal";

interface GenerateClientInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Option {
  label: string;
  value: string;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const GenerateClientInvoiceModal: React.FC<GenerateClientInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({ client: "" });
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  
  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getClientsApi("client", 1, 1000)
        .then((res: any) => {
          const list = res.results || (Array.isArray(res) ? res : []);
          setClientOptions(list.map((c: any) => ({ label: c.name, value: String(c.id) })));
        }).catch(() => console.error("Failed to load clients"));
        
      setFormData({ client: "" });
      setFromDate(null);
      setToDate(null);
      setInvoiceDate(new Date());
    }
  }, [isOpen]);

  const getPayload = () => {
    if (!formData.client || !fromDate || !toDate || !invoiceDate) {
      return null;
    }
    return {
      accountManager: null, // Hardcoded to None/null based on client request
      client: Number(formData.client),
      fromDate: formatLocalDate(fromDate),
      toDate: formatLocalDate(toDate),
      invoiceDate: formatLocalDate(invoiceDate),
    };
  };

  const handlePreview = async () => {
    const payload = getPayload();
    if (!payload) {
      toast.error("All fields are required to preview.");
      return;
    }
    
    setIsPreviewing(true);
    try {
      const res = await generateClientInvoiceApi(payload, "PREVIEW");
      // Toasting the returned Preview Data
      toast.success(`Preview Success! Amount: $${res.totalAmount || "Calculated"}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Preview calculation failed.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    const payload = getPayload();
    if (!payload) {
      toast.error("All fields are required to generate an invoice.");
      return;
    }

    setIsSubmitting(true);
    try {
      await generateClientInvoiceApi(payload, "GENERATE");
      toast.success("Client Invoice generated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to generate invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Client Invoice" className="max-w-2xl">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Client"
            value={formData.client}
            onChange={(v) => setFormData({ client: v })}
            options={clientOptions}
            placeholder="Select Client"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker label="From Date" selected={fromDate} onChange={(val) => setFromDate(val)} />
          <DatePicker label="To Date" selected={toDate} onChange={(val) => setToDate(val)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker label="Invoice Date" selected={invoiceDate} onChange={(val) => setInvoiceDate(val)} />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={handlePreview} disabled={isPreviewing} className="border-primary text-primary">
            {isPreviewing ? "Calculating..." : "Preview"}
          </Button>
          <Button type="button" variant="primary" onClick={handleGenerate} disabled={isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};