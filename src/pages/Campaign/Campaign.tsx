import React, { useState, useRef, useEffect } from "react";
import { Send, Upload, Clock, Phone, Zap } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import SegmentedControl, {
    type SegmentOption,
} from "../../components/ui/SegmentedControl";
import CustomDatePicker from "../../components/ui/DatePicker";
import { toast } from "react-toastify";
import {
    createCampaignApi,
    getTemplatesApi,
} from "../../api/campaignApi/campaignApi";
import ReactQuill from "react-quill-new";
import '../../quillDark.css';

export interface CampaignFormData {
    campaignName: string;
    objective: string;
    audienceType: "specify" | "import";
    contactNumber: string;
    template: string;
    content: string;
    scheduleType: "now" | "datetime";
}
interface SelectOption {
    label: string;
    value: string;
}
interface TemplateOption {
    label: string;
    value: string;
    content: string;
}

type AudienceType = "specify" | "import";
type ScheduleType = "now" | "datetime";

const CreateCampaignForm: React.FC = () => {
    const [formData, setFormData] = useState<CampaignFormData>({
        campaignName: "",
        objective: "Promotion",
        audienceType: "specify",
        contactNumber: "",
        template: "",
        content: "",
        scheduleType: "now",
    });

    const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
    const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);

    const objectiveOptions: SelectOption[] = [
        { label: "Promotion", value: "Promotion" },
        { label: "Announcement", value: "Announcement" },
        { label: "Re-engagement", value: "Re-engagement" },
    ];
    const audienceOptions: SegmentOption[] = [
        { label: "Specify Contact", value: "specify", icon: <Phone size={16} /> },
        { label: "Import CSV/Excel", value: "import", icon: <Upload size={16} /> },
    ];
    const scheduleOptions: SegmentOption[] = [
        { label: "Now", value: "now", icon: <Zap size={16} /> },
        { label: "Schedule Later", value: "datetime", icon: <Clock size={16} /> },
    ];

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const templates = await getTemplatesApi();
                const formattedOptions = templates
                    .filter(t => t.id)
                    .map((t) => ({
                        value: t.id!.toString(),
                        label: t.name,
                        content: t.content,
                    }));
                setTemplateOptions(formattedOptions);
                if (formattedOptions.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        // template: formattedOptions[0].value,
                        // content: formattedOptions[0].content,
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch templates:", error);
                toast.error("Could not load templates from server.");
            }
        };
        fetchTemplates();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (
        name: "objective" | "template",
        value: string
    ) => {
        if (name === "template") {
            const selectedTemplate = templateOptions.find((t) => t.value === value);
            setFormData((prev) => ({
                ...prev,
                template: value ? value : "",
                content: selectedTemplate ? selectedTemplate.content : "",
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleAudienceChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            audienceType: value as AudienceType,
            contactNumber: value === "import" ? "" : prev.contactNumber,
        }));
        if (value === "specify") setCsvFile(null);
    };

    const handleScheduleChange = (value: string) => {
        const newScheduleType = value as ScheduleType;
        setFormData((prev) => ({
            ...prev,
            scheduleType: newScheduleType,
        }));
        if (newScheduleType === "now") {
            setScheduleDate(null);
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            toast.error("No file selected.");
            return;
        }
        setCsvFile(file);
        toast.info(
            `File "${file.name}" selected. Click Send Campaign to submit.`
        );
        if (e.target) e.target.value = "";
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validation...
            if (!formData.campaignName || !formData.content) { throw new Error("Campaign Name and Content are required fields."); }
            if (!formData.template) { throw new Error("Template is required."); }
            if (formData.audienceType === "specify" && !formData.contactNumber) { throw new Error("Contact Number is required."); }
            if (formData.audienceType === "import" && !csvFile) { throw new Error("A file must be uploaded."); }
            if (formData.scheduleType === "datetime" && !scheduleDate) { throw new Error("A schedule date and time is required."); }

            const dataToUpload = new FormData();
            dataToUpload.append("name", formData.campaignName);
            dataToUpload.append("objective", formData.objective);
            dataToUpload.append("content", formData.content);
            dataToUpload.append("template", formData.template);

            let scheduleTimestamp: string;
            if (formData.scheduleType === "datetime" && scheduleDate) {
                scheduleTimestamp = scheduleDate.toISOString();
            } else {
                scheduleTimestamp = new Date().toISOString();
            }
            const formattedDateTime = scheduleTimestamp.substring(0, 19).replace('T', ' ');
            dataToUpload.append("schedule", formattedDateTime);

            if (formData.audienceType === "specify") {
                const contactsArray = formData.contactNumber.split(',').map(c => c.trim()).filter(Boolean);
                contactsArray.forEach(contact => {
                    dataToUpload.append('contacts', contact);
                });
            } else if (csvFile) {
                dataToUpload.append("csvFile", csvFile, csvFile.name);
            }

            const response = await createCampaignApi(dataToUpload);
            toast.success(`Campaign "${response.campaign.name}" created!`);

            // Reset form
            setFormData({
                campaignName: "",
                objective: "Promotion",
                audienceType: "specify",
                contactNumber: "",
                template: templateOptions[0]?.value || "",
                content: templateOptions[0]?.content || "",
                scheduleType: "now",
            });
            setCsvFile(null);
            setScheduleDate(null);
        } catch (error: any) {
            console.error("Error creating campaign:", error);
            const errorMsg =
                error.response?.data?.error ||
                error.response?.data?.[0] ||
                error.message ||
                "Submission Failed";
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 min-h-screen bg-secondary dark:bg-gray-900 font-sans">
            <div
                className={`max-w-xl mx-auto p-6 rounded-xl bg-white dark:bg-gray-800 shadow-card`}
            >
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                    Create New Campaign
                </h2>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Input
                        label="Campaign Name"
                        type="text"
                        name="campaignName"
                        value={formData.campaignName}
                        onChange={handleChange}
                        placeholder="e.g., Summer Promo SMS"
                        required
                    />

                    <Select
                        label="Objective"
                        value={formData.objective}
                        onChange={(value) => handleSelectChange("objective", value)}
                        options={objectiveOptions}
                        placeholder="Select an objective"
                    />

                    <div className="space-y-3">
                        <SegmentedControl
                            label="Audience"
                            selectedValue={formData.audienceType}
                            options={audienceOptions}
                            onChange={handleAudienceChange}
                        />

                        {formData.audienceType === "specify" ? (
                            <Input
                                label="Contact Number(s)"
                                type="text"
                                name="contactNumber"
                                value={formData.contactNumber}
                                onChange={handleChange}
                                placeholder="e.g., 98xxxxxxxx, 97xxxxxxxx"
                                required={formData.audienceType === "specify"}
                            />
                        ) : (
                            <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition flex justify-between items-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {csvFile
                                        ? `Selected: ${csvFile.name}`
                                        : "Import contacts via CSV/Excel."}
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleUploadButtonClick}
                                    leftIcon={<Upload size={18} />}
                                    disabled={uploadLoading}
                                >
                                    {csvFile ? "Change File" : "Upload File"}
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelected}
                                    className="hidden"
                                    accept=".csv, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                />
                            </div>
                        )}
                    </div>

                    <Select
                        label="Template"
                        value={formData.template}
                        onChange={(value) => handleSelectChange("template", value)}
                        placeholder="Select Template"
                        options={templateOptions}
                    />

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary mb-1">
                            Template Content
                        </label>
                        <div className="quill-container dark:quill-dark">
                            <ReactQuill
                                value={formData.content}
                                onChange={(value) =>
                                    setFormData((prev) => ({ ...prev, content: value }))
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <SegmentedControl
                            label="Schedule"
                            selectedValue={formData.scheduleType}
                            options={scheduleOptions}
                            onChange={handleScheduleChange}
                        />

                        {formData.scheduleType === "datetime" && (
                            <CustomDatePicker
                                label="Date Time Selection"
                                selected={scheduleDate}
                                onChange={(date) => setScheduleDate(date)}
                                showTimeSelect={true}
                            />
                        )}
                    </div>


                    <div className="pt-3">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full text-lg py-3"
                            leftIcon={<Send size={20} />}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Sending..." : "Send Campaign"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCampaignForm;