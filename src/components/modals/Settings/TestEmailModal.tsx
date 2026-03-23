import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { sendTestEmailApi, type SmtpServerData } from "../../../api/settingApi/smtpApi/smtpApi";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Modal from "../../ui/Modal";

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: SmtpServerData | null;
}

export const TestEmailModal: React.FC<TestEmailModalProps> = ({
  isOpen,
  onClose,
  server,
}) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const staticSubject = "Test Email Configuration - Squad";
  const staticContent = "This is an automated test email sent from the Squad system to verify your SMTP Host configuration is working correctly.";

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(""); // Reset input when modal opens
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!server || !server.id) return;

    setIsSubmitting(true);
    try {
      // Build exactly what Postman sends (form-data with snake_case keys)
      const formData = new FormData();
      formData.append("email_host_id", String(server.id));
      formData.append("from_email", server.smtpUser);
      formData.append("recipient_list", recipientEmail);
      formData.append("subject", staticSubject);
      formData.append("content", staticContent);

      await sendTestEmailApi(formData);
      toast.success("Test email requested successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send test email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !server) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Test Email">
      <form className="space-y-5" onSubmit={handleSubmit}>
        
        {/* Read-only Data pulled from selected SMTP Server */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Email Host" value={server.name} disabled />
          <Input label="From Email" value={server.smtpUser} disabled />
        </div>
        
        {/* Read-only Static Content */}
        <Input label="Subject" value={staticSubject} disabled />
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-text-primary dark:text-gray-300">Content</label>
          <textarea 
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 focus:outline-none cursor-not-allowed" 
            rows={3} 
            value={staticContent} 
            disabled 
          />
        </div>
        
        {/* User Input field */}
        <Input 
          label="Recipient Email ID" 
          type="email" 
          value={recipientEmail} 
          onChange={(e) => setRecipientEmail(e.target.value)} 
          placeholder="e.g. recipient@example.com" 
          required 
        />

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};