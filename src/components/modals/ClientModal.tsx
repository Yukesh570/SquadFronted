import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

// --- APIs ---
import {
  createClientApi,
  updateClientApi,
  type ClientData,
} from "../../api/clientApi/clientApi";
import { getCompaniesApi } from "../../api/companyApi/companyApi";
import {
  getIpWhitelistApi,
  createIpWhitelistApi,
  deleteIpWhitelistApi,
} from "../../api/ipWhitelistApi/ipWhitelistApi";

// @ts-ignore
import { getCustomerRatesApi } from "../../api/rateApi/customerRateApi"; 

// --- Components ---
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import ToggleSwitch from "../ui/ToggleSwitch";
import TextArea from "../ui/TextArea";

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
  // --- State ---
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    ratePlanName: "",
    status: "ACTIVE",
    route: "DIRECT",
    paymentTerms: "PREPAID",
    creditLimit: "", 
    balanceAlertAmount: "",
    allowNetting: false,
    enableDlr: false,
    ipWhitelist: "",
    smppUsername: "",
    smppPassword: "",
    internalNotes: "",
  });

  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [ratePlanOptions, setRatePlanOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Helper: Validate IP ---
  const isValidIp = (ip: string) => {
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Check = ip.includes(":");
    return ipv4Regex.test(ip) || ipv6Check;
  };

  // --- Static Options ---
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

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      getCompaniesApi("company", 1, 1000)
        .then((res: any) => {
          let list = [];
          if (res && res.results) list = res.results;
          else if (Array.isArray(res)) list = res;
          setCompanyOptions(
            list.map((c: any) => ({ label: c.name, value: String(c.id) })),
          );
        })
        .catch((err: any) => console.error("Failed to load companies", err));

      getCustomerRatesApi("customerRate", 1, 1000)
        .then((res: any) => {
          let list = res.results || (Array.isArray(res) ? res : []);
          setRatePlanOptions(
            list.map((r: any) => ({
              label: r.ratePlan || r.ratePlanName || r.name,
              value: r.ratePlan || r.ratePlanName || r.name,
            })),
          );
        })
        .catch((err: any) => console.error("Failed to load rate plans", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingClient) {
      setFormData({
        company: String(editingClient.company || ""),
        name: editingClient.name,
        ratePlanName: editingClient.ratePlanName || "",
        status: editingClient.status,
        route: editingClient.route,
        paymentTerms: editingClient.paymentTerms,
        creditLimit: editingClient.creditLimit || "",
        balanceAlertAmount: editingClient.balanceAlertAmount,
        allowNetting: editingClient.allowNetting,
        enableDlr: editingClient.enableDlr,
        ipWhitelist: "",
        smppUsername: editingClient.smppUsername || "",
        smppPassword: editingClient.smppPassword || "",
        internalNotes: editingClient.internalNotes || "",
      });

      if (editingClient.id) {
        getIpWhitelistApi("ipWhitelist", 1, 1000, { client: editingClient.id })
          .then((res) => {
            const myIps = (res.results || []).filter(
              (r: any) => r.client === editingClient.id,
            );
            const ipString = myIps.map((item) => item.ip).join(", ");
            setFormData((prev) => ({ ...prev, ipWhitelist: ipString }));
          })
          .catch((err: any) => console.error("Failed to fetch IPs", err));
      }
    } else if (isOpen) {
      setFormData({
        company: "",
        name: "",
        ratePlanName: "",
        status: "ACTIVE",
        route: "DIRECT",
        paymentTerms: "PREPAID",
        creditLimit: "",
        balanceAlertAmount: "",
        allowNetting: false,
        enableDlr: false,
        ipWhitelist: "",
        smppUsername: "",
        smppPassword: "",
        internalNotes: "",
      });
    }
  }, [isOpen, editingClient]);

  // --- Handlers ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleToggle = (name: string, value: boolean) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleIpSync = async (clientId: number, ipList: string[]) => {
    const existingRes = await getIpWhitelistApi("ipWhitelist", 1, 1000, {
      client: clientId,
    });
    const allFetched = existingRes.results || [];

    const existingRecords = allFetched.filter((r) => r.client === clientId);
    const existingIpSet = new Set(existingRecords.map((r) => r.ip));

    const toAdd = ipList.filter((ip) => !existingIpSet.has(ip));
    const toDelete = existingRecords.filter((r) => !ipList.includes(r.ip));

    const promises = [
      ...toAdd.map((ip) =>
        createIpWhitelistApi({ ip, client: clientId }, "ipWhitelist"),
      ),
      ...toDelete.map((r) => deleteIpWhitelistApi(r.id!, "ipWhitelist")),
    ];

    await Promise.all(promises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.company || !formData.name) {
      toast.error("Company and Client Name are required.");
      return;
    }

    const ipList = formData.ipWhitelist
      .split(/[\n,]+/)
      .map((ip) => ip.trim())
      .filter((ip) => ip !== "");

    for (const ip of ipList) {
      if (!isValidIp(ip)) {
        toast.error(`Invalid IP address format: "${ip}"`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { ipWhitelist, creditLimit, ...clientPayload } = formData;
      const payload = {
        ...clientPayload,
        company: Number(formData.company),
        ipWhitelist: [], 
      };

      let savedClientId: number;

      if (editingClient) {
        await updateClientApi(editingClient.id!, payload, moduleName);
        savedClientId = editingClient.id!;
      } else {
        const newClient = await createClientApi(payload, moduleName);
        savedClientId = newClient.id!;
      }

      await handleIpSync(savedClientId, ipList);

      toast.success(
        editingClient
          ? "Client updated successfully!"
          : "Client created successfully!",
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const serverError = error.response?.data;

      if (serverError && typeof serverError === "object") {
        if (serverError.ip) {
          toast.error(`IP Error: ${serverError.ip[0]}`);
        } else {
          Object.entries(serverError).forEach(([key, msgs]) => {
            const msgText = Array.isArray(msgs)
              ? msgs.join(", ")
              : String(msgs);
            toast.error(`${key}: ${msgText}`);
          });
        }
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

        {/* Commercials */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Commercials & Credit
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Rate Plan Name"
              value={formData.ratePlanName}
              onChange={(v) => handleSelect("ratePlanName", v)}
              options={ratePlanOptions}
              placeholder="Select Rate Plan"
              disabled={isViewMode}
            />
            <Select
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(v) => handleSelect("paymentTerms", v)}
              options={paymentTermOptions}
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
            
            {/* Credit Limit - visible ONLY in view mode */}
            {isViewMode && (
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
            )}
          </div>
        </fieldset>

        {/* Connectivity */}
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

            {/* IP Whitelist - visible ONLY in view mode */}
            {isViewMode && (
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
            )}
          </div>
        </fieldset>

        {/* Notes */}
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

        {/* Settings */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Settings
          </legend>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={isViewMode ? "pointer-events-none opacity-50" : ""}>
              <ToggleSwitch
                label="Allow Netting"
                checked={formData.allowNetting}
                onChange={(v) => handleToggle("allowNetting", v)}
              />
            </div>
            <div className={isViewMode ? "pointer-events-none opacity-50" : ""}>
              <ToggleSwitch
                label="Enable Dlr"
                checked={formData.enableDlr}
                onChange={(v) => handleToggle("enableDlr", v)}
              />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
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