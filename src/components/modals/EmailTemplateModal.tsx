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
import Input from "../ui/Input";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: EmailTemplateData) => void;
  moduleName: string;
  editingTemplate: EmailTemplateData | null;
}

type FormData = Omit<EmailTemplateData, "id" | "is_active" | "content">;

export const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingTemplate,
}) => {
  const [formData, setFormData] = useState<FormData>({ name: "" });
  const [quillContent, setQuillContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTemplate && isOpen) {
      setFormData({ name: editingTemplate.name });
      setQuillContent(editingTemplate.content);
    } else {
      setFormData({ name: "" });
      setQuillContent("");
    }
  }, [editingTemplate, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isContentEmpty = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body.textContent || "";
    return text.trim().length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Template Name is required.");
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
        toast.error("An unexpected error occurred.");
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
      title={editingTemplate ? "Edit Email Template" : "Create New Template"}
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Template Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Welcome Email"
          required
        />
        <div>
          <label className="mb-1.5 text-xs font-medium text-text-secondary">
            Content <span className="text-red-500">*</span>
          </label>
          <div className="quill-container dark:quill-dark">
            <ReactQuill
              theme="snow"
              value={quillContent}
              onChange={setQuillContent}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : editingTemplate
              ? "Save Changes"
              : "Save Template"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
