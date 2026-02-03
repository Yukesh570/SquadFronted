import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import TextArea from "../../ui/TextArea";
import {
  createMessageLogApi,
  updateMessageLogApi,
  type MessageLogData,
} from "../../../api/reportApi/messageReportApi";

interface MessageReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingMessage: MessageLogData | null;
  isViewMode?: boolean;
}

const statusOptions = [
  { label: "Queued", value: "queued" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
  { label: "Delivered", value: "delivered" },
];

const MessageReportModal: React.FC<MessageReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingMessage,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    destination: "",
    text: "",
    status: "queued",
    systemId: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && editingMessage) {
      setFormData({
        destination: editingMessage.destination || "",
        text: editingMessage.text || "",
        status: editingMessage.status || "queued",
        systemId: editingMessage.systemId || "",
      });
    } else if (isOpen) {
      setFormData({
        destination: "",
        text: "",
        status: "queued",
        systemId: "",
      });
    }
  }, [isOpen, editingMessage]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    setIsSubmitting(true);

    try {
      if (editingMessage?.id) {
        await updateMessageLogApi(editingMessage.id, formData, moduleName);
        toast.success("Message updated successfully!");
      } else {
        await createMessageLogApi(formData, moduleName);
        toast.success("Message created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save message.");
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
          ? "View Message"
          : editingMessage
            ? "Edit Message"
            : "Add New Message"
      }
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="e.g. 9841234567"
            required
            disabled={isViewMode}
          />
          <Input
            label="System ID"
            name="systemId"
            value={formData.systemId}
            onChange={handleChange}
            placeholder="e.g. 1001"
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
        </div>

        <TextArea
          label="Message Text"
          name="text"
          value={formData.text}
          onChange={handleChange}
          placeholder="Enter message content..."
          required
          disabled={isViewMode}
          rows={4}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingMessage
                  ? "Update"
                  : "Create"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default MessageReportModal;
