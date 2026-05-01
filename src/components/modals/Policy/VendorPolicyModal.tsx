import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createVendorPolicyApi,
  updateVendorPolicyApi,
  type VendorPolicyData,
} from "../../../api/policyApi/vendorPolicyApi";
// @ts-ignore
import { getVendorsApi } from "../../../api/connectivityApi/vendorApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";

interface VendorPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingPolicy: VendorPolicyData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const VendorPolicyModal: React.FC<VendorPolicyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingPolicy,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    vendor: "",
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
  });

  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logLevelOptions = [
    { label: "DEBUG", value: "DEBUG" },
    { label: "INFO", value: "INFO" },
    { label: "WARNING", value: "WARNING" },
    { label: "ERROR", value: "ERROR" },
    { label: "CRITICAL", value: "CRITICAL" },
  ];

  useEffect(() => {
    if (isOpen) {
      getVendorsApi("vendor", 1, 1000)
        .then((res: any) => {
          let list = [];
          if (res && res.results) list = res.results;
          else if (Array.isArray(res)) list = res;

          setVendorOptions(
            list.map((v: any) => ({
              label: v.profileName || v.name || `Vendor ${v.id}`,
              value: String(v.id),
            })),
          );
        })
        .catch((err: any) => console.error("Failed to load vendors", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingPolicy) {
      setFormData({
        vendor: String(editingPolicy.vendor || ""),
        rateTps:
          editingPolicy.rateTps != null ? String(editingPolicy.rateTps) : "",
        sendQueueLimit:
          editingPolicy.sendQueueLimit != null
            ? String(editingPolicy.sendQueueLimit)
            : "",
        delayTime:
          editingPolicy.delayTime != null
            ? String(editingPolicy.delayTime)
            : "",
        responseTimeout:
          editingPolicy.responseTimeout != null
            ? String(editingPolicy.responseTimeout)
            : "",
        enquireLinkInterval:
          editingPolicy.enquireLinkInterval != null
            ? String(editingPolicy.enquireLinkInterval)
            : "",
        connectionTimeout:
          editingPolicy.connectionTimeout != null
            ? String(editingPolicy.connectionTimeout)
            : "",
        connectionRetryDelay:
          editingPolicy.connectionRetryDelay != null
            ? String(editingPolicy.connectionRetryDelay)
            : "",
        connectionRetryCount:
          editingPolicy.connectionRetryCount != null
            ? String(editingPolicy.connectionRetryCount)
            : "",
        bindRetryDelay:
          editingPolicy.bindRetryDelay != null
            ? String(editingPolicy.bindRetryDelay)
            : "",
        bindRetryCount:
          editingPolicy.bindRetryCount != null
            ? String(editingPolicy.bindRetryCount)
            : "",
        connectionRecoveryDelay:
          editingPolicy.connectionRecoveryDelay != null
            ? String(editingPolicy.connectionRecoveryDelay)
            : "",
        logLevel: editingPolicy.logLevel || "INFO",
        tlvTag: editingPolicy.tlvTag || "",
        tlvValue: editingPolicy.tlvValue || "",
      });
    } else if (isOpen) {
      setFormData({
        vendor: "",
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
      });
    }
  }, [isOpen, editingPolicy]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.vendor) {
      toast.error("Vendor is required.");
      return;
    }

    setIsSubmitting(true);

    const payload: any = {
      vendor: Number(formData.vendor),
      logLevel: formData.logLevel,
    };

    if (formData.rateTps !== "") payload.rateTps = Number(formData.rateTps);
    if (formData.sendQueueLimit !== "")
      payload.sendQueueLimit = Number(formData.sendQueueLimit);
    if (formData.delayTime !== "")
      payload.delayTime = Number(formData.delayTime);

    if (formData.responseTimeout !== "")
      payload.responseTimeout = Number(formData.responseTimeout);
    if (formData.enquireLinkInterval !== "")
      payload.enquireLinkInterval = Number(formData.enquireLinkInterval);
    if (formData.connectionTimeout !== "")
      payload.connectionTimeout = Number(formData.connectionTimeout);

    if (formData.connectionRetryDelay !== "")
      payload.connectionRetryDelay = Number(formData.connectionRetryDelay);
    if (formData.connectionRetryCount !== "")
      payload.connectionRetryCount = Number(formData.connectionRetryCount);
    if (formData.bindRetryDelay !== "")
      payload.bindRetryDelay = Number(formData.bindRetryDelay);
    if (formData.bindRetryCount !== "")
      payload.bindRetryCount = Number(formData.bindRetryCount);
    if (formData.connectionRecoveryDelay !== "")
      payload.connectionRecoveryDelay = Number(
        formData.connectionRecoveryDelay,
      );

    if (formData.tlvTag !== "") payload.tlvTag = formData.tlvTag;
    if (formData.tlvValue !== "") payload.tlvValue = formData.tlvValue;

    try {
      if (editingPolicy) {
        await updateVendorPolicyApi(editingPolicy.id!, payload);
        toast.success("Vendor policy updated successfully!");
      } else {
        await createVendorPolicyApi(payload);
        toast.success("Vendor policy created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save policy.");
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
          ? "View Vendor Policy"
          : editingPolicy
            ? "Edit Vendor Policy"
            : "Add Vendor Policy"
      }
      className="max-w-4xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-[80vh] overflow-y-auto px-1"
      >
        {/* General Settings */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            General Settings
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Vendor Profile"
              value={formData.vendor}
              onChange={(v) => handleSelect("vendor", v)}
              options={vendorOptions}
              placeholder="Select Vendor"
              disabled={isViewMode || !!editingPolicy}
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

        {/* Address & Routing */}

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
          </div>
        </fieldset>

        {/* TLVs */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
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

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingPolicy
                  ? "Update Policy"
                  : "Add Policy"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
