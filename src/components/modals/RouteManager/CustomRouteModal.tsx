import React, { useState, useEffect, useRef, Fragment } from "react";
import ReactDOM from "react-dom";
import { Popover, Transition } from "@headlessui/react";
import { Check } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import {
  createCustomRouteApi,
  updateCustomRouteApi,
  type CustomRouteData,
} from "../../../api/routeManagerApi/customRouteApi";
import { getCompaniesApi } from "../../../api/companyApi/companyApi";
import { getClientsApi } from "../../../api/clientApi/clientApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import { getVendorsApi } from "../../../api/connectivityApi/vendorApi";
import { getOperatorNetworkCodelookupApi } from "../../../api/operatorNetworkCodeApi/operatorNetworkCodeApi";

interface CustomRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingRoute: CustomRouteData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
  isAll?: boolean;
  isUiOnly?: boolean; // True if it's an artificial header, False if it comes from the DB
}

interface CountryData {
  id?: number;
  name: string;
  countryCode: string;
  iso2: string;
  region: string;
  subRegion: string;
}

// --- React Portal Helper ---
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

// --- Clean List Multi-Select Dropdown Component ---
const MultiSelectDropdown = ({ label, options, selected, onChange, disabled, placeholder }: any) => {
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, []);

  let topPosition = 0;
  let leftPosition = 0;
  let maxDropdownHeight = 320;
  let dropdownWidth = 280;

  if (buttonRect) {
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - buttonRect.bottom - 20;
    topPosition = buttonRect.bottom + 4;
    maxDropdownHeight = Math.min(320, Math.max(220, spaceBelow));
    leftPosition = buttonRect.left;
    dropdownWidth = buttonRect.width; 
  }

  return (
    <Popover className="relative flex flex-col w-full">
      {({ open, close }) => (
        <>
          <label className="text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">{label}</label>
          <Popover.Button
            ref={buttonRef}
            onClick={updatePosition}
            disabled={disabled}
            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 flex justify-between items-center transition-all focus:outline-none focus:ring-1 focus:ring-primary shadow-sm ${
              disabled ? "bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed" : "bg-white dark:bg-gray-900 cursor-pointer hover:border-primary"
            } ${open ? "ring-1 ring-primary border-primary" : ""}`}
          >
            <span className="text-sm truncate text-text-primary dark:text-white">
              {selected.length > 0 ? `${selected.length} selected` : placeholder}
            </span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </Popover.Button>

          {open && buttonRect && !disabled && (
            <Portal>
              <div className="fixed inset-0 z-[9999]" onClick={() => close()}>
                <div
                  className="absolute flex flex-col"
                  style={{
                    top: topPosition,
                    left: leftPosition,
                    width: dropdownWidth,
                    maxHeight: maxDropdownHeight,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Transition
                    appear={true}
                    show={true}
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <div
                      className="w-full rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
                      style={{ maxHeight: "inherit" }}
                    >
                      {/* Clean Options List */}
                      <div className="flex-1 overflow-y-auto min-h-0 py-1">
                        {options.map((opt: any) => {
                          let isSelected = false;
                          
                          // Smart dynamic checking for group headers
                          if (opt.isAll) {
                            if (opt.value === "ALL_MCC") {
                              const standardOpts = options.filter((o:any) => !o.isUiOnly);
                              isSelected = standardOpts.length > 0 && standardOpts.every((o:any) => selected.includes(o.value));
                            } else {
                              const mccPrefix = opt.value.split('-')[0];
                              const standardOpts = options.filter((o:any) => o.value.startsWith(`${mccPrefix}-`) && !o.isUiOnly);
                              isSelected = standardOpts.length > 0 && standardOpts.every((o:any) => selected.includes(o.value));
                            }
                          } else {
                            isSelected = selected.includes(opt.value);
                          }

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                if (opt.isAll) {
                                  onChange(selected, opt);
                                } else {
                                  if (isSelected) {
                                    onChange(selected.filter((v: string) => v !== opt.value), opt);
                                  } else {
                                    onChange([...selected, opt.value], opt);
                                  }
                                }
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors
                                ${
                                  opt.isAll
                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                }
                                ${
                                  isSelected && !opt.isAll
                                    ? "text-primary dark:text-primary font-medium"
                                    : ""
                                }
                              `}
                            >
                              <span className="truncate">{opt.label}</span>
                              {isSelected && <Check size={16} className="text-primary" strokeWidth={2.5} />}
                            </button>
                          );
                        })}
                        {options.length === 0 && (
                          <div className="py-3 px-4 text-left text-gray-500 text-sm">
                            No options available
                          </div>
                        )}
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </Portal>
          )}
        </>
      )}
    </Popover>
  );
};
// ----------------------------------------------

