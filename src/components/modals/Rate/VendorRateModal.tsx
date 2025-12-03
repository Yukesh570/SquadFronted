import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createVendorRateApi,
  updateVendorRateApi,
  type VendorRateData,
} from "../../../api/rateApi/vendorRateApi";
// Removed getCurrenciesApi import as we are using static options now
import { getTimezoneApi } from "../../../api/settingApi/timezoneApi/timezoneApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";
import TextArea from "../../ui/TextArea";

interface VendorRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingRate: VendorRateData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

interface CountryData {
  id: number;
  name: string;
  MCC: string;
}

export const VendorRateModal: React.FC<VendorRateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingRate,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    ratePlan: "",
    currencyCode: "",
    timeZone: "",
    country: "",
    MCC: "",
    rate: "",
    remark: "",
  });

  const [timezoneOptions, setTimezoneOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [fullCountriesList, setFullCountriesList] = useState<CountryData[]>([]);
  const [mccOptions, setMccOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATIC CURRENCY OPTIONS (As requested)
  const currencyOptions: Option[] = [
    { label: "AUD", value: "AUD" },
    { label: "NPR", value: "NPR" },
    { label: "INR", value: "INR" },
    { label: "ARD", value: "ARD" },
    { label: "EUR", value: "EUR" },
  ];

  // 1. Fetch Dropdown Data (Timezones & Countries only)
  useEffect(() => {
    if (isOpen) {
      // Timezones
      if (typeof getTimezoneApi === "function") {
        getTimezoneApi("timezone", 1, 1000).then((res: any) => {
          const list = res.results || (Array.isArray(res) ? res : []);
          setTimezoneOptions(
            list.map((t: any) => ({ label: t.name, value: String(t.id) }))
          );
        });
      }

      // Countries
      getCountriesApi("country", 1, 1000).then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        setFullCountriesList(list);
        setCountryOptions(
          list.map((c: any) => ({ label: c.name, value: String(c.id) }))
        );
      });
    }
  }, [isOpen]);

  // 2. Auto-MCC Logic
  useEffect(() => {
    if (formData.country) {
      const selectedCountry = fullCountriesList.find(
        (c) => String(c.id) === formData.country
      );

      if (selectedCountry && selectedCountry.MCC) {
        const mcc = selectedCountry.MCC;
        setMccOptions([{ label: `${mcc}`, value: mcc }]);

        // Auto-select if empty
        if (!formData.MCC) {
          setFormData((prev) => ({ ...prev, MCC: mcc }));
        }
      } else {
        setMccOptions([]);
      }
    } else {
      setMccOptions([]);
    }
  }, [formData.country, fullCountriesList]);

  // 3. Load Data for Edit
  useEffect(() => {
    if (isOpen && editingRate) {
      setFormData({
        ratePlan: editingRate.ratePlan,
        currencyCode: editingRate.currencyCode,
        timeZone: String(editingRate.timeZone || ""),
        country: String(editingRate.country || ""),
        MCC: String(editingRate.MCC || ""),
        rate: String(editingRate.rate || ""),
        remark: editingRate.remark || "",
      });
    } else if (isOpen) {
      setFormData({
        ratePlan: "",
        currencyCode: "",
        timeZone: "",
        country: "",
        MCC: "",
        rate: "",
        remark: "",
      });
    }
  }, [isOpen, editingRate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    // VALIDATION: Phase 1 (Create)
    if (!formData.ratePlan || !formData.currencyCode || !formData.timeZone) {
      toast.error("Rate Plan, Currency, and Timezone are required.");
      return;
    }

    // VALIDATION: Phase 2 (Edit/Details)
    if (editingRate) {
      if (!formData.country || !formData.rate || !formData.MCC) {
        toast.error("Country, MCC and Rate are required to save details.");
        return;
      }
    }

    setIsSubmitting(true);

    const payload: any = {
      ratePlan: formData.ratePlan,
      currencyCode: formData.currencyCode,
      timeZone: Number(formData.timeZone),
    };

    if (formData.country) payload.country = Number(formData.country);
    if (formData.MCC) payload.MCC = Number(formData.MCC);
    if (formData.rate) payload.rate = Number(formData.rate);
    if (formData.remark) payload.remark = formData.remark;

    try {
      if (editingRate) {
        await updateVendorRateApi(editingRate.id!, payload, moduleName);
        toast.success("Rate updated successfully!");
      } else {
        await createVendorRateApi(payload, moduleName);
        toast.success("Rate plan created! Add details now.");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save rate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const showDetails = !!editingRate || isViewMode;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isViewMode
          ? "View Vendor Rate"
          : editingRate
          ? "Edit Vendor Rate"
          : "Create Rate Plan"
      }
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Plan Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Rate Plan Name"
            name="ratePlan"
            value={formData.ratePlan}
            onChange={handleChange}
            placeholder="e.g., Premium Plan"
            required
            disabled={isViewMode}
          />
          <Select
            label="Currency Code"
            value={formData.currencyCode}
            onChange={(v) => handleSelect("currencyCode", v)}
            options={currencyOptions}
            placeholder="Select Currency"
            disabled={isViewMode}
          />
          <Select
            label="Timezone"
            value={formData.timeZone}
            onChange={(v) => handleSelect("timeZone", v)}
            options={timezoneOptions}
            placeholder="Select Timezone"
            disabled={isViewMode}
          />
        </div>

        {/* Step 2: Rate Details (Conditional) */}
        {showDetails ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Country"
                value={formData.country}
                onChange={(v) => handleSelect("country", v)}
                options={countryOptions}
                placeholder="Select Country"
                disabled={isViewMode}
              />
              <Select
                label="MCC"
                value={formData.MCC}
                onChange={(v) => handleSelect("MCC", v)}
                options={mccOptions}
                placeholder={
                  formData.country ? "Select MCC" : "Select Country First"
                }
                disabled={!formData.country || isViewMode}
              />
              <Input
                label="Rate"
                name="rate"
                type="number"
                step="0.0001"
                value={formData.rate}
                onChange={handleChange}
                placeholder="0.0000"
                required={!!editingRate}
                disabled={isViewMode}
              />
            </div>
            <TextArea
              label="Remark"
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              disabled={isViewMode}
              rows={2}
              placeholder="Optional remarks..."
            />
          </>
        ) : (
          <div className="text-sm text-text-secondary italic text-center p-2 rounded border border-dashed border-gray-200 dark:border-gray-700">
            You can add Country, Rate, and MCC details after creating the plan.
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingRate
                ? "Save Details"
                : "Create Plan"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
