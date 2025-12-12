import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createClientApi,
  updateClientApi,
  type ClientData,
} from "../../api/clientApi/clientApi";
import { getCompaniesApi } from "../../api/companyApi/companyApi";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import ToggleSwitch from "../ui/ToggleSwitch";
import TextArea from "../ui/TextArea";
import { Eye, EyeOff } from "lucide-react";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingClient: ClientData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingClient,
  isViewMode = false,
}) => {
  // Initial State
  const [formData, setFormData] = useState({
    company: "", // Managed as string for Select input, converted to number on submit
    name: "",
    status: "ACTIVE",
    route: "DIRECT",
    paymentTerms: "PREPAID",
    creditLimit: "",
    balanceAlertAmount: "",
    allowNetting: false,
    ipWhitelist: "",
    smppUsername: "",
    smppPassword: "",
    internalNotes: "", // UPDATED: Strictly matches API
  });

  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Options
  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Trial", value: "TRIAL" },
    { label: "Suspended", value: "SUSPENDED" },
  ];

  const routeOptions = [
    { label: "Direct", value: "DIRECT" },
    { label: "High Quality", value: "HIGH QUALITY" },
    { label: "SIM", value: "SIM" },
    { label: "Wholesale", value: "WHOLESALE" },
    { label: "Full Featured", value: "FULL" },
    { label: "Spam", value: "SPAM" },
  ];

  const paymentTermOptions = [
    { label: "Prepaid", value: "PREPAID" },
    { label: "Postpaid", value: "POSTPAID" },
    { label: "Net 7", value: "NET7" },
    { label: "Net 15", value: "NET15" },
    { label: "Net 30", value: "NET30" },
  ];

  // Load Companies on Open
  useEffect(() => {
    if (isOpen) {
      getCompaniesApi("company", 1, 1000)
        .then((res: any) => {
          let list = [];
          if (res && res.results) list = res.results;
          else if (Array.isArray(res)) list = res;

          setCompanyOptions(
            list.map((c: any) => ({ label: c.name, value: String(c.id) }))
          );
        })
        .catch((err) => console.error("Failed to load companies", err));
    }
  }, [isOpen]);

  // Load Data for Edit
  useEffect(() => {
    if (isOpen && editingClient) {
      setFormData({
        company: String(editingClient.company || ""),
        name: editingClient.name,
        status: editingClient.status,
        route: editingClient.route,
        paymentTerms: editingClient.paymentTerms,
        creditLimit: editingClient.creditLimit,
        balanceAlertAmount: editingClient.balanceAlertAmount,
        allowNetting: editingClient.allowNetting,
        ipWhitelist: editingClient.ipWhitelist || "",
        smppUsername: editingClient.smppUsername || "",
        smppPassword: editingClient.smppPassword || "",
        internalNotes: editingClient.internalNotes || "", // UPDATED
      });
    } else if (isOpen) {
      // Reset
      setFormData({
        company: "",
        name: "",
        status: "ACTIVE",
        route: "DIRECT",
        paymentTerms: "PREPAID",
        creditLimit: "",
        balanceAlertAmount: "",
        allowNetting: false,
        ipWhitelist: "",
        smppUsername: "",
        smppPassword: "",
        internalNotes: "", // UPDATED
      });
    }
  }, [isOpen, editingClient]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleToggle = (name: string, value: boolean) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.company || !formData.name) {
      toast.error("Company and Client Name are required.");
      return;
    }

    setIsSubmitting(true);

    // Strict Type Conversion
    const payload = {
      ...formData,
      company: Number(formData.company),
    };

    try {
      if (editingClient) {
        await updateClientApi(editingClient.id!, payload, moduleName);
        toast.success("Client updated successfully!");
      } else {
        await createClientApi(payload, moduleName);
        toast.success("Client created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const serverError = error.response?.data;
      if (serverError && typeof serverError === "object") {
        Object.entries(serverError).forEach(([key, msgs]) => {
          toast.error(`${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
        });
      } else {
        toast.error("Failed to save client.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isViewMode
          ? "View Client"
          : editingClient
          ? "Edit Client"
          : "Add New Client"
      }
      className="max-w-4xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-[80vh] overflow-y-auto px-1"
      >
        {/* Identity */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Identity
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Company"
              value={formData.company}
              onChange={(v) => handleSelect("company", v)}
              options={companyOptions}
              placeholder="Select Company"
              disabled={isViewMode}
            />
            <Input
              label="Client Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Unique Client Name"
              required
              disabled={isViewMode}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(v) => handleSelect("status", v)}
              options={statusOptions}
              disabled={isViewMode}
            />
            <Select
              label="Route Types"
              value={formData.route}
              onChange={(v) => handleSelect("route", v)}
              options={routeOptions}
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Commercials & Credit */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Commercials & Credit
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(v) => handleSelect("paymentTerms", v)}
              options={paymentTermOptions}
              disabled={isViewMode}
            />
            <div className="flex items-end mb-2">
              <ToggleSwitch
                label="Allow Netting"
                checked={formData.allowNetting}
                onChange={(v) => handleToggle("allowNetting", v)}
              />
            </div>
            <Input
              label="Credit Limit"
              name="creditLimit"
              type="number"
              step="0.0001"
              value={formData.creditLimit}
              onChange={handleChange}
              placeholder="0.0000"
              disabled={isViewMode}
            />
            <Input
              label="Balance Alert Amount"
              name="balanceAlertAmount"
              type="number"
              step="0.0001"
              value={formData.balanceAlertAmount}
              onChange={handleChange}
              placeholder="0.0000"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Connectivity & Security */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Connectivity & Security
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SMPP Username (System ID)"
              name="smppUsername"
              value={formData.smppUsername}
              onChange={handleChange}
              disabled={isViewMode}
            />
            <Input
              label="SMPP Password"
              name="smppPassword"
              type={showPassword ? "text" : "password"}
              value={formData.smppPassword}
              onChange={handleChange}
              disabled={isViewMode}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <div className="md:col-span-2">
              <TextArea
                label="IP Whitelist"
                name="ipWhitelist"
                value={formData.ipWhitelist}
                onChange={handleChange}
                placeholder="Enter IPs separated by commas or new lines"
                disabled={isViewMode}
                rows={3}
              />
            </div>
          </div>
        </fieldset>

        {/* Notes - Updated Name */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Notes
          </legend>
          <TextArea
            label="Internal Notes"
            name="internalNotes"
            value={formData.internalNotes}
            onChange={handleChange}
            disabled={isViewMode}
            rows={2}
          />
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingClient
                ? "Update Client"
                : "Add Client"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
