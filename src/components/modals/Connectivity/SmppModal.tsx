import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createSmppApi,
  updateSmppApi,
  type SmppData,
} from "../../../api/connectivityApi/smppApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";
import { Eye, EyeOff } from "lucide-react";

interface SmppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingSmpp: SmppData | null;
  isViewMode?: boolean;
}

export const SmppModal: React.FC<SmppModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingSmpp,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    smppHost: "",
    smppPort: "",
    systemID: "",
    password: "",
    bindMode: "TRANSMITTER",
    sourceTON: "",
    sourceNPI: "",
    destTON: "",
    destNPI: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const bindModeOptions = [
    { label: "Transmitter", value: "TRANSMITTER" },
    { label: "Receiver", value: "RECEIVER" },
    { label: "Transceiver", value: "TRANSCEIVER" },
  ];

  useEffect(() => {
    if (isOpen) {
      if (editingSmpp) {
        setFormData({
          smppHost: editingSmpp.smppHost,
          smppPort: String(editingSmpp.smppPort),
          systemID: editingSmpp.systemID,
          password: editingSmpp.password || "",
          bindMode: editingSmpp.bindMode,
          sourceTON: String(editingSmpp.sourceTON),
          sourceNPI: String(editingSmpp.sourceNPI),
          destTON: String(editingSmpp.destTON),
          destNPI: String(editingSmpp.destNPI),
        });
      } else {
        setFormData({
          smppHost: "",
          smppPort: "",
          systemID: "",
          password: "",
          bindMode: "TRANSMITTER",
          sourceTON: "",
          sourceNPI: "",
          destTON: "",
          destNPI: "",
        });
      }
    }
  }, [isOpen, editingSmpp]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.smppHost || !formData.systemID) {
      toast.error("Host and System ID are required.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      smppPort: Number(formData.smppPort),
      sourceTON: Number(formData.sourceTON),
      sourceNPI: Number(formData.sourceNPI),
      destTON: Number(formData.destTON),
      destNPI: Number(formData.destNPI),
    };

    try {
      if (editingSmpp) {
        await updateSmppApi(editingSmpp.id!, payload, moduleName);
        toast.success("Connectivity updated!");
      } else {
        await createSmppApi(payload, moduleName);
        toast.success("Connectivity created!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to save config.");
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
          ? "View Connectivity"
          : editingSmpp
          ? "Edit Connectivity"
          : "Add Connectivity"
      }
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="SMPP Host"
            name="smppHost"
            value={formData.smppHost}
            onChange={handleChange}
            placeholder="smpp.host.com"
            required
            disabled={isViewMode}
          />
          <Input
            label="SMPP Port"
            name="smppPort"
            type="number"
            value={formData.smppPort}
            onChange={handleChange}
            placeholder="2775"
            required
            disabled={isViewMode}
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
            disabled={isViewMode}
          />
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Secret"
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
          <Select
            label="Bind Mode"
            value={formData.bindMode}
            onChange={(v) => handleSelect("bindMode", v)}
            options={bindModeOptions}
            placeholder="Select Mode"
            disabled={isViewMode}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4 dark:border-gray-700">
          <Input
            label="Source TON"
            name="sourceTON"
            type="number"
            value={formData.sourceTON}
            onChange={handleChange}
            placeholder="1"
            disabled={isViewMode}
          />
          <Input
            label="Source NPI"
            name="sourceNPI"
            type="number"
            value={formData.sourceNPI}
            onChange={handleChange}
            placeholder="1"
            disabled={isViewMode}
          />
          <Input
            label="Dest TON"
            name="destTON"
            type="number"
            value={formData.destTON}
            onChange={handleChange}
            placeholder="1"
            disabled={isViewMode}
          />
          <Input
            label="Dest NPI"
            name="destNPI"
            type="number"
            value={formData.destNPI}
            onChange={handleChange}
            placeholder="1"
            disabled={isViewMode}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
