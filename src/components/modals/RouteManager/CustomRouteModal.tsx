import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
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
  updateRouteGroupApi,
  createRouteGroupApi,
  type CustomRouteData,
} from "../../../api/routeManagerApi/customRouteApi";
import { getClientsApi } from "../../../api/clientApi/clientApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import { getVendorsApi } from "../../../api/connectivityApi/vendorApi";
import { getOperatorNetworkCodelookupApi } from "../../../api/operatorNetworkCodeApi/operatorNetworkCodeApi";

interface CustomRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdGroup?: any) => void;
  moduleName: string;
  editingRoute: CustomRouteData | null;
  isViewMode?: boolean;
  lockedName?: string;
  isEditingGroupStatus?: boolean;
  groupData?: any;
  isCreatingGroup?: boolean;
  isFirstRoute?: boolean;
  allowedCountryIds?: string[];
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
  lockedName,
  isEditingGroupStatus = false,
  groupData = null,
  isCreatingGroup = false,
  isFirstRoute = false,
  allowedCountryIds,
}) => {
  const [formData, setFormData] = useState<any>({
    name: "",
    routingType: "PRIORITY",
    priority: "",
    status: "ACTIVE",
    country: 0,
    MCC: [],
    MNC: [],
    terminatingVendor: 0,
  });

  const [countryOptions, setCountryOptions] = useState<MultiSelectOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<MultiSelectOption[]>([]);
  const [mccOptions, setMccOptions] = useState<MultiSelectOption[]>([]);
  const [mncOptions, setMncOptions] = useState<MultiSelectOption[]>([]);

  const [fullCountriesList, setFullCountriesList] = useState<CountryData[]>([]);
  const [fullNetworkList, setFullNetworkList] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);

  const isFieldDisabled = isViewMode || isEditingGroupStatus;

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
    if (isOpen && !isEditingGroupStatus && !isCreatingGroup) {
      setIsFetchingOptions(true);
      const fetchAllOptions = async () => {
        try {
          const [, countries, vendors] = await Promise.all([
            getClientsApi("client", 1, 1000),
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

          if (filteredCountryOptions.length === 1) {
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
  }, [isOpen, isEditingGroupStatus, isCreatingGroup]);

  useEffect(() => {
    if (
      !isEditingGroupStatus &&
      !isCreatingGroup &&
      formData.country &&
      fullCountriesList.length > 0
    ) {
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
    } else if (!isEditingGroupStatus) {
      setFullNetworkList([]);
      setMccOptions([]);
      setMncOptions([]);
    }
  }, [formData.country, fullCountriesList, isEditingGroupStatus, isCreatingGroup]);

  useEffect(() => {
    if (
      !isEditingGroupStatus &&
      !isCreatingGroup &&
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

          // ⚡️ SHOW OPERATOR NAME IN BRACKET
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
    } else if (!isEditingGroupStatus) {
      if (mncOptions.length > 0) {
         setMncOptions([]);
      }
      if (!editingRoute && !isViewMode) {
        if (formData.MNC && formData.MNC.length > 0) {
           setFormData((prev: any) => ({ ...prev, MNC: [] }));
        }
      }
    }
  }, [
    formData.MCC,
    fullNetworkList,
    editingRoute,
    isViewMode,
    isEditingGroupStatus,
    isCreatingGroup,
  ]);

  useEffect(() => {
    if (isOpen) {
      if (isCreatingGroup) {
         setFormData({
            name: "",
            status: "ACTIVE"
         });
      } else if (isEditingGroupStatus && groupData) {
        setFormData({
          name: groupData.name || groupData.routeGroup__name || "",
          priority: "",
          status: groupData.status || "ACTIVE",
          country: 0,
          MCC: [],
          MNC: [],
          terminatingVendor: 0,
        });
      } else if (editingRoute) {
        const parseArrayField = (val: any): string[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val.map((v) => String(v).trim());

          if (typeof val === "string") {
            let cleaned = val.trim();
            if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
              try {
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed))
                  return parsed.map((v) => String(v).trim());
              } catch (e) {
                cleaned = cleaned.replace(/^\[|\]$/g, "").replace(/['"]/g, "");
              }
            }
            return cleaned
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
          }
          return [String(val).trim()];
        };

        const parsedMcc = parseArrayField((editingRoute as any).MCC);
        let parsedMnc = parseArrayField((editingRoute as any).MNC);

        parsedMnc = parsedMnc.map((m: string) => {
          if (m.includes("(")) return m;
          if (parsedMcc.length === 1) return `${parsedMcc[0]}(${m})`;
          return m;
        });

        setFormData({
          name: editingRoute.name || "",
          priority: editingRoute.priority || "",
          status: editingRoute.status || "ACTIVE",
          country: editingRoute.country || 0,
          MCC: parsedMcc,
          MNC: parsedMnc,
          terminatingVendor: editingRoute.terminatingVendor || 0,
        });
      } else {
        setFormData({
          name: lockedName || "",
          priority: "",
          status: "ACTIVE",
          country: 0,
          MCC: [],
          MNC: [],
          terminatingVendor: 0,
        });
      }
    }
  }, [isOpen, editingRoute, lockedName, isEditingGroupStatus, groupData, isCreatingGroup]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    const isNumericField = !["priority", "status", "MCC", "MNC"].includes(name);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (isCreatingGroup) {
      if (!formData.name) {
        toast.error("Group Name is required.");
        return;
      }
      setIsSubmitting(true);
      try {
        const created = await createRouteGroupApi(
          { name: formData.name, status: formData.status },
          moduleName
        );
        toast.success("Route Group created successfully!");
        onSuccess(created);
        onClose();
      } catch (err: any) {
        console.error(err);
        const serverError = err.response?.data;
        if (serverError?.error) {
          toast.error(serverError.error);
        } else if (serverError && typeof serverError === "object") {
          Object.entries(serverError).forEach(([key, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            toast.error(`${key}: ${msg}`);
          });
        } else {
          toast.error("Failed to create route group.");
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (isEditingGroupStatus && groupData) {
      setIsSubmitting(true);
      try {
        await updateRouteGroupApi(
          groupData.id,
          { status: formData.status },
          moduleName,
        );
        toast.success("Route group updated successfully!");
        onSuccess();
        onClose();
      } catch (err) {
        toast.error("Failed to update route group status.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!formData.name) {
      toast.error("Name is required.");
      return;
    }
    if (!formData.country || formData.country === 0) {
      toast.error("Country is required.");
      return;
    }
    if (!formData.MCC || formData.MCC.length === 0) {
      toast.error("At least one MCC is required.");
      return;
    }
    if (!formData.MNC || formData.MNC.length === 0) {
      toast.error("At least one MNC is required.");
      return;
    }
    if (!formData.terminatingVendor || formData.terminatingVendor === 0) {
      toast.error("Terminating Vendor is required.");
      return;
    }
    if (!formData.priority) {
      toast.error("Priority is required.");
      return;
    }

    setIsSubmitting(true);

    const payload: any = { ...formData };

    const allIndividualMncsAvailable = mncOptions.filter(o => !o.isAll && !o.isUiOnly).map(o => o.value);
    
    const isActuallyAllSelected = allIndividualMncsAvailable.length > 0 && 
                                  allIndividualMncsAvailable.every(mnc => formData.MNC.includes(mnc));

    if (isActuallyAllSelected) {
      delete payload.MCC; 
      payload.MNC = ["All(All)"];
    } else {
      payload.MCC = Array.isArray(formData.MCC)
        ? formData.MCC.filter((m: string) => m !== "ALL_MCC").join(",")
        : formData.MCC || "";
        
      payload.MNC = Array.from(new Set(formData.MNC));
    }

    if (lockedName) {
      payload.routeGroup = lockedName;
    }

    try {
      await createCustomRouteApi(payload, moduleName);
      toast.success("Route created successfully!");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isCreatingGroup
          ? "Create Route Group"
          : isEditingGroupStatus
            ? "Edit Route Group Status"
            : isViewMode
              ? "View Custom Route"
              : editingRoute
                ? "Edit Custom Route"
                : lockedName
                  ? (isFirstRoute ? `Create Route in ${lockedName}` : `Add New Route to ${lockedName}`)
                  : "Create Custom Route"
      }
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-1">
        {isCreatingGroup ? (
           <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
             <legend className="text-sm font-semibold text-primary px-2">
               Route Group Info
             </legend>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input
                 label="Group Name"
                 name="name"
                 value={formData.name}
                 onChange={handleChange}
                 placeholder="Enter Route Group Name"
                 required
               />
               <Select
                 label="Status"
                 value={formData.status}
                 onChange={(v) => handleSelectChange("status", v)}
                 options={statusOptions}
               />
             </div>
           </fieldset>
        ) : (
          <>
            <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <legend className="text-sm font-semibold text-primary px-2">
                Header Info
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {isEditingGroupStatus ? (
                  <Input
                    label="Route Group Name"
                    name="name"
                    value={formData.name}
                    onChange={() => {}}
                    disabled={true}
                  />
                ) : (
                  <Input
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Route Name"
                    required
                    disabled={isFieldDisabled || !!lockedName}
                  />
                )}

                {!isEditingGroupStatus && (
                  <Select
                    label="Priority"
                    value={formData.priority}
                    onChange={(v) => handleSelectChange("priority", v)}
                    options={priorityOptions}
                    placeholder="Select Priority"
                    disabled={isFieldDisabled}
                  />
                )}

                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(v) => handleSelectChange("status", v)}
                  options={statusOptions}
                  disabled={isViewMode}
                />
              </div>
            </fieldset>

            {!isEditingGroupStatus && (
              <>
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
                        disabled={
                          !!editingRoute || isFieldDisabled || isFetchingOptions
                        }
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <MultiSelectDropdown
                        label="MCC"
                        options={mccOptions}
                        selected={formData.MCC}
                        onChange={handleMccChange}
                        disabled={
                          !!editingRoute ||
                          !formData.country ||
                          isFieldDisabled ||
                          isFetchingOptions
                        }
                        placeholder={
                          formData.country ? "Select MCC" : "Country First"
                        }
                      />
                    </div>

                    <div className="lg:col-span-6 flex items-end gap-3">
                      <div className="flex-1">
                        <MultiSelectDropdown
                          label="MNC"
                          options={mncOptions}
                          selected={computeDisplayMnc()}
                          onChange={handleMncChange}
                          disabled={
                            !!editingRoute ||
                            formData.MCC.length === 0 ||
                            isFieldDisabled ||
                            isFetchingOptions
                          }
                          placeholder={
                            formData.MCC.length > 0 ? "Select MNC" : "MCC First"
                          }
                        />
                      </div>
                      {!isFieldDisabled && !editingRoute && (
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
                      disabled={isFieldDisabled || isFetchingOptions}
                    />
                  </div>
                </fieldset>
              </>
            )}
          </>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isCreatingGroup
                  ? "Create Route Group"
                  : isEditingGroupStatus
                    ? "Save Status"
                    : editingRoute
                      ? "Update Route"
                      : "Add Route"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};