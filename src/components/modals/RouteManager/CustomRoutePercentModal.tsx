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
  type CustomRouteData,
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
  editingRoute?: CustomRouteData | null;
  isFirstRoute?: boolean;
  allowedCountryIds?: string[];
  otherRoutesTotal?: number;
  onSaveLocal?: (updatedData: {
    trafficPercentage: number;
    terminatingVendor: number;
    status: string;
  }) => void;
}

export const CustomRoutePercentModal: React.FC<CustomRoutePercentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  lockedName,
  editingRoute = null,
  allowedCountryIds,
  otherRoutesTotal = 0,
  onSaveLocal,
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

  const isEditMode = !!editingRoute;

  // Dynamic Percentage Calculations
  const currentModalTotal = vendorRows.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0);
  const grandTotal = (otherRoutesTotal || 0) + currentModalTotal;
  const isExceeded = grandTotal > 100;

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

          const fullList =
            countries.results ||
            (Array.isArray(countries) ? countries : (countries as any).data) ||
            [];
          setFullCountriesList(fullList);

          const allCountryOptions = extractOptions(countries, "name");
          const filteredCountryOptions =
            allowedCountryIds && allowedCountryIds.length > 0
              ? allCountryOptions.filter((o) => allowedCountryIds.includes(o.value))
              : allCountryOptions;
          setCountryOptions(filteredCountryOptions);

          if (filteredCountryOptions.length === 1 && !editingRoute) {
            setFormData((prev: any) => ({
              ...prev,
              country: Number(filteredCountryOptions[0].value),
            }));
          }

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

          if (uniqueMccs.length === 1 && formData.MCC.length === 0 && !editingRoute) {
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
              const matchItem = specificMncs.find((n) => String(n.MNC) === mnc);
              const opName = matchItem?.operator || matchItem?.operatorName || matchItem?.brandName || "";
              const labelText = opName ? `${mcc} ( ${mnc} - ${opName} )` : `${mcc} ( ${mnc} )`;

              newMncOptions.push({
                label: labelText,
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
      if (formData.MNC && formData.MNC.length > 0 && !editingRoute) {
        setFormData((prev: any) => ({ ...prev, MNC: [] }));
      }
    }
  }, [formData.MCC, fullNetworkList]);

  useEffect(() => {
    if (isOpen) {
      if (editingRoute) {
        const parseArrayField = (val: any): string[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val.map((v) => String(v).trim());
          if (typeof val === "string") {
            let cleaned = val.trim();
            if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
              try {
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim());
              } catch (e) {
                cleaned = cleaned.replace(/^\[|\]$/g, "").replace(/['"]/g, "");
              }
            }
            return cleaned.split(",").map((v) => v.trim()).filter(Boolean);
          }
          return [String(val).trim()];
        };

        setFormData({
          name: editingRoute.name || lockedName || "",
          routingType: "PERCENTAGE",
          status: editingRoute.status || "ACTIVE",
          country: editingRoute.country || 0,
          MCC: parseArrayField((editingRoute as any).MCC),
          MNC: parseArrayField((editingRoute as any).MNC),
        });

        setVendorRows([
          {
            terminatingVendor: String(editingRoute.terminatingVendor || ""),
            percentage: String(editingRoute.trafficPercentage || ""),
          },
        ]);
      } else {
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
    }
  }, [isOpen, lockedName, editingRoute]);

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

    const filteredMnc = formData.MNC.filter((mnc: string) => {
      const mccPrefix = mnc.split("(")[0].trim();
      return selectedValues.includes(mccPrefix);
    });

    const previousMccs: string[] = formData.MCC;
    const newlyAddedMccs = selectedValues.filter((mcc: string) => !previousMccs.includes(mcc));

    const restoredMncs: string[] = [];
    newlyAddedMccs.forEach((mcc: string) => {
      const specificMncs = fullNetworkList.filter((n) => String(n.MCC) === mcc);
      const uniqueMncs = Array.from(
        new Set(specificMncs.map((n) => String(n.MNC)))
      ).filter(Boolean);

      uniqueMncs.forEach((mnc) => {
        const isDbAll = mnc.toLowerCase() === "all" || mnc.toLowerCase() === "in rest";
        if (!isDbAll) {
          restoredMncs.push(`${mcc}(${mnc})`);
        }
      });
    });

    const mergedMnc = Array.from(new Set([...filteredMnc, ...restoredMncs]));
    setFormData((prev: any) => ({ ...prev, MCC: selectedValues, MNC: mergedMnc }));
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
    const allMccValues = mccOptions
      .filter((o: MultiSelectOption) => !o.isUiOnly)
      .map((o: MultiSelectOption) => o.value);
    
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
          allIndividualMncs.push(`${mcc}(${mnc})`);
        }
      });
    });
    
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
    if (grandTotal < 100) {
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

  const extractCleanMncString = (mncInput: any): string => {
    if (!mncInput) return "";
    let list: string[] = [];
    if (Array.isArray(mncInput)) {
      list = mncInput;
    } else if (typeof mncInput === "string") {
      list = [mncInput];
    } else {
      list = [String(mncInput)];
    }

    const cleaned = list.map((item) => {
      const str = String(item).trim();
      if (str.includes("(") && str.includes(")")) {
        const match = str.match(/\(([^)]+)\)/);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return str;
    });

    return Array.from(new Set(cleaned.filter(Boolean))).join(",");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExceeded) return toast.error("Total percentage cannot exceed 100%");

    for (const row of vendorRows) {
      if (!row.terminatingVendor) return toast.error("All vendors must be selected.");
      if (!row.percentage) return toast.error("Traffic percentage is required.");
    }

    // LOCAL EDIT MODE: DO NOT CALL API - Update local table state in SubRouteTableModal and close
    if (isEditMode && onSaveLocal) {
      const row = vendorRows[0];
      onSaveLocal({
        trafficPercentage: Number(row.percentage),
        terminatingVendor: Number(row.terminatingVendor),
        status: formData.status,
      });
      onClose();
      return;
    }

    // CREATE MODE ONLY: Submit new routes via API
    if (!formData.name) return toast.error("Name is required.");
    if (!formData.country || formData.country === 0) return toast.error("Country is required.");
    if (!formData.MCC || formData.MCC.length === 0) return toast.error("At least one MCC is required.");
    if (!formData.MNC || formData.MNC.length === 0) return toast.error("At least one MNC is required.");

    setIsSubmitting(true);
    try {
      const cleanMnc = extractCleanMncString(formData.MNC);

      const payloadArray = vendorRows.map((vRow) => {
        const rowPayload: any = { 
          name: formData.name,
          status: formData.status,
          country: Number(formData.country),
          terminatingVendor: Number(vRow.terminatingVendor), 
          trafficPercentage: Number(vRow.percentage) 
        };

        const allIndividualMncsAvailable = mncOptions.filter(o => !o.isAll && !o.isUiOnly).map(o => o.value);
        const isActuallyAllSelected = allIndividualMncsAvailable.length > 0 && 
                                      allIndividualMncsAvailable.every(mnc => formData.MNC.includes(mnc));

        if (isActuallyAllSelected) {
          delete rowPayload.MCC; 
          rowPayload.MNC = "ALL";
        } else {
          rowPayload.MCC = Array.isArray(formData.MCC)
            ? formData.MCC.filter((m: string) => m !== "ALL_MCC").join(",")
            : formData.MCC || "";
            
          rowPayload.MNC = cleanMnc;
        }

        if (lockedName) {
          rowPayload.routeGroup = lockedName;
        }

        return rowPayload;
      });

      await createCustomRouteApi(payloadArray.length === 1 ? payloadArray[0] : payloadArray, moduleName);
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
      title={isEditMode ? `Edit Route: ${formData.name || ''}` : (lockedName ? `Add New Route to ${lockedName}` : "Create Custom Route")}
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
                disabled={isFetchingOptions || isEditMode}
              />
            </div>

            <div className="lg:col-span-3">
              <MultiSelectDropdown
                label="MCC"
                options={mccOptions}
                selected={formData.MCC}
                onChange={handleMccChange}
                disabled={!formData.country || isFetchingOptions || isEditMode}
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
                  disabled={formData.MCC.length === 0 || isFetchingOptions || isEditMode}
                  placeholder={formData.MCC.length > 0 ? "Select MNC" : "MCC First"}
                />
              </div>
              {!isEditMode && (
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
              )}
            </div>
          </div>
        </fieldset>

        {/* Read-Only Rates & Margins inside Modal */}
        {isEditMode && (
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/30">
            <legend className="text-sm font-semibold text-primary px-2">
              Rates & Margins (Read-Only)
            </legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Customer Rate"
                value={(editingRoute as any)?.customerRate ? `${(editingRoute as any).customerRate} ${(editingRoute as any).clientCurrencyCode || ''}` : "—"}
                disabled
              />
              <Input
                label="Vendor Rate"
                value={(editingRoute as any)?.vendorRate ? `${(editingRoute as any).vendorRate} ${(editingRoute as any).vendorCurrencyCode || ''}` : "—"}
                disabled
              />
              <Input
                label="Margin"
                value={(editingRoute as any)?.margin !== undefined ? `${(editingRoute as any).margin} ${(editingRoute as any).baseCurrencyCode || ''}` : "—"}
                disabled
              />
              <Input
                label="Margin %"
                value={(editingRoute as any)?.marginPercentage !== undefined ? `${(editingRoute as any).marginPercentage}%` : "—"}
                disabled
              />
            </div>
          </fieldset>
        )}

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <legend className="text-sm font-semibold text-primary px-2">Vendor Distribution</legend>
            {!isEditMode && grandTotal < 100 && (
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
                  {!isEditMode && vendorRows.length > 1 && (
                    <button type="button" onClick={() => removeVendorRow(index)} className="p-2.5 mb-[2px] text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* DYNAMIC CALCULATION BANNER */}
          <div
            className={`mt-4 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between border gap-2 ${
              grandTotal === 100
                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                : isExceeded
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
            }`}
          >
             <div className="flex items-center gap-2">
                {grandTotal === 100 ? (
                  <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="shrink-0" />
                )}
                <span className="text-sm font-semibold">
                  {isExceeded ? (
                    <>Error: Total is {grandTotal}% (Exceeds limit by {grandTotal - 100}%)</>
                  ) : grandTotal < 100 ? (
                    <>Warning: Total is {grandTotal}% ({100 - grandTotal}% remaining)</>
                  ) : (
                    <>Valid: Total is 100%</>
                  )}
                </span>
             </div>
             <span className="text-xs font-mono opacity-90">
               (This Route: {currentModalTotal}% + Other Vendors: {otherRoutesTotal}%)
             </span>
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || isExceeded}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};