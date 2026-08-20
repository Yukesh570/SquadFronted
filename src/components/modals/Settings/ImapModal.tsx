import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createImapServerApi,
  updateImapServerApi,
  type ImapServerData,
} from "../../../api/settingApi/imapApi/imapApi";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import ToggleSwitch from "../../ui/ToggleSwitch";
import Modal from "../../ui/Modal";
import { Eye, EyeOff } from "lucide-react";

interface ImapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingServer: ImapServerData | null;
  isViewMode?: boolean;
}

const securityOptions = [
  { value: "TLS", label: "TLS" },
  { value: "SSL", label: "SSL" },
  { value: "NONE", label: "NONE" },
];

export const ImapModal: React.FC<ImapModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingServer,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState<Omit<ImapServerData, "id">>({
    name: "",
    imapHost: "",
    imapPort: 993,
    imapUser: "",
    imapPassword: "",
    security: "SSL",
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingServer) {
        setFormData({
          name: editingServer.name,
          imapHost: editingServer.imapHost,
          imapPort: editingServer.imapPort,
          imapUser: editingServer.imapUser,
          imapPassword: editingServer.imapPassword || "",
          security: editingServer.security,
          active: editingServer.active !== false,
        });
      } else {
        setFormData({
          name: "",
          imapHost: "",
          imapPort: 993,
          imapUser: "",
          imapPassword: "",
          security: "SSL",
          active: true,
        });
      }
    }
  }, [isOpen, editingServer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "imapPort"
            ? parseInt(value) || 0
            : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      security: value as ImapServerData["security"],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    setIsSubmitting(true);
    try {
      if (editingServer) {
        await updateImapServerApi(editingServer.id!, formData, moduleName);
        toast.success("IMAP Host updated successfully!");
      } else {
        await createImapServerApi(formData, moduleName);
        toast.success("IMAP Host added successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save IMAP Host:", error);
      toast.error(error.response?.data?.detail || "Failed to save host.");
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
          ? "View IMAP Host"
          : editingServer
            ? "Edit IMAP Host"
            : "Add New IMAP Host"
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="User Name (Email)"
            name="imapUser"
            value={formData.imapUser}
            onChange={handleChange}
            placeholder="username@gmail.com"
            required
            disabled={isViewMode}
            autoComplete="new-password"
          />
          <Input
            label="Server"
            name="imapHost"
            type="text"
            value={formData.imapHost}
            onChange={handleChange}
            placeholder="imap.gmail.com"
            required
            disabled={isViewMode}
          />
          <Select
            label="Security"
            value={formData.security}
            onChange={handleSelectChange}
            options={securityOptions}
            disabled={isViewMode}
          />
          <Input
            label="Server Port"
            name="imapPort"
            type="number"
            value={formData.imapPort}
            onChange={handleChange}
            placeholder="993"
            required
            disabled={isViewMode}
          />
        </div>
        <Input
          label="Display Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Work Email Fetcher"
          required
          disabled={isViewMode}
        />

        <Input
          label="Password"
          name="imapPassword"
          type={showPassword ? "text" : "password"}
          value={formData.imapPassword}
          onChange={handleChange}
          placeholder="••••••••"
          isClearable={false}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          required={!editingServer}
          disabled={isViewMode}
          autoComplete="new-password"
        />

        <div className={isViewMode ? "pointer-events-none opacity-50" : ""}>
          <ToggleSwitch
            label="Active"
            checked={formData.active || false}
            onChange={(v) => setFormData((prev) => ({ ...prev, active: v }))}
          />
        </div>

        {!isViewMode && (
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingServer ? "Save Changes" : "Save"}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
};
