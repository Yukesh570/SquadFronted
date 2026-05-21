import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import {
  MultiSelectDropdown,
  type MultiSelectOption,
} from "../../ui/MultiSelectDropdown";
import {
  createCustomRouteApi,
} from "../../../api/routeManagerApi/customRouteApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import { getVendorsApi } from "../../../api/connectivityApi/vendorApi";
import { getOperatorNetworkCodelookupApi } from "../../../api/operatorNetworkCodeApi/operatorNetworkCodeApi";

interface CustomRoutePercentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  lockedName?: string;
  isFirstRoute?: boolean;
}

export const CustomRoutePercentModal: React.FC<CustomRoutePercentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  lockedName,
}) => {
  const [formData, setFormData] = useState<any>({
    name: lockedName || "",
    routingType: "PERCENTAGE", 
    status: "ACTIVE",
    country: 0,
    MCC: [],
    MNC: [],
  });

  const [vendorRows, setVendorRows] = useState<any[]>([
    { terminatingVendor: "", percentage: "" },
  ]);

  const [countryOptions, setCountryOptions] = useState<MultiSelectOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<MultiSelectOption[]>([]);
  const [mccOptions, setMccOptions] = useState<MultiSelectOption[]>([]);
  const [mncOptions, setMncOptions] = useState<MultiSelectOption[]>([]);
  const [fullCountriesList, setFullCountriesList] = useState<any[]>([]);
  const [fullNetworkList, setFullNetworkList] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);

  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  const totalPercentage = vendorRows.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0);
  const isTotalValid = totalPercentage === 100;

  const extractOptions = (
    response: any,
    labelKey: string = "name",
  ): MultiSelectOption[] => {
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
          const [countries, vendors] = await Promise.all([
            getCountriesApi("country", 1, 1000),
            getVendorsApi("vendor", 1, 1000),
          ]);

          setFullCountriesList(
            countries.results ||
              (Array.isArray(countries)
                ? countries
                : (countries as any).data) ||
              [],
          );

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
      const selectedCountry = fullCountriesList.find(
        (c) => String(c.id) === String(formData.country),
      );
      const countryNameParam = selectedCountry ? selectedCountry.name : "";

      getOperatorNetworkCodelookupApi(1, 1000, {
        country__name: countryNameParam,
      })
        .then((res: any) => {
          const list = res.results || (Array.isArray(res) ? res : []);
          setFullNetworkList(list);

          const uniqueMccs = Array.from(
            new Set(list.map((item: any) => String(item.MCC))),
          ).filter(Boolean);
          const mccOpts: MultiSelectOption[] = [];

          if (uniqueMccs.length > 1) {
            mccOpts.push({
              label: "All MCCs",
              value: "ALL_MCC",
              isAll: true,
              isUiOnly: true,
            });
          }
          uniqueMccs.forEach((mcc) =>
            mccOpts.push({
              label: String(mcc),
              value: String(mcc),
              isAll: false,
              isUiOnly: false,
            }),
          );

          setMccOptions(mccOpts);

          if (uniqueMccs.length === 1 && formData.MCC.length === 0) {
            setFormData((prev: any) => ({
              ...prev,
              MCC: [String(uniqueMccs[0])],
            }));
          }
        })
        .catch(console.error);
    } else {
      setFullNetworkList([]);
      setMccOptions([]);
      setMncOptions([]);
    }
  }, [formData.country, fullCountriesList]);

  useEffect(() => {
    if (
      formData.MCC &&
      formData.MCC.length > 0 &&
      fullNetworkList.length > 0
    ) {
      const newMncOptions: MultiSelectOption[] = [];
      let groupIdx = 0;

      formData.MCC.forEach((mcc: string) => {
        if (mcc === "ALL_MCC") return;

        const specificMncs = fullNetworkList.filter(
          (n) => String(n.MCC) === mcc,
        );
        const uniqueMncs = Array.from(
          new Set(specificMncs.map((n) => String(n.MNC))),
        ).filter(Boolean);

        if (uniqueMncs.length > 0) {
          const dbAllMnc = uniqueMncs.find(
            (m) => m.toLowerCase() === "all" || m.toLowerCase() === "in rest",
          );

          if (dbAllMnc) {
            newMncOptions.push({
              label: `${mcc} ( ${dbAllMnc} )`,
              value: `${mcc}(${dbAllMnc})`,
              isAll: true,
              isUiOnly: false,
              groupIndex: groupIdx,
            });
          } else if (uniqueMncs.length > 1) {
            newMncOptions.push({
              label: `${mcc} ( All )`,
              value: `${mcc}(All)`,
              isAll: true,
              isUiOnly: true,
              groupIndex: groupIdx,
            });
          }

          uniqueMncs.forEach((mnc) => {
            if (mnc !== dbAllMnc) {
              newMncOptions.push({
                label: `${mcc} ( ${mnc} )`,
                value: `${mcc}(${mnc})`,
                isAll: false,
                isUiOnly: false,
                groupIndex: groupIdx,
              });
            }
          });

          groupIdx++;
        }
      });
      setMncOptions(newMncOptions);
    } else {
      if (mncOptions.length > 0) {
        setMncOptions([]);
      }
      if (formData.MNC && formData.MNC.length > 0) {
        setFormData((prev: any) => ({ ...prev, MNC: [] }));
      }
    }
  }, [formData.MCC, fullNetworkList]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: lockedName || "",
        routingType: "PERCENTAGE",
        status: "ACTIVE",
        country: 0,
        MCC: [],
        MNC: [],
      });
      setVendorRows([{ terminatingVendor: "", percentage: "" }]);
    }
  }, [isOpen, lockedName]);

  const handleSelectChange = (name: string, value: string) => {
    const isNumericField = name === "country";
    setFormData((prev: any) => {
      const nextData = {
        ...prev,
        [name]: isNumericField ? Number(value) : value,
      };

      if (name === "country") {
        nextData.MCC = [];
        nextData.MNC = [];
      }

      return nextData;
    });
  };

  const handleMccChange = (selectedValues: string[], clickedOption?: any) => {
    if (clickedOption && clickedOption.value === "ALL_MCC") {
      const allMccValues = mccOptions
        .filter((o: MultiSelectOption) => !o.isUiOnly)
        .map((o: MultiSelectOption) => o.value);
      const isAllSelected =
        allMccValues.length > 0 &&
        allMccValues.every((v: string) => formData.MCC.includes(v));

      if (isAllSelected) {
        setFormData((prev: any) => ({ ...prev, MCC: [], MNC: [] }));
      } else {
        setFormData((prev: any) => ({ ...prev, MCC: allMccValues }));
      }
      return;
    }
    
    // Filter MNCs to only keep those belonging to selected MCCs
    const filteredMnc = formData.MNC.filter((mnc: string) => {
      const mccPrefix = mnc.split("(")[0].trim();
      return selectedValues.includes(mccPrefix);
    });
    
    setFormData((prev: any) => ({ ...prev, MCC: selectedValues, MNC: filteredMnc }));
  };

  const handleMncChange = (selectedValues: string[], clickedOption?: any) => {
    let baseMnc = selectedValues.filter((v: string) => v !== "All(All)");

    if (clickedOption && clickedOption.isAll) {
      const mccPrefix = clickedOption.value.split("(")[0].trim();
      let newMnc = [...formData.MNC].filter((v: string) => v !== "All(All)");

      const allTag = mncOptions.find(
        (o: MultiSelectOption) => o.value.startsWith(`${mccPrefix}(`) && o.isAll,
      );

      if (allTag) {
        if (newMnc.includes(allTag.value)) {
          newMnc = newMnc.filter((v: string) => !v.startsWith(`${mccPrefix}(`));
        } else {
          newMnc = newMnc.filter((v: string) => !v.startsWith(`${mccPrefix}(`));
          newMnc.push(allTag.value);
        }
      }
      setFormData((prev: any) => ({ ...prev, MNC: newMnc }));
      return;
    }

    if (clickedOption && !clickedOption.isAll) {
      const mccPrefix = clickedOption.value.split("(")[0].trim();
      let newMnc = [...baseMnc];

      const allTag = mncOptions.find(
        (o: MultiSelectOption) => o.value.startsWith(`${mccPrefix}(`) && o.isAll,
      );

      if (allTag && formData.MNC.includes(allTag.value)) {
        const individualMncs = mncOptions
          .filter((o: MultiSelectOption) => o.value.startsWith(`${mccPrefix}(`) && !o.isAll)
          .map((o: MultiSelectOption) => o.value);

        newMnc = formData.MNC.filter((v: string) => v !== allTag.value && v !== "All(All)");
        newMnc.push(...individualMncs);
        newMnc = newMnc.filter((v: string) => v !== clickedOption.value);
        newMnc = Array.from(new Set(newMnc));
      }

      setFormData((prev: any) => ({ ...prev, MNC: newMnc }));
      return;
    }

    setFormData((prev: any) => ({ ...prev, MNC: selectedValues }));
  };

  const handleSelectAllMncExternal = () => {
    // Select all non-UI-only MCCs
    const allMccValues = mccOptions
      .filter((o: MultiSelectOption) => !o.isUiOnly)
      .map((o: MultiSelectOption) => o.value);
    
    // Compute all possible MNC values based on those MCCs and fullNetworkList
    const allIndividualMncs: string[] = [];
    
    allMccValues.forEach((mcc: string) => {
      const specificMncs = fullNetworkList.filter(
        (n) => String(n.MCC) === mcc,
      );
      const uniqueMncs = Array.from(
        new Set(specificMncs.map((n) => String(n.MNC))),
      ).filter(Boolean);
      
      uniqueMncs.forEach((mnc) => {
        const dbAllMnc = mnc.toLowerCase() === "all" || mnc.toLowerCase() === "in rest";
        if (!dbAllMnc) {
          // Add individual MNCs in MCC(MNC) format
          allIndividualMncs.push(`${mcc}(${mnc})`);
        }
      });
    });
    
    // Set both MCCs and MNCs in one state update
    setFormData((prev: any) => ({ 
      ...prev, 
      MCC: [...allMccValues], 
      MNC: [...allIndividualMncs] 
    }));
  };

  const handleClearMncExternal = () => {
    setFormData((prev: any) => ({ ...prev, MCC: [], MNC: [] }));
  };

  const computeDisplayMnc = () => {
    const display = [...(formData.MNC || [])];

    (formData.MCC || []).forEach((mcc: string) => {
      if (mcc === "ALL_MCC") return;

      const allTagOpt = mncOptions.find(
        (o: MultiSelectOption) => o.value.startsWith(`${mcc}(`) && o.isAll,
      );

      if (allTagOpt && display.includes(allTagOpt.value)) {
        const individualMncs = mncOptions
          .filter((o: MultiSelectOption) => o.value.startsWith(`${mcc}(`) && !o.isAll)
          .map((o: MultiSelectOption) => o.value);
        display.push(...individualMncs);
      }
    });

    return Array.from(new Set(display));
  };

  const addVendorRow = () => {
    if (totalPercentage < 100) {
      setVendorRows([...vendorRows, { terminatingVendor: "", percentage: "" }]);
    }
  };

  const removeVendorRow = (index: number) => {
    const newRows = vendorRows.filter((_, i) => i !== index);
    setVendorRows(newRows.length ? newRows : [{ terminatingVendor: "", percentage: "" }]);
  };

  const updateVendorRow = (index: number, field: string, value: string) => {
    const newRows = [...vendorRows];
    newRows[index][field] = value;
    setVendorRows(newRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTotalValid) return toast.error("Total percentage must be exactly 100%");
    
    if (!formData.name) return toast.error("Name is required.");
    if (!formData.country || formData.country === 0) return toast.error("Country is required.");
    if (!formData.MCC || formData.MCC.length === 0) return toast.error("At least one MCC is required.");
    if (!formData.MNC || formData.MNC.length === 0) return toast.error("At least one MNC is required.");

    for (const row of vendorRows) {
        if (!row.terminatingVendor) return toast.error("All vendors must be selected.");
    }

    setIsSubmitting(true);
    try {
      const payloadArray = vendorRows.map((vRow) => {
        const rowPayload: any = { 
            name: formData.name,
            status: formData.status,
            country: formData.country,
            terminatingVendor: Number(vRow.terminatingVendor), 
            trafficPercentage: Number(vRow.percentage) 
        };

        // Get all possible individual MNCs that SHOULD be selected
        const allIndividualMncsAvailable = mncOptions.filter(o => !o.isAll && !o.isUiOnly).map(o => o.value);
        
        // Check if current form data includes ALL individual MNCs
        const isActuallyAllSelected = allIndividualMncsAvailable.length > 0 && 
                                      allIndividualMncsAvailable.every(mnc => formData.MNC.includes(mnc));

        if (isActuallyAllSelected) {
          delete rowPayload.MCC; 
          rowPayload.MNC = ["All(All)"];
        } else {
          rowPayload.MCC = Array.isArray(formData.MCC)
            ? formData.MCC.filter((m: string) => m !== "ALL_MCC").join(",")
            : formData.MCC || "";
            
          // ✅ CORRECT - keeps the MCC(MNC) format
          rowPayload.MNC = Array.from(new Set(formData.MNC));
        }

        if (lockedName) {
          rowPayload.routeGroup = lockedName;
        }

        return rowPayload;
      });

      await createCustomRouteApi(payloadArray, moduleName);

      toast.success("Percentage routes created successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const serverError = err.response?.data;
      if (serverError && typeof serverError === "object") {
        Object.entries(serverError).forEach(([key, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs[0] : msgs;
          toast.error(`${key}: ${msg}`);
        });
      } else {
        toast.error("Failed to save routes.");
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
      title={lockedName ? `Add New Route to ${lockedName}` : "Create Custom Route"}
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-1">
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Header Info
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input
               label="Name"
               name="name"
               value={formData.name}
               onChange={() => {}}
               disabled={true}
             />
             <Select
               label="Status"
               value={formData.status}
               onChange={(v) => handleSelectChange("status", v)}
               options={statusOptions}
             />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-visible">
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
                disabled={isFetchingOptions}
              />
            </div>

            <div className="lg:col-span-3">
              <MultiSelectDropdown
                label="MCC"
                options={mccOptions}
                selected={formData.MCC}
                onChange={handleMccChange}
                disabled={!formData.country || isFetchingOptions}
                placeholder={formData.country ? "Select MCC" : "Country First"}
              />
            </div>

            <div className="lg:col-span-6 flex items-end gap-3">
              <div className="flex-1">
                <MultiSelectDropdown
                  label="MNC"
                  options={mncOptions}
                  selected={computeDisplayMnc()}
                  onChange={handleMncChange}
                  disabled={formData.MCC.length === 0 || isFetchingOptions}
                  placeholder={formData.MCC.length > 0 ? "Select MNC" : "MCC First"}
                />
              </div>
              <div className="flex gap-2 mb-[2px]">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSelectAllMncExternal}
                  className="px-3 py-[9px] text-xs shadow-sm"
                  disabled={!formData.country || isFetchingOptions}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearMncExternal}
                  className="px-3 py-[9px] text-xs shadow-sm"
                  disabled={!formData.country || isFetchingOptions}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <legend className="text-sm font-semibold text-primary px-2">Vendor Distribution</legend>
            {totalPercentage < 100 && (
              <Button type="button" variant="secondary" onClick={addVendorRow} className="py-1 px-3 text-xs" leftIcon={<Plus size={14} />}>
                Add Vendor
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
  {vendorRows.map((row, index) => {
    const selectedVendors = vendorRows
      .filter((_, i) => i !== index)
      .map((r) => r.terminatingVendor)
      .filter(Boolean);

    const availableVendorOptions = vendorOptions.map((option) => ({
      ...option,
      disabled: selectedVendors.includes(option.value),
    }));

    return (
      <div key={index} className="flex items-end gap-3 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="flex-1">
          <Select
            label="Terminating Vendor"
            value={row.terminatingVendor}
            options={availableVendorOptions}
            onChange={(v) => updateVendorRow(index, "terminatingVendor", v)}
            placeholder="Select Vendor"
            placement="top"
          />
        </div>
        <div className="w-32">
          <Input label="Percent (%)" name={`percentage-${index}`} type="number" value={row.percentage} onChange={(e) => updateVendorRow(index, "percentage", e.target.value)} placeholder="0-100" />
        </div>
        <button type="button" onClick={() => removeVendorRow(index)} className="p-2.5 mb-[2px] text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
          <Trash2 size={18} />
        </button>
      </div>
    );
  })}
</div>

          <div className={`mt-4 p-3 rounded-lg flex items-center justify-between border ${isTotalValid ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"}`}>
             <div className="flex items-center gap-2">
                {isTotalValid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="text-sm font-medium">Total Percentage: {totalPercentage}%</span>
             </div>
             {!isTotalValid && <span className="text-xs italic opacity-80">Must equal exactly 100% to save</span>}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !isTotalValid}>
            {isSubmitting ? "Saving..." : "Add Route"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};