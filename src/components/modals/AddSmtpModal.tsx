import React, { useState } from "react";
import { toast } from "react-toastify";
// 1. FIX: Use 'type' to import the SmtpServerData interface
import { createSmtpServerApi, type SmtpServerData } from "../../api/smtpApi/smtpApi";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { X } from "lucide-react";

interface AddSmtpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onServerAdded: () => void;
}

const securityOptions = [
    { value: "SSL", label: "SSL" },
    { value: "TLS", label: "TLS" },
    { value: "None", label: "None" },
];

export const AddSmtpModal: React.FC<AddSmtpModalProps> = ({
    isOpen,
    onClose,
    onServerAdded,
}) => {
    const [formData, setFormData] = useState<SmtpServerData>({
        server_name: "",
        email: "",
        smtp_server: "",
        security: "SSL",
        server_port: 465,
        user_name: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "server_port" ? parseInt(value) || 0 : value,
        }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            security: value as SmtpServerData['security'],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createSmtpServerApi(formData);
            toast.success("SMTP Server added successfully!");
            onServerAdded();
            onClose();
        } catch (error: any) {
            console.error("Failed to create SMTP server:", error);
            toast.error(error.response?.data?.detail || "Failed to add server.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg p-6 bg-white rounded-xl shadow-card dark:bg-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Add New SMTP Server
                    </h2>
                    {/* 2. FIX: Removed 'size="icon"' and added padding classes */}
                    <Button variant="ghost" onClick={onClose} className="p-2">
                        <X size={20} />
                    </Button>
                </div>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    {/* ... (form inputs are unchanged) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            label="Server Name"
                            name="server_name"
                            value={formData.server_name}
                            onChange={handleChange}
                            placeholder="e.g., My Gmail Server"
                            required
                        />
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your-email@gmail.com"
                            required
                        />
                    </div>

                    <Input
                        label="SMTP Server"
                        name="smtp_server"
                        value={formData.smtp_server}
                        onChange={handleChange}
                        placeholder="smtp.gmail.com"
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Select
                            label="Security"
                            value={formData.security}
                            onChange={handleSelectChange}
                            options={securityOptions}
                        />
                        <Input
                            label="Server Port"
                            name="server_port"
                            type="number"
                            value={formData.server_port}
                            onChange={handleChange}
                            placeholder="465"
                            required
                        />
                    </div>

                    <Input
                        label="User Name"
                        name="user_name"
                        value={formData.user_name}
                        onChange={handleChange}
                        placeholder="your-email@gmail.com"
                        required
                    />

                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Server"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};