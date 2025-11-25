import React, { useState, useRef, useEffect } from "react";
import { Send, Upload, Clock, Phone, Zap, FileSpreadsheet } from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import SegmentedControl from "../ui/SegmentedControl";
import CustomDatePicker from "../ui/DatePicker";
import Modal from "../ui/Modal";
import { toast } from "react-toastify";
import {
  createCampaignApi,
  updateCampaignApi,
  getTemplatesApi,
  type CampaignFormData,
} from "../../api/campaignApi/campaignApi";
// @ts-ignore
import ReactQuill from "react-quill-new";
import "../../quillDark.css";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingCampaign: CampaignFormData | null;
  isViewMode?: boolean;
}

const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingCampaign,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    campaignName: "",
    objective: "Promotion",
    audienceType: "specify",
    contactNumber: "",
    template: "",
    scheduleType: "now",
  });

  const [quillContent, setQuillContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [templateOptions, setTemplateOptions] = useState<
    { label: string; value: string; content: string }[]
  >([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const objectiveOptions = [
    { label: "Promotion", value: "Promotion" },
    { label: "Announcement", value: "Announcement" },
    { label: "Re-engagement", value: "Re-engagement" },
  ];

  const audienceOptions = [
    { label: "Specify Contact", value: "specify", icon: <Phone size={16} /> },
    { label: "Import CSV/Excel", value: "import", icon: <Upload size={16} /> },
  ];

  const scheduleOptions = [
    { label: "Now", value: "now", icon: <Zap size={16} /> },
    { label: "Schedule Later", value: "datetime", icon: <Clock size={16} /> },
  ];

  useEffect(() => {
    if (isOpen) {
      if (!editingCampaign) {
        getTemplatesApi(1, 1000).then((response: any) => {
          let data = [];
          if (response && response.results) data = response.results;
          else if (Array.isArray(response)) data = response;

          setTemplateOptions(
            data.map((t: any) => ({
              label: t.name,
              value: t.id!.toString(),
              content: t.content,
            }))
          );
        });
      }

      if (editingCampaign) {
        setFormData({
          campaignName: editingCampaign.name,
          objective: editingCampaign.objective,
          audienceType: "specify",
          contactNumber: "",
          template: editingCampaign.template
            ? String(editingCampaign.template)
            : "",
          scheduleType: "now",
        });

        setQuillContent(editingCampaign.content || "");

        if (editingCampaign.schedule) {
          setScheduleDate(new Date(editingCampaign.schedule));
          setFormData((prev) => ({ ...prev, scheduleType: "datetime" }));
        }
      } else {
        setFormData({
          campaignName: "",
          objective: "Promotion",
          audienceType: "specify",
          contactNumber: "",
          template: "",
          scheduleType: "now",
        });
        setQuillContent("");
        setScheduleDate(null);
        setCsvFile(null);
      }
    }
  }, [isOpen, editingCampaign]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "template") {
      const selected = templateOptions.find((t) => t.value === value);
      setFormData({ ...formData, template: value });
      if (selected) {
        setQuillContent(selected.content);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      toast.info(`Selected: ${e.target.files[0].name}`);
    }
  };

  const downloadSample = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,PhoneNumber\n9800000000\n9811111111";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isContentEmpty = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body.textContent || "";
    return text.trim().length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.campaignName.trim()) {
      toast.error("Campaign name is required.");
      return;
    }
    if (isContentEmpty(quillContent)) {
      toast.error("Campaign content cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToUpload = new FormData();
      dataToUpload.append("name", formData.campaignName);
      dataToUpload.append("objective", formData.objective);
      dataToUpload.append("content", quillContent);

      if (formData.template) dataToUpload.append("template", formData.template);

      let scheduleTimestamp = new Date().toISOString();
      if (formData.scheduleType === "datetime" && scheduleDate) {
        scheduleTimestamp = scheduleDate.toISOString();
      }
      dataToUpload.append(
        "schedule",
        scheduleTimestamp.substring(0, 19).replace("T", " ")
      );

      if (!editingCampaign) {
        if (formData.audienceType === "specify") {
          const contacts = formData.contactNumber
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
          if (contacts.length === 0) {
            toast.error("Please specify at least one contact number.");
            setIsSubmitting(false);
            return;
          }
          contacts.forEach((c) => dataToUpload.append("contacts", c));
        } else if (csvFile) {
          dataToUpload.append("csvFile", csvFile);
        } else {
          toast.error("Please provide contacts (Specify or Upload).");
          setIsSubmitting(false);
          return;
        }
      }

      if (editingCampaign) {
        await updateCampaignApi(editingCampaign.id!, dataToUpload, moduleName);
        toast.success("Campaign updated successfully!");
      } else {
        await createCampaignApi(dataToUpload, moduleName);
        toast.success("Campaign created successfully!");
      }

      onSuccess();
      onClose();

      // Reset
      setFormData({
        campaignName: "",
        objective: "Promotion",
        audienceType: "specify",
        contactNumber: "",
        template: "",
        scheduleType: "now",
      });
      setQuillContent("");
      setScheduleDate(null);
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error(error);
      const serverError = error.response?.data;
      if (serverError && typeof serverError === "object") {
        Object.entries(serverError).forEach(([key, msgs]) => {
          toast.error(`${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
        });
      } else {
        toast.error("Failed to save campaign.");
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
          ? "View Campaign"
          : editingCampaign
          ? "Edit Campaign"
          : "Create New Campaign"
      }
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Campaign Name"
            name="campaignName"
            placeholder="Enter campaign name"
            value={formData.campaignName}
            onChange={handleChange}
            required
            disabled={isViewMode}
          />
          <Select
            label="Objective"
            value={formData.objective}
            onChange={(v) => handleSelectChange("objective", v)}
            options={objectiveOptions}
            // disabled={isViewMode} // Select needs wrapper for disabled style if not supported
          />
        </div>

        {!editingCampaign && (
          <div className="space-y-3">
            <SegmentedControl
              label="Audience"
              selectedValue={formData.audienceType}
              options={audienceOptions}
              onChange={(v) =>
                setFormData({ ...formData, audienceType: v as any })
              }
            />

            {formData.audienceType === "specify" ? (
              <Input
                label="Contact Number(s)"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="e.g., 98xxxxxxxx, 98xxxxxxxx"
              />
            ) : (
              <div className="flex items-center gap-3 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload size={16} />}
                >
                  {csvFile ? "Change File" : "Upload CSV/Excel"}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                />

                <div className="flex-1 text-sm text-gray-500 truncate">
                  {csvFile ? csvFile.name : "No file selected"}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={downloadSample}
                  title="Download Sample"
                  className="text-primary"
                >
                  <FileSpreadsheet size={18} />
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          {!editingCampaign && (
            <Select
              label="Template"
              value={formData.template}
              onChange={(v) => handleSelectChange("template", v)}
              options={[...templateOptions]}
              placeholder="Select Template"
            />
          )}

          <div className="quill-container dark:quill-dark mt-2">
            <label className="mb-1.5 text-xs font-medium text-text-secondary block">
              Content <span className="text-red-500">*</span>
            </label>
            <ReactQuill
              key={editingCampaign ? editingCampaign.id : "new"}
              theme="snow"
              value={quillContent}
              onChange={setQuillContent}
              readOnly={isViewMode}
            />
          </div>
        </div>

        <div className="space-y-3">
          <SegmentedControl
            label="Schedule"
            selectedValue={formData.scheduleType}
            options={scheduleOptions}
            onChange={(v) =>
              setFormData({ ...formData, scheduleType: v as any })
            }
          />
          {formData.scheduleType === "datetime" && (
            <CustomDatePicker
              label="Select Date & Time"
              selected={scheduleDate}
              onChange={(date: Date | null) => setScheduleDate(date)}
              showTimeSelect
            />
          )}
        </div>

        <div className="flex justify-end pt-2 gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              leftIcon={<Send size={18} />}
            >
              {isSubmitting
                ? "Saving..."
                : editingCampaign
                ? "Update Campaign"
                : "Create Campaign"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default CampaignModal;
