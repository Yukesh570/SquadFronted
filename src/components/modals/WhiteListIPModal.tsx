// import React, { useState, useEffect } from "react";
// import { toast } from "react-toastify";
// import Modal from "../ui/Modal";
// import Button from "../ui/Button";
// import Input from "../ui/Input";
// import Select from "../ui/Select";
// import {
//   createIpWhitelistApi,
//   updateIpWhitelistApi,
//   type IpWhitelistData,
// } from "../../api/ipWhitelistApi/ipWhitelistApi";
// import { getClientsApi } from "../../api/clientApi/clientApi";

// interface IpWhitelistModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   moduleName: string;
//   editingData: IpWhitelistData | null;
//   isViewMode?: boolean;
// }

// interface Option {
//   label: string;
//   value: string;
// }

// const IpWhitelistModal: React.FC<IpWhitelistModalProps> = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   moduleName,
//   editingData,
//   isViewMode = false,
// }) => {
//   const [formData, setFormData] = useState({
//     ip: "",
//     client: "",
//   });

//   const [clientOptions, setClientOptions] = useState<Option[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (isOpen) {
//       const fetchClients = async () => {
//         try {
//           const res: any = await getClientsApi("client", 1, 1000);
//           const list = res.results || (Array.isArray(res) ? res : []);
//           setClientOptions(
//             list.map((item: any) => ({
//               label: item.name,
//               value: String(item.id),
//             })),
//           );
//         } catch (error) {
//           console.error("Failed to load clients", error);
//         }
//       };
//       fetchClients();
//     }
//   }, [isOpen]);

//   useEffect(() => {
//     if (isOpen && editingData) {
//       setFormData({
//         ip: editingData.ip || "",
//         client: String(editingData.client || ""),
//       });
//     } else if (isOpen) {
//       setFormData({
//         ip: "",
//         client: "",
//       });
//     }
//   }, [isOpen, editingData]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSelect = (name: string, value: string) => {
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (isViewMode) return;

//     if (!formData.ip) {
//       toast.error("IP Address is required");
//       return;
//     }
//     if (!formData.client) {
//       toast.error("Client is required");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const payload = {
//         ip: formData.ip,
//         client: Number(formData.client),
//       };

//       if (editingData?.id) {
//         await updateIpWhitelistApi(editingData.id, payload, moduleName);
//         toast.success("IP Whitelist updated successfully!");
//       } else {
//         await createIpWhitelistApi(payload, moduleName);
//         toast.success("IP Whitelist created successfully!");
//       }
//       onSuccess();
//       onClose();
//     } catch (error: any) {
//       console.error(error);
//       toast.error("Failed to save IP Whitelist.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title={
//         isViewMode
//           ? "View IP Whitelist"
//           : editingData
//             ? "Edit IP Whitelist"
//             : "Add IP Whitelist"
//       }
//       className="max-w-xl"
//     >
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div className="grid grid-cols-1 gap-4">
//           <Input
//             label="IP Address"
//             name="ip"
//             value={formData.ip}
//             onChange={handleChange}
//             placeholder="IPv4 or IPv6"
//             required
//             disabled={isViewMode}
//           />

//           <Select
//             label="Client"
//             value={formData.client}
//             onChange={(v) => handleSelect("client", v)}
//             options={clientOptions}
//             placeholder="Select Client"
//             disabled={isViewMode}
//           />
//         </div>

//         <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
//           <Button type="button" variant="secondary" onClick={onClose}>
//             {isViewMode ? "Close" : "Cancel"}
//           </Button>
//           {!isViewMode && (
//             <Button type="submit" variant="primary" disabled={isSubmitting}>
//               {isSubmitting ? "Saving..." : editingData ? "Update" : "Create"}
//             </Button>
//           )}
//         </div>
//       </form>
//     </Modal>
//   );
// };

// export default IpWhitelistModal;
