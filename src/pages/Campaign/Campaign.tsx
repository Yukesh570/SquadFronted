// import React, { useState } from "react";
// import { Send, Upload, Clock, Phone, Zap } from "lucide-react";
// import Input from "../../components/ui/Input";
// import Button from "../../components/ui/Button";
// import Select from "../../components/ui/Select";
// import ToggleSwitch from "../../components/ui/ToggleSwitch";


// interface CampaignFormData {
//     campaignName: string;
//     objective: string;
//     audienceType: 'specify' | 'import';
//     contactNumber: string;
//     template: string;
//     content: string;
//     scheduleType: 'now' | 'datetime';
//     scheduleDateTime: string;
//     is_active: boolean;
// }

// interface SelectOption {
//     label: string;
//     value: string;
// }

// interface SegmentOption {
//     label: string;
//     value: 'specify' | 'import' | 'now' | 'datetime';
//     icon?: React.ReactNode;
// }

// type CampaignFormKeys = keyof CampaignFormData;

// const CARD_SHADOW = "shadow-2xl shadow-gray-200/50 dark:shadow-black/20";
// const INPUT_BASE_CLASSES = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-input transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";
// const LABEL_CLASSES = "block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-300";

// const CreateCampaignForm: React.FC = () => {
//     const [formData, setFormData] = useState<CampaignFormData>({
//         campaignName: "",
//         objective: "Promotion",
//         audienceType: "specify",
//         contactNumber: "",
//         template: "Template A (Standard)",
//         content: "",
//         scheduleType: "now",
//         scheduleDateTime: "",
//         is_active: true,
//     });

//     const objectiveOptions: SelectOption[] = [
//         { label: "Promotion", value: "Promotion" },
//         { label: "Announcement", value: "Announcement" },
//         { label: "Re-engagement", value: "Re-engagement" },
//     ];
//     const templateOptions: SelectOption[] = [
//         { label: "Template A (Standard)", value: "Template A (Standard)" },
//         { label: "Template B (Urgent)", value: "Template B (Urgent)" },
//         { label: "Template C (Informational)", value: "Template C (Informational)" },
//     ];

//     const audienceOptions: SegmentOption[] = [
//         { label: "Specify Contact", value: "specify", icon: <Phone size={16} /> },
//         { label: "Import CSV", value: "import", icon: <Upload size={16} /> },
//     ];

//     const scheduleOptions: SegmentOption[] = [
//         { label: "Now", value: "now", icon: <Zap size={16} /> },
//         { label: "Schedule Later", value: "datetime", icon: <Clock size={16} /> },
//     ];

//     // 1. Generic Change Handler (for Input and TextArea HTML elements)
//     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({ ...prev, [name as CampaignFormKeys]: value }));
//     };

//     // 2. Select/Segment Change Handler (Fixes the Code 2322 typing error by handling simple string values)
//     const handleValueChange = (name: CampaignFormKeys, value: string) => {
//         setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleAudienceChange = (value: SegmentOption['value']) => {
//         handleValueChange('audienceType', value);
//         // Clear contact on switch
//         if (value === 'import') {
//             setFormData(prev => ({ ...prev, contactNumber: '' }));
//         }
//     };

//     const handleScheduleChange = (value: SegmentOption['value']) => {
//         handleValueChange('scheduleType', value);
//         // Clear datetime on switch to 'now'
//         if (value === 'now') {
//             setFormData(prev => ({ ...prev, scheduleDateTime: '' }));
//         }
//     };

