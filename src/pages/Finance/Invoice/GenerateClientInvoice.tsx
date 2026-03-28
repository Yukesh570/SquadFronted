import React, { useState, useEffect, useRef } from "react";
import { Home } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// --- APIs ---
import { generateClientInvoiceApi } from "../../../api/financeApi/clientInvoiceApi";
import { getClientsApi } from "../../../api/clientApi/clientApi";
import { getUsersApi } from "../../../api/userApi/userApi";

// --- Components ---
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import DatePicker from "../../../components/ui/DatePicker";
import { actionHelper } from "../../../helper/action";

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

const GenerateClientInvoice: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    accountManager: "0", 
    client: "",
  });
  
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());

  const [amOptions, setAmOptions] = useState<Option[]>([]);
  const [clientOptions, setClientOptions] = useState<Option[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Generate Client Invoice";
        
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsResponse: any = await getClientsApi("client", 1, 1000);
        let clientsData = clientsResponse?.results || (Array.isArray(clientsResponse) ? clientsResponse : []);
        setClientOptions(clientsData.map((c: any) => ({ label: c.name, value: String(c.id) })));

        const amResponse: any = await getUsersApi("user", 1, 1000);
        let amData = amResponse?.results || (Array.isArray(amResponse) ? amResponse : []);
        
        const mappedUsers = amData.map((u: any) => ({ label: u.username || u.name || `User ${u.id}`, value: String(u.id) }));
        setAmOptions([{ label: "None", value: "0" }, ...mappedUsers]);

      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load dropdown options.");
      }
    };
    fetchData();
  }, []);

  const getPayload = () => {
    if (!formData.client || !fromDate || !toDate || !invoiceDate) return null;
    
    return {
      accountManager: formData.accountManager && formData.accountManager !== "0" ? Number(formData.accountManager) : null,
      client: Number(formData.client),
      fromDate: formatLocalDate(fromDate),
      toDate: formatLocalDate(toDate),
      invoiceDate: formatLocalDate(invoiceDate),
    };
  };

  const handlePreview = async () => {
    const payload = getPayload();
    if (!payload) {
      toast.error("Please fill in Client and all Date fields to preview.");
      return;
    }

    setIsPreviewing(true);
    try {
      const res = await generateClientInvoiceApi(payload, "PREVIEW");
      toast.success(`Preview Success! Amount: $${res.totalAmount || "0.00"}`);
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMsg = errorData?.detail || errorData?.error || (errorData ? JSON.stringify(errorData) : "Preview calculation failed.");
      toast.error(errorMsg);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = getPayload();
    if (!payload) {
      toast.error("Please fill in Client and all Date fields to generate.");
      return;
    }

    setIsSubmitting(true);
    try {
      await generateClientInvoiceApi(payload, "GENERATE");
      toast.success("Client Invoice generated successfully!");
      
      // FIXED: Redirecting to the correct deeply nested route for the Client Invoice Table
      navigate("/finance/invoice/clientBilling/clientInvoice");
      
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMsg = errorData?.detail || errorData?.error || (errorData ? JSON.stringify(errorData) : "Failed to generate invoice.");
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          Generate Client Invoice
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Finance</span>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Generate Client Invoice</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-card dark:bg-gray-800">
        <form className="space-y-5" onSubmit={handleSubmit}>
          
          <Select
            label="Account Manager"
            value={formData.accountManager}
            onChange={(v) => setFormData({ ...formData, accountManager: v })}
            options={[...amOptions]}
            placeholder="Select Account Manager"
          />

          <Select
            label="Client *"
            value={formData.client}
            onChange={(v) => setFormData({ ...formData, client: v })}
            options={[...clientOptions]}
            placeholder="Select Client"
          />

          <hr className="dark:border-gray-700" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DatePicker
              label="From Date *"
              selected={fromDate}
              onChange={(val) => setFromDate(val)}
            />
            <DatePicker
              label="To Date *"
              selected={toDate}
              onChange={(val) => setToDate(val)}
            />
          </div>

          <DatePicker
            label="Invoice Date *"
            selected={invoiceDate}
            onChange={(val) => setInvoiceDate(val)}
          />

          <div className="pt-3 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreview}
              disabled={isPreviewing || isSubmitting}
            >
              {isPreviewing ? "Calculating..." : "Preview"}
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isPreviewing}
            >
              {isSubmitting ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateClientInvoice;