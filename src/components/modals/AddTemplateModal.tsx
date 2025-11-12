import React, { useState } from 'react';
// @ts-ignore
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '../../quillDark.css';
import { toast } from "react-toastify";
import { createTemplate } from '../../api/campaignApi/campaignApi';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { X } from 'lucide-react';

interface AddTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTemplateAdded: () => void; // Function to refresh the table
}

export const AddTemplateModal: React.FC<AddTemplateModalProps> = ({
    isOpen,
    onClose,
    onTemplateAdded,
}) => {
    const [content, setContent] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createTemplate({ name, content });
            toast.success('Template saved successfully!');
            setName('');
            setContent('');
            onTemplateAdded(); // Refresh the table
            onClose(); // Close the modal
        } catch (error: any) {
            console.error("Error creating template:", error);
            toast.error(error.response?.data?.detail || "Error saving template");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
            onClick={onClose}
        >
            {/* Modal Content */}
            <div
                className="relative w-full max-w-xl p-6 bg-white rounded-xl shadow-card dark:bg-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Add New Template
                    </h2>
                    <Button variant="ghost" onClick={onClose} className="p-2">
                        <X size={20} />
                    </Button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-5"
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

                    {/* Footer Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Template"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};