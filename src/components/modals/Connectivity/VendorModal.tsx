import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

// APIs
import {
  createVendorApi,
  updateVendorApi,
  type VendorData,
} from "../../../api/connectivityApi/vendorApi";
import {
  createSmppApi,
  updateSmppApi,
  getSmppByIdApi,
} from "../../../api/connectivityApi/smppApi";
import {
  createVendorPolicyApi,
  updateVendorPolicyApi,
  getVendorPoliciesApi,
} from "../../../api/policyApi/vendorPolicyApi";
import { getCompaniesApi } from "../../../api/companyApi/companyApi";

// @ts-ignore
import { getVendorRatesApi } from "../../../api/rateApi/vendorRateApi";

// UI Components
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingVendor: VendorData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingVendor,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    company: "",
    profileName: "",
    ratePlanName: "",
    connectionType: "SMPP",
    invoicePolicy: "ON ATTEMPT",
    smppId: 0,
    smppHost: "",
    smppPort: "",
    systemID: "",
    password: "",
    bindMode: "TRANSMITTER",
    sourceTON: "",
    sourceNPI: "",
    destTON: "",
    destNPI: "",
    rateTps: "",
    sendQueueLimit: "",
    delayTime: "",
    responseTimeout: "",
    enquireLinkInterval: "",
    connectionTimeout: "",
    connectionRetryDelay: "",
    connectionRetryCount: "",
    bindRetryDelay: "",
    bindRetryCount: "",
    connectionRecoveryDelay: "",
    logLevel: "INFO",
    tlvTag: "",
    tlvValue: "",
    bindStatus: "OFFLINE",
    active_session_count: 0,
    max_allowed_sessions: 1,
  });

  // UI & Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Track existing policy ID to know if we are updating or creating
  const [existingPolicyId, setExistingPolicyId] = useState<number | null>(null);

  // Dropdown Options
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [ratePlanOptions, setRatePlanOptions] = useState<Option[]>([]);

  const connectionTypeOptions = [
    { label: "SMPP", value: "SMPP" },
    { label: "HTTP", value: "HTTP" },
  ];

  const invoicePolicyOptions = [
    { label: "On Attempt", value: "ON ATTEMPT" },
    { label: "On Submit", value: "ON SUBMIT" },
    { label: "On Delivered", value: "ON DELIVERED" },
  ];

  const bindModeOptions = [
    { label: "Transmitter", value: "TRANSMITTER" },
    { label: "Receiver", value: "RECEIVER" },
    { label: "Transceiver", value: "TRANSCEIVER" },
  ];

  const logLevelOptions = [
    { label: "DEBUG", value: "DEBUG" },
    { label: "INFO", value: "INFO" },
    { label: "WARNING", value: "WARNING" },
    { label: "ERROR", value: "ERROR" },
    { label: "CRITICAL", value: "CRITICAL" },
  ];

  // Fetch Dropdown Data on Mount
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

      getVendorRatesApi("vendorRate", 1, 1000)
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

  // Load Vendor, SMPP, and Policy details when editing
  useEffect(() => {
    const loadData = async () => {
      if (isOpen && editingVendor) {
        const anyVendor = editingVendor as any;
        setExistingPolicyId(null); // Reset before fetching

        // 1. Set top-level vendor data
        setFormData({
          company: editingVendor.company ? String(editingVendor.company) : "",
          profileName: editingVendor.profileName,
          ratePlanName: editingVendor.ratePlanName || "",
          connectionType: editingVendor.connectionType || "",
          invoicePolicy: editingVendor.invoicePolicy || "ON ATTEMPT",
          smppId: anyVendor.smpp || 0,
          smppHost: "",
          smppPort: "",
          systemID: "",
          password: "",
          bindMode: "TRANSMITTER",
          sourceTON: "",
          sourceNPI: "",
          destTON: "",
          destNPI: "",
          rateTps: "",
          sendQueueLimit: "",
          delayTime: "",
          responseTimeout: "",
          enquireLinkInterval: "",
          connectionTimeout: "",
          connectionRetryDelay: "",
          connectionRetryCount: "",
          bindRetryDelay: "",
          bindRetryCount: "",
          connectionRecoveryDelay: "",
          logLevel: "INFO",
          tlvTag: "",
          tlvValue: "",
          bindStatus: editingVendor.bindStatus || "OFFLINE",
          active_session_count: anyVendor.active_session_count || 0,
          max_allowed_sessions: anyVendor.max_allowed_sessions || 1,
        });

        setIsLoadingDetails(true);

        try {
          // 2. Fetch fresh SMPP details
          if (anyVendor.connectionType === "SMPP" && anyVendor.smpp) {
            const smppData = await getSmppByIdApi(anyVendor.smpp, "smpp");
            setFormData((prev) => ({
              ...prev,
              smppHost: smppData.smppHost || "",
              smppPort: String(smppData.smppPort) || "",
              systemID: smppData.systemID || "",
              password: smppData.password || "",
              bindMode: smppData.bindMode || "TRANSMITTER",
              sourceTON: String(smppData.sourceTON || ""),
              sourceNPI: String(smppData.sourceNPI || ""),
              destTON: String(smppData.destTON || ""),
              destNPI: String(smppData.destNPI || ""),
            }));
          }

          // 3. Fetch fresh Policy details linked to this vendor
          if (editingVendor.id) {
            const policyRes = await getVendorPoliciesApi(1, 10, {
              vendor: editingVendor.id,
            });

            if (
              policyRes &&
              policyRes.results &&
              policyRes.results.length > 0
            ) {
              const policyData = policyRes.results[0];

              // Save the existing policy ID so we update instead of create later
              setExistingPolicyId(policyData.id || null);

              setFormData((prev) => ({
                ...prev,
                rateTps:
                  policyData.rateTps != null ? String(policyData.rateTps) : "",
                sendQueueLimit:
                  policyData.sendQueueLimit != null
                    ? String(policyData.sendQueueLimit)
                    : "",
                delayTime:
                  policyData.delayTime != null
                    ? String(policyData.delayTime)
                    : "",
                responseTimeout:
                  policyData.responseTimeout != null
                    ? String(policyData.responseTimeout)
                    : "",
                enquireLinkInterval:
                  policyData.enquireLinkInterval != null
                    ? String(policyData.enquireLinkInterval)
                    : "",
                connectionTimeout:
                  policyData.connectionTimeout != null
                    ? String(policyData.connectionTimeout)
                    : "",
                connectionRetryDelay:
                  policyData.connectionRetryDelay != null
                    ? String(policyData.connectionRetryDelay)
                    : "",
                connectionRetryCount:
                  policyData.connectionRetryCount != null
                    ? String(policyData.connectionRetryCount)
                    : "",
                bindRetryDelay:
                  policyData.bindRetryDelay != null
                    ? String(policyData.bindRetryDelay)
                    : "",
                bindRetryCount:
                  policyData.bindRetryCount != null
                    ? String(policyData.bindRetryCount)
                    : "",
                connectionRecoveryDelay:
                  policyData.connectionRecoveryDelay != null
                    ? String(policyData.connectionRecoveryDelay)
                    : "",
                logLevel: policyData.logLevel || "INFO",
                tlvTag: policyData.tlvTag || "",
                tlvValue: policyData.tlvValue || "",
              }));
            }
          }
        } catch (error) {
          console.error("Failed to load details", error);
          toast.error("Could not load all configuration details.");
        } finally {
          setIsLoadingDetails(false);
        }
      } else if (isOpen) {
        // Reset form for "Add Vendor" mode
        setExistingPolicyId(null);
        setFormData({
          company: "",
          profileName: "",
          ratePlanName: "",
          connectionType: "SMPP",
          invoicePolicy: "ON ATTEMPT",
          smppId: 0,
          smppHost: "",
          smppPort: "",
          systemID: "",
          password: "",
          bindMode: "TRANSMITTER",
          sourceTON: "",
          sourceNPI: "",
          destTON: "",
          destNPI: "",
          rateTps: "",
          sendQueueLimit: "",
          delayTime: "",
          responseTimeout: "",
          enquireLinkInterval: "",
          connectionTimeout: "",
          connectionRetryDelay: "",
          connectionRetryCount: "",
          bindRetryDelay: "",
          bindRetryCount: "",
          connectionRecoveryDelay: "",
          logLevel: "INFO",
          tlvTag: "",
          tlvValue: "",
          bindStatus: "OFFLINE",
          active_session_count: 0,
          max_allowed_sessions: 1,
        });
      }
    };

    loadData();
  }, [isOpen, editingVendor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.company || !formData.profileName) {
      toast.error("Company and Profile Name are required.");
      return;
    }

    if (formData.connectionType === "SMPP") {
      if (!formData.smppHost || !formData.systemID || !formData.smppPort) {
        toast.error("Host, Port, and System ID are required for SMPP.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // --- 1. HANDLE SMPP ---
      let createdSmppId = formData.smppId;

      if (formData.connectionType === "SMPP") {
        const smppPayload = {
          smppHost: formData.smppHost,
          smppPort: Number(formData.smppPort),
          systemID: formData.systemID,
          password: formData.password,
          bindMode: formData.bindMode,
          sourceTON: Number(formData.sourceTON),
          sourceNPI: Number(formData.sourceNPI),
          destTON: Number(formData.destTON),
          destNPI: Number(formData.destNPI),
        };

        if (editingVendor && createdSmppId) {
          await updateSmppApi(createdSmppId, smppPayload, "smpp");
        } else {
          const smppResponse = await createSmppApi(smppPayload, "smpp");
          if (smppResponse && smppResponse.id) {
            createdSmppId = smppResponse.id;
          } else {
            throw new Error("Failed to create SMPP configuration.");
          }
        }
      }

      const finalSmppValue =
        formData.connectionType === "SMPP" && createdSmppId
          ? createdSmppId
          : null;

      // --- 2. HANDLE VENDOR ---
      const vendorPayload = {
        company: Number(formData.company),
        profileName: formData.profileName,
        ratePlanName: formData.ratePlanName,
        connectionType: formData.connectionType,
        invoicePolicy: formData.invoicePolicy,
        smpp: finalSmppValue,
      };

      let vendorId = editingVendor?.id;

      if (editingVendor) {
        await updateVendorApi(editingVendor.id!, vendorPayload, moduleName);
      } else {
        const vRes: any = await createVendorApi(vendorPayload, moduleName);
        vendorId = vRes?.id || vRes?.data?.id;
      }

      // --- 3. HANDLE POLICY ---
      if (vendorId) {
        const policyPayload: any = {
          logLevel: formData.logLevel,
        };

        if (formData.rateTps !== "")
          policyPayload.rateTps = Number(formData.rateTps);
        if (formData.sendQueueLimit !== "")
          policyPayload.sendQueueLimit = Number(formData.sendQueueLimit);
        if (formData.delayTime !== "")
          policyPayload.delayTime = Number(formData.delayTime);
        if (formData.responseTimeout !== "")
          policyPayload.responseTimeout = Number(formData.responseTimeout);
        if (formData.enquireLinkInterval !== "")
          policyPayload.enquireLinkInterval = Number(
            formData.enquireLinkInterval,
          );
        if (formData.connectionTimeout !== "")
          policyPayload.connectionTimeout = Number(formData.connectionTimeout);
        if (formData.connectionRetryDelay !== "")
          policyPayload.connectionRetryDelay = Number(
            formData.connectionRetryDelay,
          );
        if (formData.connectionRetryCount !== "")
          policyPayload.connectionRetryCount = Number(
            formData.connectionRetryCount,
          );
        if (formData.bindRetryDelay !== "")
          policyPayload.bindRetryDelay = Number(formData.bindRetryDelay);
        if (formData.bindRetryCount !== "")
          policyPayload.bindRetryCount = Number(formData.bindRetryCount);
        if (formData.connectionRecoveryDelay !== "")
          policyPayload.connectionRecoveryDelay = Number(
            formData.connectionRecoveryDelay,
          );
        if (formData.tlvTag !== "") policyPayload.tlvTag = formData.tlvTag;
        if (formData.tlvValue !== "")
          policyPayload.tlvValue = formData.tlvValue;

        try {
          if (existingPolicyId) {
            await updateVendorPolicyApi(existingPolicyId, policyPayload);
          } else {
            policyPayload.vendor = Number(vendorId);
            await createVendorPolicyApi(policyPayload);
          }
        } catch (policyErr) {
          console.error("Policy configuration save error:", policyErr);
          toast.warning("Vendor saved, but policy settings failed to save.");
        }
      }

      toast.success(
        editingVendor
          ? "Vendor updated successfully!"
          : "Vendor added successfully!",
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to save vendor.");
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
          ? "View Vendor"
          : editingVendor
            ? "Edit Vendor"
            : "Add Vendor"
      }
      className="max-w-4xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5 max-h-[80vh] overflow-y-auto px-1"
      >
        {isLoadingDetails && (
          <div className="p-3 mb-2 text-sm text-blue-800 bg-blue-50 rounded border border-blue-200 flex items-center">
            <span className="mr-2 animate-spin">⏳</span> Loading configuration
            details...
          </div>
        )}

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Identity & Commercials
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="Company Name"
              value={formData.company}
              onChange={(v) => handleSelect("company", v)}
              options={companyOptions}
              placeholder="Select Company"
              disabled={isViewMode}
            />
            <Input
              label="Profile Name"
              name="profileName"
              value={formData.profileName}
              onChange={handleChange}
              placeholder="Vendor A"
              required
              disabled={isViewMode}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="Rate Plan Name"
              value={formData.ratePlanName}
              onChange={(v) => handleSelect("ratePlanName", v)}
              options={ratePlanOptions}
              placeholder="Select Rate Plan"
              disabled={isViewMode}
            />
            <Select
              label="Invoice Policy"
              value={formData.invoicePolicy}
              onChange={(v) => handleSelect("invoicePolicy", v)}
              options={invoicePolicyOptions}
              placeholder="Select Invoice Policy"
              disabled={isViewMode}
            />
            <Select
              label="Log Level"
              value={formData.logLevel}
              onChange={(v) => handleSelect("logLevel", v)}
              options={logLevelOptions}
              placeholder="Select Log Level"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Connectivity
          </legend>
          <Select
            label="Connection Type"
            value={formData.connectionType}
            onChange={(v) => handleSelect("connectionType", v)}
            options={connectionTypeOptions}
            placeholder="Select Type"
            disabled={isViewMode}
          />
        </fieldset>

        {formData.connectionType === "SMPP" && (
          <div
            className={`border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-4 ${
              isLoadingDetails ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <h3 className="text-sm font-semibold text-primary">
              SMPP Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SMPP Host"
                name="smppHost"
                value={formData.smppHost}
                onChange={handleChange}
                placeholder="smpp.host.com"
                required
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="SMPP Port"
                name="smppPort"
                type="number"
                value={formData.smppPort}
                onChange={handleChange}
                placeholder="2775"
                required
                disabled={isViewMode || isLoadingDetails}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="System ID"
                name="systemID"
                value={formData.systemID}
                onChange={handleChange}
                placeholder="User ID"
                required
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Secret"
                disabled={isViewMode || isLoadingDetails}
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
              <Select
                label="Bind Mode"
                value={formData.bindMode}
                onChange={(v) => handleSelect("bindMode", v)}
                options={bindModeOptions}
                placeholder="Select Mode"
                disabled={isViewMode || isLoadingDetails}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <Input
                label="Source TON"
                name="sourceTON"
                type="number"
                value={formData.sourceTON}
                onChange={handleChange}
                placeholder="1"
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="Source NPI"
                name="sourceNPI"
                type="number"
                value={formData.sourceNPI}
                onChange={handleChange}
                placeholder="1"
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="Dest TON"
                name="destTON"
                type="number"
                value={formData.destTON}
                onChange={handleChange}
                placeholder="1"
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="Dest NPI"
                name="destNPI"
                type="number"
                value={formData.destNPI}
                onChange={handleChange}
                placeholder="1"
                disabled={isViewMode || isLoadingDetails}
              />
            </div>
          </div>
        )}

        {/* Speed & Queueing */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Speed & Queueing
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Rate / TPS"
              name="rateTps"
              type="number"
              value={formData.rateTps}
              onChange={handleChange}
              placeholder="50"
              disabled={isViewMode}
            />
            <Input
              label="Send Queue Limit"
              name="sendQueueLimit"
              type="number"
              value={formData.sendQueueLimit}
              onChange={handleChange}
              placeholder="10"
              disabled={isViewMode}
            />
            <Input
              label="Delay Time (Sec)"
              name="delayTime"
              type="number"
              step="0.1"
              value={formData.delayTime}
              onChange={handleChange}
              placeholder="0.0"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Timeouts */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Timeouts
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Response Timeout (s)"
              name="responseTimeout"
              type="number"
              step="0.1"
              value={formData.responseTimeout}
              onChange={handleChange}
              placeholder="30.0"
              disabled={isViewMode}
            />
            <Input
              label="Enquire Link Interval (s)"
              name="enquireLinkInterval"
              type="number"
              step="0.1"
              value={formData.enquireLinkInterval}
              onChange={handleChange}
              placeholder="30.0"
              disabled={isViewMode}
            />
            <Input
              label="Connection Timeout (s)"
              name="connectionTimeout"
              type="number"
              step="0.1"
              value={formData.connectionTimeout}
              onChange={handleChange}
              placeholder="10.0"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Retries & Recovery */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Retries & Recovery
          </legend>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="Conn Retry Delay (s)"
              name="connectionRetryDelay"
              type="number"
              step="0.1"
              value={formData.connectionRetryDelay}
              onChange={handleChange}
              placeholder="5.0"
              disabled={isViewMode}
            />
            <Input
              label="Conn Retry Count"
              name="connectionRetryCount"
              type="number"
              value={formData.connectionRetryCount}
              onChange={handleChange}
              placeholder="3"
              disabled={isViewMode}
            />
            <Input
              label="Conn Recovery Delay (s)"
              name="connectionRecoveryDelay"
              type="number"
              step="0.1"
              value={formData.connectionRecoveryDelay}
              onChange={handleChange}
              placeholder="60.0"
              disabled={isViewMode}
            />
            <Input
              label="Bind Retry Delay (s)"
              name="bindRetryDelay"
              type="number"
              step="0.1"
              value={formData.bindRetryDelay}
              onChange={handleChange}
              placeholder="5.0"
              disabled={isViewMode}
            />
            <Input
              label="Bind Retry Count"
              name="bindRetryCount"
              type="number"
              value={formData.bindRetryCount}
              onChange={handleChange}
              placeholder="3"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* TLVs */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <legend className="text-sm font-semibold text-primary px-2">
            TLVs Configuration
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="TLV Tag"
              name="tlvTag"
              value={formData.tlvTag}
              onChange={handleChange}
              placeholder="e.g. 0x1401"
              disabled={isViewMode}
            />
            <Input
              label="TLV Value"
              name="tlvValue"
              value={formData.tlvValue}
              onChange={handleChange}
              placeholder="Enter TLV Value"
              disabled={isViewMode}
            />
          </div>
        </fieldset>
        {editingVendor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Input
              label="Live Bind Status"
              name="bindStatus"
              value={formData.bindStatus}
              disabled={true}
              className={
                formData.bindStatus === "ONLINE"
                  ? "text-green-600 font-bold"
                  : "text-gray-500"
              }
            />
            <Input
              label="Active Sessions"
              name="session"
              value={`${formData.active_session_count}/${formData.max_allowed_sessions}`}
              disabled={true}
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isLoadingDetails}
            >
              {isSubmitting ? "Saving..." : "Save Vendor"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default VendorModal;
