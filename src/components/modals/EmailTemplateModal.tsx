import React, { useState, useEffect } from "react";
// @ts-ignore
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../../quillDark.css";
import { toast } from "react-toastify";
import {
  createEmailTemplateApi,
  updateEmailTemplateApi,
  type EmailTemplateData,
} from "../../api/emailTemplateApi/emailTemplateApi";
import { getSmtpServersApi } from "../../api/settingApi/smtpApi/smtpApi";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal";

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: EmailTemplateData) => void;
  moduleName: string;
  editingTemplate: EmailTemplateData | null;
  isViewMode?: boolean;
}

type FormData = Omit<EmailTemplateData, "id">;

export const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingTemplate,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState<FormData>({ name: "", subject: "", content: "", emailServer: null });
  const [quillContent, setQuillContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  const [smtpOptions, setSmtpOptions] = useState<{label: string, value: string}[]>([]);

  // Fetch SMTP servers for dropdown
  useEffect(() => {
    const loadSmtpServers = async () => {
      try {
        // FIX: Pass 'moduleName' dynamically instead of hardcoding "emailHost". 
        // This matches CompanyModal and proves to the backend you are on a permitted page.
        const res = await getSmtpServersApi(moduleName, 1, 100);
        const list = res.results || (Array.isArray(res) ? res : []);
        setSmtpOptions(list.map((item: any) => ({ label: item.name, value: String(item.id) })));
      } catch (error) {
        console.error("Failed to load SMTP servers", error);
      }
    };
    if (isOpen) {
      loadSmtpServers();
    }
  }, [isOpen, moduleName]);

  useEffect(() => {
    if (isOpen) {
      setIsDataReady(false);

      if (editingTemplate) {
        setFormData({
          name: editingTemplate.name,
          subject: editingTemplate.subject || "",
          content: editingTemplate.content,
          emailServer: editingTemplate.emailServer || null,
        });
        setQuillContent(editingTemplate.content);
        setIsDataReady(true);
      } else {
        setFormData({ name: "", subject: "", content: "", emailServer: null });
        setQuillContent("");
        setIsDataReady(true);
      }
    } else {
      setIsDataReady(false);
    }
  }, [isOpen, editingTemplate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, emailServer: value ? Number(value) : null }));
  };

  const isContentEmpty = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body.textContent || "";
    return text.trim().length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name.trim()) {
      toast.error("Template Name is required.");
      return;
    }
    if (!formData.subject.trim()) {
      toast.error("Template Subject is required.");
      return;
    }
    if (isContentEmpty(quillContent)) {
      toast.error("Content cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    const dataToSend = {
      ...formData,
      content: quillContent,
      is_active: true,
    };

    try {
      let response: EmailTemplateData;
      if (editingTemplate) {
        response = await updateEmailTemplateApi(
          editingTemplate.id!,
          dataToSend,
          moduleName
        );
        toast.success(`Template updated successfully!`);
      } else {
        response = await createEmailTemplateApi(dataToSend, moduleName);
        toast.success("Template saved successfully!");
      }
      onSuccess(response);
      onClose();
    } catch (error: any) {
      console.error("Error saving template:", error);
      const serverError = error.response?.data;
      if (serverError) {
        if (typeof serverError === "object") {
          Object.entries(serverError).forEach(([key, msgs]) => {
            toast.error(`${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
          });
        } else {
          toast.error(String(serverError));
        }
      } else {
        toast.error("Failed to save template.");
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
          ? "View Email Template"
          : editingTemplate
          ? "Edit Email Template"
          : "Create New Template"
      }
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Template Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Welcome Email"
            required
            disabled={isViewMode}
          />
          <Select
            label="Email Server (Optional)"
            value={formData.emailServer ? String(formData.emailServer) : ""}
            onChange={handleSelectChange}
            options={smtpOptions}
            placeholder="Select an Email Server"
            disabled={isViewMode}
          />
        </div>
        
        <Input
          label="Subject"
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Enter Email Subject"
          required
          disabled={isViewMode}
        />

        <div>
          <label className="mb-1.5 text-xs font-medium text-text-secondary">
            Content <span className="text-red-500">*</span>
          </label>
          <div className="quill-container dark:quill-dark">
            {isDataReady ? (
              <ReactQuill
                theme="snow"
                value={quillContent}
                onChange={setQuillContent}
                readOnly={isViewMode}
              />
            ) : (
              <div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-400">
                Loading editor...
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingTemplate
                ? "Save Changes"
                : "Save Template"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};