import React, { useState, useRef, useEffect } from "react";
import { Send, Upload, Clock, Phone, Zap, FileSpreadsheet } from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import SegmentedControl from "../ui/SegmentedControl";
import CustomDatePicker from "../ui/DatePicker";
import Modal from "../ui/Modal"; 
import { toast } from "react-toastify";
import { createCampaignApi, updateCampaignApi, getTemplatesApi, type CampaignFormData } from "../../api/campaignApi/campaignApi";
import ReactQuill from "react-quill-new";
import '../../quillDark.css';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingCampaign: CampaignFormData | null;
}

const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingCampaign,
}) => {
  const [formData, setFormData] = useState({
    campaignName: "",
    objective: "Promotion",
    audienceType: "specify",
    contactNumber: "",
    template: "",
    content: "",
    scheduleType: "now",
  });

  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [templateOptions, setTemplateOptions] = useState<{label: string, value: string, content: string}[]>([]);
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
      getTemplatesApi().then((data) => {
        setTemplateOptions(data.map(t => ({
          label: t.name,
          value: t.id!.toString(),
          content: t.content
        })));
      });

      if (editingCampaign) {
        setFormData({
          campaignName: editingCampaign.name,
          objective: editingCampaign.objective,
          audienceType: "specify",
          contactNumber: "",
          template: editingCampaign.template || "",
          content: editingCampaign.content || "",
          scheduleType: "now",
        });
        if (editingCampaign.schedule) {
            setScheduleDate(new Date(editingCampaign.schedule));
            setFormData(prev => ({...prev, scheduleType: "datetime"}));
        }
      } else {
        setFormData({
            campaignName: "",
            objective: "Promotion",
            audienceType: "specify",
            contactNumber: "",
            template: "",
            content: "",
            scheduleType: "now",
        });
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
      const selected = templateOptions.find(t => t.value === value);
      setFormData({
        ...formData,
        template: value,
        content: selected ? selected.content : "",
      });
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
    const csvContent = "data:text/csv;charset=utf-8,PhoneNumber\n9800000000\n9811111111";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
       const dataToUpload = new FormData();
       dataToUpload.append("name", formData.campaignName);
       dataToUpload.append("objective", formData.objective);
       dataToUpload.append("content", formData.content);
       if (formData.template) dataToUpload.append("template", formData.template);

       let scheduleTimestamp = new Date().toISOString();
       if (formData.scheduleType === 'datetime' && scheduleDate) {
         scheduleTimestamp = scheduleDate.toISOString();
       }
       dataToUpload.append('schedule', scheduleTimestamp.substring(0, 19).replace('T', ' '));

       if (formData.audienceType === 'specify') {
         const contacts = formData.contactNumber.split(',').map(c => c.trim()).filter(Boolean);
         contacts.forEach(c => dataToUpload.append('contacts', c));
       } else if (csvFile) {
         dataToUpload.append('csvFile', csvFile);
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

       setFormData({
          campaignName: "",
          objective: "Promotion",
          audienceType: "specify",
          contactNumber: "",
          template: "",
          content: "",
          scheduleType: "now",
       });
       setScheduleDate(null);
       setCsvFile(null);
       if (fileInputRef.current) {
          fileInputRef.current.value = "";
       }

    } catch (error: any) {
       toast.error(error.response?.data?.detail || "Failed to save campaign");
    } finally {
       setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCampaign ? "Edit Campaign" : "Create New Campaign"} className="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Campaign Name" name="campaignName" value={formData.campaignName} onChange={handleChange} required />
          <Select 
            label="Objective" 
            value={formData.objective} 
            onChange={(v) => handleSelectChange("objective", v)} 
            options={objectiveOptions} 
          />
        </div>

        <div className="space-y-3">
          <SegmentedControl 
             label="Audience" 
             selectedValue={formData.audienceType} 
             options={audienceOptions} 
             onChange={(v) => setFormData({...formData, audienceType: v as any})} 
          />
          
          {formData.audienceType === 'specify' ? (
            <Input 
              label="Contact Number(s)" 
              name="contactNumber" 
              value={formData.contactNumber} 
              onChange={handleChange} 
              placeholder="e.g., 98xxxxxxxx, 98xxxxxxxx"
            />
          ) : (
            <div className="flex items-center gap-3 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
               <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} leftIcon={<Upload size={16}/>}>
                 {csvFile ? "Change File" : "Upload CSV/Excel"}
               </Button>
               <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept=".csv,.xlsx,.xls"/>
               
               <div className="flex-1 text-sm text-gray-500 truncate">
                 {csvFile ? csvFile.name : "No file selected"}
               </div>

               <Button type="button" variant="ghost" onClick={downloadSample} title="Download Sample" className="text-primary">
                 <FileSpreadsheet size={18} />
               </Button>
            </div>
          )}
        </div>

        <div className="space-y-1">
           <Select 
             label="Template" 
             value={formData.template} 
             onChange={(v) => handleSelectChange("template", v)} 
             options={[{label: "None (Blank)", value: ""}, ...templateOptions]} 
             placeholder="Select Template" 
           />
           <div className="quill-container dark:quill-dark mt-2">
             <ReactQuill value={formData.content} onChange={(v) => setFormData({...formData, content: v})} />
           </div>
        </div>

        <div className="space-y-3">
           <SegmentedControl 
              label="Schedule" 
              selectedValue={formData.scheduleType} 
              options={scheduleOptions} 
              onChange={(v) => setFormData({...formData, scheduleType: v as any})} 
           />
           {formData.scheduleType === 'datetime' && (
              <CustomDatePicker label="Select Date & Time" selected={scheduleDate} onChange={(date: Date | null) => setScheduleDate(date)} showTimeSelect />
           )}
        </div>

        <div className="flex justify-end pt-2 gap-2">
             <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
             <Button type="submit" variant="primary" disabled={isSubmitting} leftIcon={<Send size={18}/>}>
                {isSubmitting ? "Saving..." : (editingCampaign ? "Update Campaign" : "Create Campaign")}
            </Button>
        </div>

      </form>
    </Modal>
  );
};

export default CampaignModal;