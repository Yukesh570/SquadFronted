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
  updateCustomRouteApi,
  bulkUpdateCustomRouteApi,
  updateRouteGroupApi,
  type CustomRouteData,
} from "../../../api/routeManagerApi/customRouteApi";
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
  lockedName?: string;
  isEditingGroupStatus?: boolean;
  groupData?: any;
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
}) => {
  const [formData, setFormData] = useState<any>({
    name: "",
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
    if (isOpen && !isEditingGroupStatus) {
      setIsFetchingOptions(true);
      const fetchAllOptions = async () => {
        try {
          const [, countries, vendors] = await Promise.all([
            getClientsApi("client", 1, 1000),
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
  }, [isOpen, isEditingGroupStatus]);

  useEffect(() => {
    if (
      !isEditingGroupStatus &&
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
  }, [formData.country, fullCountriesList, isEditingGroupStatus]);

  useEffect(() => {
    if (
      !isEditingGroupStatus &&
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
              value: `${mcc}(ALL_UI)`,
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
    } else if (!isEditingGroupStatus) {
      setMncOptions([]);
      if (!editingRoute && !isViewMode) {
        setFormData((prev: any) => ({ ...prev, MNC: [] }));
      }
    }
  }, [
    formData.MCC,
    fullNetworkList,
    editingRoute,
    isViewMode,
    isEditingGroupStatus,
  ]);

  useEffect(() => {
    if (isOpen) {
      if (isEditingGroupStatus && groupData) {
        setFormData({
          name: groupData.routeGroup__name || "",
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

        parsedMnc = parsedMnc.map((m) => {
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
  }, [isOpen, editingRoute, lockedName, isEditingGroupStatus, groupData]);

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
        .filter((o) => !o.isUiOnly)
        .map((o) => o.value);
      const isAllSelected =
        allMccValues.length > 0 &&
        allMccValues.every((v) => formData.MCC.includes(v));

      if (isAllSelected) {
        setFormData((prev: any) => ({ ...prev, MCC: [], MNC: [] }));
      } else {
        setFormData((prev: any) => ({ ...prev, MCC: allMccValues }));
      }
      return;
    }
    setFormData((prev: any) => ({ ...prev, MCC: selectedValues }));
  };

  // ⚡️ FIX: Updated handleMncChange to completely isolate "All" tag logic
  const handleMncChange = (selectedValues: string[], clickedOption?: any) => {
    if (clickedOption && clickedOption.isAll) {
      const mccPrefix = clickedOption.value.split("(")[0].trim();
      let newMnc = [...formData.MNC];

      const allTag = mncOptions.find(
        (o) => o.value.startsWith(`${mccPrefix}(`) && o.isAll,
      );

      if (allTag) {
        if (newMnc.includes(allTag.value)) {
          // Deselecting "All" -> clears everything for this MCC
          newMnc = newMnc.filter((v) => !v.startsWith(`${mccPrefix}(`));
        } else {
          // Selecting "All" -> removes individual numbers for this MCC, adds "All" tag only
          newMnc = newMnc.filter((v) => !v.startsWith(`${mccPrefix}(`));
          newMnc.push(allTag.value);
        }
      }
      setFormData((prev: any) => ({ ...prev, MNC: newMnc }));
      return;
    }

    if (clickedOption && !clickedOption.isAll) {
      const mccPrefix = clickedOption.value.split("(")[0].trim();
      let newMnc = [...selectedValues];

      // If user manually clicked an individual item, we MUST destroy the "All" tag
      // and inject all OTHER individual items (minus the one they just deselected)
      const allTag = mncOptions.find(
        (o) => o.value.startsWith(`${mccPrefix}(`) && o.isAll,
      );

      if (allTag && formData.MNC.includes(allTag.value)) {
        // Break the "All" tag into individual pieces
        const individualMncs = mncOptions
          .filter((o) => o.value.startsWith(`${mccPrefix}(`) && !o.isAll)
          .map((o) => o.value);

        newMnc = formData.MNC.filter((v: string) => v !== allTag.value);
        newMnc.push(...individualMncs);
        // Remove the one they actually clicked to deselect
        newMnc = newMnc.filter((v: string) => v !== clickedOption.value);
        // Clean duplicates
        newMnc = Array.from(new Set(newMnc));
      }

      setFormData((prev: any) => ({ ...prev, MNC: newMnc }));
      return;
    }

    setFormData((prev: any) => ({ ...prev, MNC: selectedValues }));
  };

  // ⚡️ FIX: Select All External Button ONLY grabs pure individual numbers and drops any "All" tags
  const handleSelectAllMncExternal = () => {
    const allIndividualMncs = mncOptions
      .filter((o) => !o.isAll && !o.isUiOnly)
      .map((o) => o.value);
    setFormData((prev: any) => ({ ...prev, MNC: allIndividualMncs }));
  };

  const handleClearMncExternal = () => {
    setFormData((prev: any) => ({ ...prev, MNC: [] }));
  };

  // ⚡️ FIX: Compute display handles the visual trickery required by the dropdown
  // If the state holds the "All" tag, we tell the dropdown to visually tick the individuals
  const computeDisplayMnc = () => {
    const display = [...(formData.MNC || [])];

    (formData.MCC || []).forEach((mcc: string) => {
      if (mcc === "ALL_MCC") return;

      const allTagOpt = mncOptions.find(
        (o) => o.value.startsWith(`${mcc}(`) && o.isAll,
      );

      if (allTagOpt && display.includes(allTagOpt.value)) {
        // State holds "All" -> Visually tick all individual options for UI purposes
        const individualMncs = mncOptions
          .filter((o) => o.value.startsWith(`${mcc}(`) && !o.isAll)
          .map((o) => o.value);
        display.push(...individualMncs);
      }
    });

    return Array.from(new Set(display)); // Return unique values to the dropdown
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

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

    const payload = { ...formData };

    payload.MCC = Array.isArray(formData.MCC)
      ? formData.MCC.join(",")
      : formData.MCC || "";

    // ⚡️ FIX: Since formData.MNC perfectly stores EXACTLY what needs to go to the server, we just map it.
    // If "All" was clicked in dropdown, it holds "404(ALL_UI)". If "Select All" outside button was clicked, it holds "404(10), 404(20)".
    payload.MNC = Array.isArray(formData.MNC) ? formData.MNC : [];

    try {
      if (editingRoute?.id) {
        await updateCustomRouteApi(editingRoute.id, payload, moduleName);
        toast.success("Route updated successfully!");
      } else if (lockedName) {
        await bulkUpdateCustomRouteApi(payload, moduleName);
        toast.success("Route added to group successfully!");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditingGroupStatus
          ? "Edit Route Group Status"
          : isViewMode
            ? "View Custom Route"
            : editingRoute
              ? "Edit Custom Route"
              : lockedName
                ? `Add New Route to ${lockedName}`
                : "Create Custom Route"
      }
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-1">
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Header Info
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {isEditingGroupStatus ? (
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold text-primary px-2">
              Route Group Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <Input
                label="Countries"
                name="countries"
                value={
                  Array.isArray(groupData?.countries)
                    ? groupData.countries.join(", ")
                    : groupData?.countries || "-"
                }
                onChange={() => {}}
                disabled={true}
              />
            </div>
          </fieldset>
        ) : (
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
                  disabled={isFieldDisabled || isFetchingOptions}
                />
              </div>
            </fieldset>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
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