export const CustomRouteModal: React.FC<CustomRouteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingRoute,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState<any>({
    name: "",
    orginatingCompany: 0,
    orginatingClient: 0,
    priority: "",
    status: "ACTIVE",
    country: 0,
    MCC: [],
    MNC: [],
    terminatingCompany: 0,
    terminatingVendor: 0,
  });

  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);
  
  const [mccOptions, setMccOptions] = useState<Option[]>([]);
  const [mncOptions, setMncOptions] = useState<Option[]>([]);

  // Raw arrays to look up relationships & network codes
  const [rawClients, setRawClients] = useState<any[]>([]);
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [fullCountriesList, setFullCountriesList] = useState<CountryData[]>([]);
  const [fullNetworkList, setFullNetworkList] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);

  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  const priorityOptions = [
    { label: "1 (High)", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5 (Low)", value: "5" },
  ];

  const extractOptions = (response: any, labelKey: string = "name") => {
    let data = [];
    if (response && response.results) {
      data = response.results;
    } else if (Array.isArray(response)) {
      data = response;
    } else if (response && Array.isArray(response.data)) {
      data = response.data;
    }
    return data.map((item: any) => ({
      label: item[labelKey] || item.name || "Unknown",
      value: String(item.id),
    }));
  };

  useEffect(() => {
    if (isOpen) {
      setIsFetchingOptions(true);
      const fetchAllOptions = async () => {
        try {
          const [companies, clients, countries, vendors] =
            await Promise.all([
              getCompaniesApi("company", 1, 1000),
              getClientsApi("client", 1, 1000),
              getCountriesApi("country", 1, 1000),
              getVendorsApi("vendor", 1, 1000),
            ]);

          setRawClients(clients.results || (Array.isArray(clients) ? clients : (clients as any).data) || []);
          setRawVendors(vendors.results || (Array.isArray(vendors) ? vendors : (vendors as any).data) || []);
          setFullCountriesList(countries.results || (Array.isArray(countries) ? countries : (countries as any).data) || []);

          setCompanyOptions(extractOptions(companies, "name"));
          setClientOptions(extractOptions(clients, "name"));
          setCountryOptions(extractOptions(countries, "name"));
          setVendorOptions(extractOptions(vendors, "profileName"));
        } catch (error) {
          console.error("Failed to load dropdown options", error);
          toast.error("Could not load form options.");
        } finally {
          setIsFetchingOptions(false);
        }
      };
      fetchAllOptions();
    }
  }, [isOpen]);

  // 1. Fetch Networks and Generate MCC Options when Country Changes
  useEffect(() => {
    if (formData.country && fullCountriesList.length > 0) {
      const selectedCountry = fullCountriesList.find((c) => String(c.id) === String(formData.country));
      const countryNameParam = selectedCountry ? selectedCountry.name : "";

      getOperatorNetworkCodelookupApi(1, 1000, { country__name: countryNameParam })
        .then((res: any) => {
          const list = res.results || (Array.isArray(res) ? res : []);
          setFullNetworkList(list);

          const uniqueMccs = Array.from(new Set(list.map((item: any) => String(item.MCC)))).filter(Boolean);
          const mccOpts: Option[] = [];
          
          if (uniqueMccs.length > 1) {
            mccOpts.push({ label: "All MCCs", value: "ALL_MCC", isAll: true, isUiOnly: true });
          }
          uniqueMccs.forEach((mcc) => mccOpts.push({ label: String(mcc), value: String(mcc), isAll: false, isUiOnly: false }));
          
          setMccOptions(mccOpts);

          if (uniqueMccs.length === 1 && formData.MCC.length === 0) {
            setFormData((prev: any) => ({ ...prev, MCC: [String(uniqueMccs[0])] }));
          }
        })
        .catch(console.error);
    } else {
      setFullNetworkList([]);
      setMccOptions([]);
      setMncOptions([]);
    }
  }, [formData.country, fullCountriesList]);

  // 2. Generate MNC Options when MCC selection changes
  useEffect(() => {
    if (formData.MCC && formData.MCC.length > 0 && fullNetworkList.length > 0) {
      const newMncOptions: Option[] = [];
      
      formData.MCC.forEach((mcc: string) => {
        if (mcc === "ALL_MCC") return;

        const specificMncs = fullNetworkList.filter(n => String(n.MCC) === mcc);
        const uniqueMncs = Array.from(new Set(specificMncs.map(n => String(n.MNC)))).filter(Boolean);

        if (uniqueMncs.length > 0) {
          // Check if DB explicitly has an "All" or "In Rest" route
          const dbAllMnc = uniqueMncs.find(m => m.toLowerCase() === "all" || m.toLowerCase() === "in rest");

          if (dbAllMnc) {
            // Merge DB's "All" route into the grey group header (isUiOnly: false)
            newMncOptions.push({ label: `${mcc} ( ${dbAllMnc} )`, value: `${mcc}-${dbAllMnc}`, isAll: true, isUiOnly: false });
          } else if (uniqueMncs.length > 1) {
            // DB has no "All", so inject an artificial UI "Select All" header (isUiOnly: true)
            newMncOptions.push({ label: `Select All ${mcc}`, value: `${mcc}-ALL_UI`, isAll: true, isUiOnly: true });
          }

          // Push the rest of the standard MNCs
          uniqueMncs.forEach(mnc => {
            if (mnc !== dbAllMnc) {
              newMncOptions.push({ label: `${mcc} ( ${mnc} )`, value: `${mcc}-${mnc}`, isAll: false, isUiOnly: false });
            }
          });
        }
      });
      setMncOptions(newMncOptions);

      // Clean up selected MNCs that belong to unselected MCCs
      setFormData((prev: any) => {
        const validMncValues = newMncOptions.map(o => o.value);
        const filteredMncs = (prev.MNC || []).filter((m: string) => validMncValues.includes(m));
        return { ...prev, MNC: filteredMncs };
      });
    } else {
      setMncOptions([]);
      setFormData((prev: any) => ({ ...prev, MNC: [] }));
    }
  }, [formData.MCC, fullNetworkList]);

  useEffect(() => {
    if (isOpen) {
      if (editingRoute) {
        setFormData({
          name: editingRoute.name,
          orginatingCompany: editingRoute.orginatingCompany || 0,
          orginatingClient: editingRoute.orginatingClient || 0,
          priority: editingRoute.priority || "",
          status: editingRoute.status || "ACTIVE",
          country: editingRoute.country || 0,
          operator: editingRoute.operator || 0,
          MCC: (editingRoute as any).MCC ? String((editingRoute as any).MCC).split(",") : [],
          MNC: (editingRoute as any).MNC ? String((editingRoute as any).MNC).split(",") : [],
          terminatingCompany: editingRoute.terminatingCompany || 0,
          terminatingVendor: editingRoute.terminatingVendor || 0,
        });
      } else {
        setFormData({
          name: "",
          orginatingCompany: 0,
          orginatingClient: 0,
          priority: "",
          status: "ACTIVE",
          country: 0,
          operator: 0,
          MCC: [],
          MNC: [],
          terminatingCompany: 0,
          terminatingVendor: 0,
        });
      }
    }
  }, [isOpen, editingRoute]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    const isNumericField = !["priority", "status", "MCC", "MNC"].includes(name);

    setFormData((prev: any) => {
      const nextData = { ...prev, [name]: isNumericField ? Number(value) : value };

      if (name === "country") {
        nextData.MCC = [];
        nextData.MNC = [];
      }

      if (name === "orginatingClient") {
        const selectedClient = rawClients.find(c => c.id === Number(value));
        if (selectedClient && selectedClient.company) {
          nextData.orginatingCompany = Number(selectedClient.company);
        } else {
          nextData.orginatingCompany = 0;
        }
      }

      if (name === "terminatingVendor") {
        const selectedVendor = rawVendors.find(v => v.id === Number(value));
        if (selectedVendor && selectedVendor.company) {
          nextData.terminatingCompany = Number(selectedVendor.company);
        } else {
          nextData.terminatingCompany = 0;
        }
      }

      return nextData;
    });
  };

  const handleMccChange = (selectedValues: string[], clickedOption?: any) => {
    if (clickedOption && clickedOption.value === "ALL_MCC") {
      const allMccValues = mccOptions.filter(o => !o.isUiOnly).map(o => o.value);
      const isAllSelected = allMccValues.length > 0 && allMccValues.every(v => formData.MCC.includes(v));
      
      if (isAllSelected) {
        setFormData((prev: any) => ({ ...prev, MCC: [], MNC: [] })); 
      } else {
        setFormData((prev: any) => ({ ...prev, MCC: allMccValues })); 
      }
      return;
    }
    setFormData((prev: any) => ({ ...prev, MCC: selectedValues }));
  };

  const handleMncChange = (selectedValues: string[], clickedOption?: any) => {
    if (clickedOption && clickedOption.isAll) {
      const mccPrefix = clickedOption.value.split("-")[0];
      
      // We toggle all standard options under this MCC
      const mncValuesForThisMcc = mncOptions
        .filter(o => o.value.startsWith(`${mccPrefix}-`) && !o.isUiOnly)
        .map(o => o.value);

      const isAllSelected = mncValuesForThisMcc.length > 0 && mncValuesForThisMcc.every(v => formData.MNC.includes(v));
      let newMnc = [...formData.MNC];

      if (isAllSelected) {
        newMnc = newMnc.filter(v => !mncValuesForThisMcc.includes(v));
      } else {
        const toAdd = mncValuesForThisMcc.filter(v => !newMnc.includes(v));
        newMnc = [...newMnc, ...toAdd];
      }
      setFormData((prev: any) => ({ ...prev, MNC: newMnc }));
      return;
    }
    setFormData((prev: any) => ({ ...prev, MNC: selectedValues }));
  };

  // External button correctly excludes the artificial UI headers from the payload
  const handleSelectAllMncExternal = () => {
    const allMncs = mncOptions.filter(o => !o.isUiOnly).map(o => o.value);
    setFormData((prev: any) => ({ ...prev, MNC: allMncs }));
  };

  const handleClearMncExternal = () => {
    setFormData((prev: any) => ({ ...prev, MNC: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name) { toast.error("Name is required."); return; }
    if (!formData.orginatingClient || formData.orginatingClient === 0) { toast.error("Originating Client is required."); return; }
    if (!formData.orginatingCompany || formData.orginatingCompany === 0) { toast.error("Originating Company is required."); return; }
    if (!formData.country || formData.country === 0) { toast.error("Country is required."); return; }
    if (!formData.MCC || formData.MCC.length === 0) { toast.error("At least one MCC is required."); return; }
    if (!formData.MNC || formData.MNC.length === 0) { toast.error("At least one MNC is required."); return; }
    if (!formData.terminatingVendor || formData.terminatingVendor === 0) { toast.error("Terminating Vendor is required."); return; }
    if (!formData.terminatingCompany || formData.terminatingCompany === 0) { toast.error("Terminating Company is required."); return; }
    if (!formData.priority) { toast.error("Priority is required."); return; }

    setIsSubmitting(true);

    const payload = { ...formData };
    payload.MCC = Array.isArray(formData.MCC) ? formData.MCC.join(",") : formData.MCC;
    payload.MNC = Array.isArray(formData.MNC) ? formData.MNC.join(",") : formData.MNC;

    try {
      if (editingRoute?.id) {
        await updateCustomRouteApi(editingRoute.id, payload, moduleName);
        toast.success("Route updated successfully!");
      } else {
        await createCustomRouteApi(payload, moduleName);
        toast.success("Route created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const serverError = error.response?.data;
      if (serverError && typeof serverError === "object") {
        Object.entries(serverError).forEach(([key, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs[0] : msgs;
          toast.error(`${key}: ${msg}`);
        });
      } else {
        toast.error("Failed to save route. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const orginatingCompanyName = companyOptions.find(c => c.value === String(formData.orginatingCompany))?.label || "";
  const terminatingCompanyName = companyOptions.find(c => c.value === String(formData.terminatingCompany))?.label || "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isViewMode
          ? "View Custom Route"
          : editingRoute
          ? "Edit Custom Route"
          : "Create Custom Route"
      }
      className="max-w-4xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-[80vh] overflow-y-auto px-1"
      >
        {/* Header Info */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Header Info
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Route Name"
              required
              disabled={isViewMode}
            />
            <Select
              label="Originating Client"
              value={
                formData.orginatingClient
                  ? String(formData.orginatingClient)
                  : ""
              }
              onChange={(v) => handleSelectChange("orginatingClient", v)}
              options={clientOptions}
              placeholder="Select Client"
              disabled={isViewMode || isFetchingOptions}
            />
            <Input
              label="Originating Company"
              name="orginatingCompanyDisplay"
              value={isFetchingOptions ? "Loading..." : orginatingCompanyName}
              onChange={() => {}} 
              placeholder="Auto-filled from Client"
              disabled={true}
            />
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(v) => handleSelectChange("priority", v)}
              options={priorityOptions}
              placeholder="Select Priority"
              disabled={isViewMode}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(v) => handleSelectChange("status", v)}
              options={statusOptions}
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Destination */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Destination
          </legend>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-3">
              <Select
                label="Country"
                value={formData.country ? String(formData.country) : ""}
                onChange={(v) => handleSelectChange("country", v)}
                options={countryOptions}
                placeholder="Select Country"
                disabled={isViewMode || isFetchingOptions}
                placement="top"
              />
            </div>
            
            <div className="lg:col-span-3">
              <MultiSelectDropdown
                label="MCC"
                options={mccOptions}
                selected={formData.MCC}
                onChange={handleMccChange}
                disabled={!formData.country || isViewMode || isFetchingOptions}
                placeholder={formData.country ? "Select MCC" : "Country First"}
              />
            </div>

            <div className="lg:col-span-6 flex items-end gap-3">
              <div className="flex-1">
                <MultiSelectDropdown
                  label="MNC"
                  options={mncOptions}
                  selected={formData.MNC}
                  onChange={handleMncChange}
                  disabled={formData.MCC.length === 0 || isViewMode || isFetchingOptions}
                  placeholder={formData.MCC.length > 0 ? "Select MNC" : "MCC First"}
                />
              </div>
              {!isViewMode && (
                <div className="flex gap-2 mb-[2px]">
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={handleSelectAllMncExternal} 
                    className="px-3 py-[9px] text-xs shadow-sm"
                    disabled={formData.MCC.length === 0}
                  >
                    Select All
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleClearMncExternal} 
                    className="px-3 py-[9px] text-xs shadow-sm"
                    disabled={formData.MCC.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* Vendor Info */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Vendor Info
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Terminating Vendor"
              value={
                formData.terminatingVendor
                  ? String(formData.terminatingVendor)
                  : ""
              }
              onChange={(v) => handleSelectChange("terminatingVendor", v)}
              options={vendorOptions}
              placeholder="Select Vendor"
              disabled={isViewMode || isFetchingOptions}
              placement="top"
            />
            <Input
              label="Terminating Company"
              name="terminatingCompanyDisplay"
              value={isFetchingOptions ? "Loading..." : terminatingCompanyName}
              onChange={() => {}} 
              placeholder="Auto-filled from Vendor"
              disabled={true}
            />
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingRoute
                ? "Update Route"
                : "Create Route"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};