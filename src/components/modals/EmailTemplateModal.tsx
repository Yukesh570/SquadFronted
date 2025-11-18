import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '../../quillDark.css'; 
import { toast } from "react-toastify";
import { 
  createEmailTemplateApi, 
  updateEmailTemplateApi, 
  type EmailTemplateData 
} from '../../api/emailTemplateApi/emailTemplateApi';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingTemplate: EmailTemplateData | null;
}

export const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingTemplate,
}) => {
  const [name, setName] = useState("");
  const [quillContent, setQuillContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingTemplate) {
        setName(editingTemplate.name);
        setQuillContent(editingTemplate.content);
      } else {
        setName("");
        setQuillContent("");
      }
    }
  }, [isOpen, editingTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const dataToSend = {
      name,
      content: quillContent,
      is_active: true,
    };

    try {
      if (editingTemplate) {
        await updateEmailTemplateApi(editingTemplate.id!, dataToSend, moduleName);
        toast.success(`Template updated successfully!`);
      } else {
        await createEmailTemplateApi(dataToSend, moduleName);
        toast.success('Template saved successfully!');
      }
      
      onSuccess();
      onClose();
      
      // Reset form
      setName("");
      setQuillContent("");

    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error(error.response?.data?.detail || "Error saving template");
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Welcome Email"
            required
          />
          <div>
            <label className="mb-1.5 text-xs font-medium text-text-secondary">
              Content
            </label>
            <div className="quill-container dark:quill-dark">
              <ReactQuill value={quillContent} onChange={setQuillContent} />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingTemplate ? "Save Changes" : "Save Template")}
            </Button>
          </div>
        </form>
    </Modal>
  );
};