import React, { useState, useEffect, useRef } from "react";
import { Home } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// --- APIs ---
import { generateVendorInvoiceApi, getVendorsApi } from "../../../api/financeApi/vendorInvoiceApi";
import { getAllUserInformationApi } from "../../../api/userApi/userApi";

// --- Components ---
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import DatePicker from "../../../components/ui/DatePicker";
import { actionHelper } from "../../../helper/action";
import { InvoicePreviewModal } from "../../../components/modals/Finance/InvoicePreviewModal";

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

const GenerateVendorInvoice: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    accountManager: "",
    vendor: "",
  });
  
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());

  const [amOptions, setAmOptions] = useState<Option[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

  // Loading & Modal States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const hasLoggedOpening = useRef(false);

  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Generate Vendor Invoice";
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Vendors
        const vendorsResponse: any = await getVendorsApi("vendor", 1, 1000);
        let vendorsData = vendorsResponse?.results || (Array.isArray(vendorsResponse) ? vendorsResponse : []);
        setVendorOptions(vendorsData.map((v: any) => ({ label: v.name || v.profileName, value: String(v.id) })));

        // 2. Fetch Users
        try {
          const userInfoRes = await getAllUserInformationApi();
          let mappedUsers: Option[] = [];
          let currentUserId = "";

          if (Array.isArray(userInfoRes) || userInfoRes?.results) {
            const usersArray = Array.isArray(userInfoRes) ? userInfoRes : userInfoRes.results;
            mappedUsers = usersArray.map((u: any) => ({
              label: u.username || u.name || `User ${u.id}`,
              value: String(u.id)
            }));
          } else if (userInfoRes && userInfoRes.id !== undefined) {
            currentUserId = String(userInfoRes.id);
            const currentUserName = userInfoRes.username || userInfoRes.name || `User ${userInfoRes.id}`;
            mappedUsers = [{ label: currentUserName, value: currentUserId }];
          }

          setAmOptions([{ label: "None", value: "0" }, ...mappedUsers]);

          if (currentUserId) {
            setFormData((prev) => ({ ...prev, accountManager: currentUserId }));
          }

        } catch (e) {
          console.warn("Could not fetch user info");
          setAmOptions([{ label: "None", value: "0" }]);
        }

      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load dropdown options.");
      }
    };
    fetchData();
  }, []);

  const getPayload = () => {
    if (!formData.vendor || !fromDate || !toDate || !invoiceDate) return null;
    
    return {
      accountManager: formData.accountManager && formData.accountManager !== "0" ? Number(formData.accountManager) : null,
      vendor: Number(formData.vendor),
      fromDate: formatLocalDate(fromDate),
      toDate: formatLocalDate(toDate),
      invoiceDate: formatLocalDate(invoiceDate),
    };
  };

  const handlePreview = async () => {
    const payload = getPayload();
    if (!payload) {
      toast.error("Please fill in Vendor and all Date fields to preview.");
      return;
    }

    setIsPreviewing(true);
    try {
      const resBlob = await generateVendorInvoiceApi(payload, "PREVIEW");
      const fileUrl = window.URL.createObjectURL(new Blob([resBlob], { type: 'application/pdf' }));
      
      setPreviewPdfUrl(fileUrl);
      setIsPreviewModalOpen(true); 
      toast.success("Preview generated!");

    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          toast.error(errorData.detail || errorData.error || "Preview calculation failed.");
        } catch {
          toast.error("Preview calculation failed.");
        }
      } else {
        toast.error("Preview calculation failed.");
      }
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCloseModal = () => {
    setIsPreviewModalOpen(false);
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleGenerate = async () => {
    const payload = getPayload();
    if (!payload) {
      toast.error("Please fill in Vendor and all Date fields to generate.");
      return;
    }

    setIsSubmitting(true);
    try {
      await generateVendorInvoiceApi(payload, "GENERATE");
      toast.success("Vendor Invoice generated successfully!");
      handleCloseModal(); 
      navigate("/finance/invoice/vendorBilling/vendorInvoice");
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
          Generate Vendor Invoice
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Finance</span>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Generate Vendor Invoice</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-card dark:bg-gray-800">
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          
          <Select
            label="Account Manager"
            value={formData.accountManager}
            onChange={(v) => setFormData({ ...formData, accountManager: v })}
            options={[...amOptions]}
            placeholder="Select Account Manager"
          />

          <Select
            label="Vendor *"
            value={formData.vendor}
            onChange={(v) => setFormData({ ...formData, vendor: v })}
            options={[...vendorOptions]}
            placeholder="Select Vendor"
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

      <InvoicePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleCloseModal}
        onGenerate={handleGenerate}
        pdfUrl={previewPdfUrl}
        isGenerating={isSubmitting}
      />
    </div>
  );
};

export default GenerateVendorInvoice;