//     const handleToggleActive = (isChecked: boolean) => {
//         setFormData((prev) => ({ ...prev, is_active: isChecked }));
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         try {
//             if (!formData.campaignName || !formData.content) { throw new Error("Campaign Name and Content are required fields."); }
//             if (formData.audienceType === 'specify' && !formData.contactNumber) { throw new Error("Contact Number is required when specifying audience."); }
//             if (formData.scheduleType === 'datetime' && !formData.scheduleDateTime) { throw new Error("A schedule date and time is required."); }

//             console.log("Submitting Campaign Data:", formData);
//             alert(`Campaign "${formData.campaignName}" successfully processed!`);

//             setFormData({
//                 campaignName: "", objective: "Promotion", audienceType: "specify",
//                 contactNumber: "", template: "Template A (Standard)", content: "",
//                 scheduleType: "now", scheduleDateTime: "", is_active: true,
//             });

//         } catch (error: any) {
//             console.error("Error creating campaign:", error.message);
//             alert(`Submission Failed:\n${error.message}`);
//         }
//     };

//     const InlineSelect: React.FC<{ label: string; name: CampaignFormKeys; value: string; options: SelectOption[]; }> = ({ label, name, value, options }) => (
//         <div className="space-y-1">
//             <label htmlFor={name} className={LABEL_CLASSES}>{label}</label>
//             <div className="relative">
//                 <select
//                     id={name} name={name} value={value}
//                     // Uses handleValueChange to match the simple string signature
//                     onChange={(e) => handleValueChange(name, e.target.value)}
//                     className={`${INPUT_BASE_CLASSES} appearance-none`}
//                 >
//                     {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
//                 </select>
//                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 dark:text-gray-300">
//                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
//                 </div>
//             </div>
//         </div>
//     );

//     const InlineTextArea: React.FC<InputProps> = ({ label, name, value, onChange, placeholder }) => (
//         <div className="space-y-1">
//             <label htmlFor={name} className={LABEL_CLASSES}>{label}</label>
//             <textarea
//                 id={name} name={name} value={value} onChange={onChange as any}
//                 placeholder={placeholder} rows={4}
//                 className={`${INPUT_BASE_CLASSES}`}
//             />
//         </div>
//     );

//     // Custom Inline SegmentedControl (Fixes 'Cannot find name SegmentedControl')
//     const InlineSegmentedControl: React.FC<{ label: string; selectedValue: string; options: SegmentOption[]; onChange: (value: SegmentOption['value']) => void; }> = ({ label, selectedValue, options, onChange }) => (
//         <div className="space-y-1">
//             <label className={LABEL_CLASSES}>{label}</label>
//             <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shadow-inner text-sm">
//                 {options.map((option) => (
//                     <button
//                         key={option.value} type="button" onClick={() => onChange(option.value)}
//                         className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 ${selectedValue === option.value
//                             ? "bg-white dark:bg-gray-800 text-indigo-600 font-semibold shadow ring-1 ring-gray-200 dark:ring-gray-600"
//                             : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
//                             }`}
//                     >
//                         {option.icon}{option.label}
//                     </button>
//                 ))}
//             </div>
//         </div>
//     );
//     // --- END: INLINE MOCK COMPONENTS ---


//     return (
//         <div className="container mx-auto p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">

//             <div className={`max-w-xl mx-auto p-6 rounded-xl bg-white dark:bg-gray-800 ${CARD_SHADOW}`}>

//                 <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
//                     Create New Campaign
//                 </h2>

//                 {/* --- FORM START (Fixes Code 17008/150) --- */}
//                 <form className="space-y-5" onSubmit={handleSubmit}>

//                     {/* 1. Campaign name (USES Input) */}
//                     <Input
//                         label="Campaign Name (required, max 100 chars)"
//                         type="text"
//                         name="campaignName"
//                         value={formData.campaignName}
//                         onChange={handleChange}
//                         placeholder="e.g., Summer Promo SMS"
//                         maxLength={100}
//                     />

//                     {/* 2. Objective (USES InlineSelect, fixing Code 2552) */}
//                     <Select
//                         label="Objective"
//                         name="objective"
//                         value={formData.objective}
//                         options={objectiveOptions}
//                     />

//                     {/* 3. Audience (USES InlineSegmentedControl + Conditional Input) */}
//                     <div className="space-y-3">
//                         <InlineSegmentedControl
//                             label="Audience"
//                             name="audienceType"
//                             selectedValue={formData.audienceType}
//                             options={audienceOptions}
//                             onChange={handleAudienceChange}
//                         />

//                         {formData.audienceType === "specify" ? (
//                             <Input
//                                 label="Dynamic Specify Contact Number(s)"
//                                 type="text"
//                                 name="contactNumber"
//                                 value={formData.contactNumber}
//                                 onChange={handleChange}
//                                 placeholder="Enter contact number"
//                             />
//                         ) : (
//                             <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition flex justify-between items-center">
//                                 <p className="text-sm text-gray-500 dark:text-gray-400">Import CSV option for Contact import.</p>
//                                 <Button
//                                     variant="secondary"
//                                     onClick={() => console.log('Mock CSV file selection.')}
//                                     leftIcon={<Upload size={18} />}
//                                 >
//                                     Upload CSV
//                                 </Button>
//                             </div>
//                         )}
//                     </div>

//                     {/* 4. Template (USES InlineSelect, fixing Code 2552) */}
//                     <Select
//                         label="Template"
//                         name="template"
//                         value={formData.template}
//                         options={templateOptions}
//                     />

//                     {/* 5. Content: Free Writing Space (USES InlineTextArea, fixing Code 2304) */}
//                     <InlineTextArea
//                         label="Content"
//                         name="content"
//                         value={formData.content}
//                         onChange={handleChange}
//                         placeholder="Write the full message content here..."
//                     />

//                     {/* 6. Schedule (USES InlineSegmentedControl + Conditional Input) */}
//                     <div className="space-y-3">
//                         <InlineSegmentedControl
//                             label="Schedule"
//                             name="scheduleType"
//                             selectedValue={formData.scheduleType}
//                             options={scheduleOptions}
//                             onChange={handleScheduleChange}
//                         />

//                         {formData.scheduleType === "datetime" && (
//                             <Input
//                                 label="Date Time Selection (Required)"
//                                 type="datetime-local"
//                                 name="scheduleDateTime"
//                                 value={formData.scheduleDateTime}
//                                 onChange={handleChange}
//                                 placeholder="Select date and time"
//                             />
//                         )}
//                     </div>

//                     {/* 7. Active Toggle (USES ToggleSwitch, fixing Code 2322 by omitting 'name') */}
//                     <ToggleSwitch
//                         checked={formData.is_active}
//                         label="Campaign Status (Active)"
//                         onChange={handleToggleActive}
//                     />

//                     {/* 8. Send Button (USES Button) */}
//                     <div className="pt-3">
//                         <Button
//                             type="submit"
//                             variant="primary"
//                             className="w-full text-lg py-3"
//                             leftIcon={<Send size={20} />}
//                         >
//                             Send Campaign
//                         </Button>
//                     </div>
//                 </form>
//                 {/* --- FORM END --- */}
//             </div>
//         </div>
//     );
// };

// export default CreateCampaignForm;