import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createClientPolicyApi,
  updateClientPolicyApi,
  type ClientPolicyData,
} from "../../../api/policyApi/clientPolicyApi";
import { getClientsApi } from "../../../api/clientApi/clientApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";

interface ClientPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingPolicy: ClientPolicyData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const ClientPolicyModal: React.FC<ClientPolicyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingPolicy,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    client: "",
    maxTps: "",
    maxQueueDepth: "",
    maxWindowPerSession: "",
    maxWindowGlobal: "",
    maxSessions: "",
    idleTimeoutSec: "",
    submitTimeoutSec: "",
    senderIdPolicy: "",
  });

  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getClientsApi("client", 1, 1000)
        .then((res: any) => {
          let list = [];
          if (res && res.results) list = res.results;
          else if (Array.isArray(res)) list = res;

          setClientOptions(
            list.map((c: any) => ({ label: c.name, value: String(c.id) })),
          );
        })
        .catch((err: any) => console.error("Failed to load clients", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingPolicy) {
      setFormData({
        client: String(editingPolicy.client || ""),
        maxTps:
          editingPolicy.maxTps != null ? String(editingPolicy.maxTps) : "",
        maxQueueDepth:
          editingPolicy.maxQueueDepth != null
            ? String(editingPolicy.maxQueueDepth)
            : "",
        maxWindowPerSession:
          editingPolicy.maxWindowPerSession != null
            ? String(editingPolicy.maxWindowPerSession)
            : "",
        maxWindowGlobal:
          editingPolicy.maxWindowGlobal != null
            ? String(editingPolicy.maxWindowGlobal)
            : "",
        maxSessions:
          editingPolicy.maxSessions != null
            ? String(editingPolicy.maxSessions)
            : "",
        idleTimeoutSec:
          editingPolicy.idleTimeoutSec != null
            ? String(editingPolicy.idleTimeoutSec)
            : "",
        submitTimeoutSec:
          editingPolicy.submitTimeoutSec != null
            ? String(editingPolicy.submitTimeoutSec)
            : "",
        senderIdPolicy: editingPolicy.senderIdPolicy || "",
      });
    } else if (isOpen) {
      setFormData({
        client: "",
        maxTps: "",
        maxQueueDepth: "",
        maxWindowPerSession: "",
        maxWindowGlobal: "",
        maxSessions: "",
        idleTimeoutSec: "",
        submitTimeoutSec: "",
        senderIdPolicy: "",
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

    if (!formData.client) {
      toast.error("Client is required.");
      return;
    }

    setIsSubmitting(true);

    const payload: any = {
      client: Number(formData.client),
    };

    if (formData.maxTps) payload.maxTps = Number(formData.maxTps);
    if (formData.maxQueueDepth)
      payload.maxQueueDepth = Number(formData.maxQueueDepth);
    if (formData.maxWindowPerSession)
      payload.maxWindowPerSession = Number(formData.maxWindowPerSession);
    if (formData.maxWindowGlobal)
      payload.maxWindowGlobal = Number(formData.maxWindowGlobal);
    if (formData.maxSessions)
      payload.maxSessions = Number(formData.maxSessions);
    if (formData.idleTimeoutSec)
      payload.idleTimeoutSec = Number(formData.idleTimeoutSec);
    if (formData.submitTimeoutSec)
      payload.submitTimeoutSec = Number(formData.submitTimeoutSec);
    if (formData.senderIdPolicy)
      payload.senderIdPolicy = formData.senderIdPolicy;

    try {
      if (editingPolicy) {
        await updateClientPolicyApi(editingPolicy.id!, payload);
        toast.success("Client policy updated successfully!");
      } else {
        await createClientPolicyApi(payload);
        toast.success("Client policy created successfully!");
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
          ? "View Client Policy"
          : editingPolicy
            ? "Edit Client Policy"
            : "Add Client Policy"
      }
      className="max-w-3xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-[80vh] overflow-y-auto px-1"
      >
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            General Settings
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Client Name"
              value={formData.client}
              onChange={(v) => handleSelect("client", v)}
              options={clientOptions}
              placeholder="Select Client"
              disabled={isViewMode || !!editingPolicy} // Client usually locked on edit
            />
            <Input
              label="Sender ID Policy"
              name="senderIdPolicy"
              value={formData.senderIdPolicy}
              onChange={handleChange}
              placeholder="DEFAULT"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Throughput & Limits
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Max TPS"
              name="maxTps"
              type="number"
              value={formData.maxTps}
              onChange={handleChange}
              placeholder="50"
              disabled={isViewMode}
            />
            <Input
              label="Max Sessions"
              name="maxSessions"
              type="number"
              value={formData.maxSessions}
              onChange={handleChange}
              placeholder="10"
              disabled={isViewMode}
            />
            <Input
              label="Max Queue Depth"
              name="maxQueueDepth"
              type="number"
              value={formData.maxQueueDepth}
              onChange={handleChange}
              placeholder="10000"
              disabled={isViewMode}
            />
            <Input
              label="Max Window (Global)"
              name="maxWindowGlobal"
              type="number"
              value={formData.maxWindowGlobal}
              onChange={handleChange}
              placeholder="50"
              disabled={isViewMode}
            />
            <Input
              label="Max Window (Per Session)"
              name="maxWindowPerSession"
              type="number"
              value={formData.maxWindowPerSession}
              onChange={handleChange}
              placeholder="10"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Timeouts
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Idle Timeout (Seconds)"
              name="idleTimeoutSec"
              type="number"
              value={formData.idleTimeoutSec}
              onChange={handleChange}
              placeholder="60"
              disabled={isViewMode}
            />
            <Input
              label="Submit Timeout (Seconds)"
              name="submitTimeoutSec"
              type="number"
              value={formData.submitTimeoutSec}
              onChange={handleChange}
              placeholder="60"
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
