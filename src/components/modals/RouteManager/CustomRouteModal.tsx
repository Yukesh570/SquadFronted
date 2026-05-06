import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import { MultiSelectDropdown, type MultiSelectOption } from "../../ui/MultiSelectDropdown";
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

interface CountryData {
  id?: number;
  name: string;
  countryCode: string;
  iso2: string;
  region: string;
  subRegion: string;
}

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

  const [companyOptions, setCompanyOptions] = useState<MultiSelectOption[]>([]);
  const [clientOptions, setClientOptions] = useState<MultiSelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<MultiSelectOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<MultiSelectOption[]>([]);
  
  const [mccOptions, setMccOptions] = useState<MultiSelectOption[]>([]);
  const [mncOptions, setMncOptions] = useState<MultiSelectOption[]>([]);

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

  const extractOptions = (response: any, labelKey: string = "name"): MultiSelectOption[] => {
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

  useEffect(() => {
    if (formData.country && fullCountriesList.length > 0) {
      const selectedCountry = fullCountriesList.find((c) => String(c.id) === String(formData.country));
      const countryNameParam = selectedCountry ? selectedCountry.name : "";

      getOperatorNetworkCodelookupApi(1, 1000, { country__name: countryNameParam })
        .then((res: any) => {
          const list = res.results || (Array.isArray(res) ? res : []);
          setFullNetworkList(list);

          const uniqueMccs = Array.from(new Set(list.map((item: any) => String(item.MCC)))).filter(Boolean);
          const mccOpts: MultiSelectOption[] = [];
          
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
      const newMncOptions: MultiSelectOption[] = [];
      let groupIdx = 0; 
      
      formData.MCC.forEach((mcc: string) => {
        if (mcc === "ALL_MCC") return;

        const specificMncs = fullNetworkList.filter(n => String(n.MCC) === mcc);
        const uniqueMncs = Array.from(new Set(specificMncs.map(n => String(n.MNC)))).filter(Boolean);

        if (uniqueMncs.length > 0) {
          const dbAllMnc = uniqueMncs.find(m => m.toLowerCase() === "all" || m.toLowerCase() === "in rest");

          if (dbAllMnc) {
            newMncOptions.push({ label: `${mcc} ( ${dbAllMnc} )`, value: `${mcc}(${dbAllMnc})`, isAll: true, isUiOnly: false, groupIndex: groupIdx });
          } else if (uniqueMncs.length > 1) {
            newMncOptions.push({ label: `${mcc} ( All )`, value: `${mcc}(ALL_UI)`, isAll: true, isUiOnly: true, groupIndex: groupIdx });
          }

          uniqueMncs.forEach(mnc => {
            if (mnc !== dbAllMnc) {
              newMncOptions.push({ label: `${mcc} ( ${mnc} )`, value: `${mcc}(${mnc})`, isAll: false, isUiOnly: false, groupIndex: groupIdx });
            }
          });
          
          groupIdx++; 
        }
      });
      setMncOptions(newMncOptions);

      // FIXED RACE CONDITION: Only aggressively clean up MNCs when in Create Mode. 
      // If Editing/Viewing, trust the DB data. Running this in Edit mode was wiping data while the API loaded!
      if (!editingRoute && !isViewMode) {
        const sanitizeString = (str: string) => String(str).replace(/\s+/g, '').toLowerCase();

        setFormData((prev: any) => {
          const filteredMncs = (prev.MNC || []).map((m: string) => {
            let sanitizedM = sanitizeString(m);
            
            if (sanitizedM.endsWith('(all)')) {
              const expectedUiValue = sanitizedM.replace('(all)', '(all_ui)');
              if (newMncOptions.some(o => sanitizeString(o.value) === expectedUiValue)) {
                sanitizedM = expectedUiValue;
              }
            }

            const match = newMncOptions.find(o => sanitizeString(o.value) === sanitizedM);
            return match ? match.value : m;
          }).filter((m: string) => newMncOptions.some(o => o.value === m));

          return { ...prev, MNC: filteredMncs };
        });
      }
    } else {
      setMncOptions([]);
      // Only clear MNC state if not editing/viewing
      if (!editingRoute && !isViewMode) {
        setFormData((prev: any) => ({ ...prev, MNC: [] }));
      }
    }
  }, [formData.MCC, fullNetworkList, editingRoute, isViewMode]);

  useEffect(() => {
    if (isOpen) {
      if (editingRoute) {
        
        const parseArrayField = (val: any): string[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val.map(v => String(v).trim());
          
          if (typeof val === 'string') {
            let cleaned = val.trim();
            if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
              try {
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed)) return parsed.map(v => String(v).trim());
              } catch (e) {
                cleaned = cleaned.replace(/^\[|\]$/g, '').replace(/['"]/g, '');
              }
            }
            return cleaned.split(",").map(v => v.trim()).filter(Boolean);
          }
          return [String(val).trim()];
        };

        const parsedMcc = parseArrayField((editingRoute as any).MCC);
        let parsedMnc = parseArrayField((editingRoute as any).MNC);

        parsedMnc = parsedMnc.map(m => {
          if (m.includes("(")) return m;
          if (parsedMcc.length === 1) return `${parsedMcc[0]}(${m})`; 
          return m;
        });

        setFormData({
          name: editingRoute.name || "",
          orginatingCompany: editingRoute.orginatingCompany || 0,
          orginatingClient: editingRoute.orginatingClient || 0,
          priority: editingRoute.priority || "",
          status: editingRoute.status || "ACTIVE",
          country: editingRoute.country || 0,
          MCC: parsedMcc,
          MNC: parsedMnc,
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
      const mccPrefix = clickedOption.value.split('(')[0].trim();
      
      const mncValuesForThisMcc = mncOptions
        .filter(o => o.value.startsWith(`${mccPrefix}(`) && !o.isUiOnly)
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
    
    payload.MCC = Array.isArray(formData.MCC) ? formData.MCC.join(",") : (formData.MCC || "");
    payload.MNC = Array.isArray(formData.MNC) ? formData.MNC : [];

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
                disabled={!!editingRoute || isViewMode || isFetchingOptions}
                placement="top"
              />
            </div>
            
            <div className="lg:col-span-3">
              <MultiSelectDropdown
                label="MCC"
                options={mccOptions}
                selected={formData.MCC}
                onChange={handleMccChange}
                disabled={!!editingRoute || !formData.country || isViewMode || isFetchingOptions}
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
                  disabled={!!editingRoute || formData.MCC.length === 0 || isViewMode || isFetchingOptions}
                  placeholder={formData.MCC.length > 0 ? "Select MNC" : "MCC First"}
                />
              </div>
              {!isViewMode && !editingRoute && (
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