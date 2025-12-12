import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createSmtpServerApi,
  updateSmtpServerApi,
  type SmtpServerData,
} from "../../../api/settingApi/smtpApi/smtpApi";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";
import { Eye, EyeOff } from "lucide-react";

interface SmtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingServer: SmtpServerData | null;
  isViewMode?: boolean;
}

const securityOptions = [
  { value: "TLS", label: "TLS" },
  { value: "SSL", label: "SSL" },
];

export const SmtpModal: React.FC<SmtpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingServer,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState<Omit<SmtpServerData, "id">>({
    name: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    security: "TLS",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingServer) {
        setFormData({
          name: editingServer.name,
          smtpHost: editingServer.smtpHost,
          smtpPort: editingServer.smtpPort,
          smtpUser: editingServer.smtpUser,
          smtpPassword: editingServer.smtpPassword,
          security: editingServer.security,
        });
      } else {
        setFormData({
          name: "",
          smtpHost: "",
          smtpPort: 587,
          smtpUser: "",
          smtpPassword: "",
          security: "TLS",
        });
      }
    }
  }, [isOpen, editingServer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "smtpPort" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      security: value as SmtpServerData["security"],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    setIsSubmitting(true);
    try {
      if (editingServer) {
        await updateSmtpServerApi(editingServer.id!, formData, moduleName);
        toast.success("Email Host updated successfully!");
      } else {
        await createSmtpServerApi(formData, moduleName);
        toast.success("Email Host added successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save Email Host:", error);
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
          ? "View Email Host"
          : editingServer
          ? "Edit Email Host"
          : "Add New Email Host"
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Email"
            name="smtpUser"
            value={formData.smtpUser}
            onChange={handleChange}
            placeholder="username@gmail.com"
            required
            disabled={isViewMode}
          />
          <Input
            label="Server"
            name="smtpHost"
            type="text"
            value={formData.smtpHost}
            onChange={handleChange}
            placeholder="smtp.gmail.com"
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
            name="smtpPort"
            type="number"
            value={formData.smtpPort}
            onChange={handleChange}
            placeholder="587"
            required
            disabled={isViewMode}
          />
        </div>
        <Input
          label="User Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Work Email"
          required
          disabled={isViewMode}
        />

        <Input
          label="Password"
          name="smtpPassword"
          type={showPassword ? "text" : "password"}
          value={formData.smtpPassword}
          onChange={handleChange}
          placeholder="••••••••"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          required
          disabled={isViewMode}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingServer
                ? "Save Changes"
                : "Save Host"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
