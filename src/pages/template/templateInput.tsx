import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '../../quillDark.css';
import { toast } from "react-toastify";
import { createTemplate } from '../../api/campaignApi/campaignApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

function TemplateEditor() {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await createTemplate({ name: name, content: content });

      if (response) {
        toast.success('Template saved');
        setName('');
        setContent('');
      } else {
        toast.error('Error saving template');
      }
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast.error(error.response?.data?.detail || "Error saving template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="max-w-xl mx-auto p-6 rounded-xl bg-white dark:bg-gray-800 shadow-card">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Create New Template
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Template Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Template Name"
            required
          />

          <div>
            <label className="mb-1.5 text-xs font-medium text-text-secondary">
              Template Content
            </label>
            <div className="quill-container dark:quill-dark">
              <ReactQuill value={content} onChange={setContent} />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Template"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default TemplateEditor;