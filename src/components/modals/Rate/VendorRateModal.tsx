import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createVendorRateApi,
  updateVendorRateApi,
  type VendorRateData,
} from "../../../api/rateApi/vendorRateApi";
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
    timeZone: "",
    country: "",
    countryCode: "",
    network: "",
    MCC: "",
    MNC: "",
    rate: "",
    dateTime: "",
    remark: "",
  });

  const [timezoneOptions, setTimezoneOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [fullCountriesList, setFullCountriesList] = useState<CountryData[]>([]);
  const [mccOptions, setMccOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (typeof getTimezoneApi === "function") {
        getTimezoneApi("timezone", 1, 1000).then((res: any) => {
          const list = res.results || (Array.isArray(res) ? res : []);
          setTimezoneOptions(
            list.map((t: any) => ({ label: t.name, value: String(t.id) }))
          );
        });
      }

      getCountriesApi("country", 1, 1000).then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        setFullCountriesList(list);
        setCountryOptions(
          list.map((c: any) => ({ label: c.name, value: String(c.id) }))
        );
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.country) {
      const selectedCountry = fullCountriesList.find(
        (c) => String(c.id) === formData.country
      );

      if (selectedCountry && selectedCountry.MCC) {
        const mcc = selectedCountry.MCC;
        setMccOptions([{ label: `${mcc}`, value: mcc }]);
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

  useEffect(() => {
    if (isOpen && editingRate) {
      setFormData({
        ratePlan: editingRate.ratePlan || "",
        timeZone: editingRate.timeZone ? String(editingRate.timeZone) : "",
        country: editingRate.country ? String(editingRate.country) : "",
        countryCode: editingRate.countryCode
          ? String(editingRate.countryCode)
          : "",
        network: editingRate.network || "",
        MCC: editingRate.MCC ? String(editingRate.MCC) : "",
        MNC: editingRate.MNC ? String(editingRate.MNC) : "",
        rate: editingRate.rate ? String(editingRate.rate) : "",
        dateTime: editingRate.dateTime ? editingRate.dateTime.slice(0, 16) : "", // Format for input
        remark: editingRate.remark || "",
      });
    } else if (isOpen) {
      // Reset
      setFormData({
        ratePlan: "",
        timeZone: "",
        country: "",
        countryCode: "",
        network: "",
        MCC: "",
        MNC: "",
        rate: "",
        dateTime: "",
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

    if (!formData.ratePlan || !formData.timeZone) {
      toast.error("Rate Plan and Timezone are required.");
      return;
    }

    setIsSubmitting(true);

    const formattedDateTime = formData.dateTime
      ? new Date(formData.dateTime).toISOString()
      : null;

    const payload: any = {
      ratePlan: formData.ratePlan,
      timeZone: Number(formData.timeZone),
      country: formData.country ? Number(formData.country) : null,
      countryCode: formData.countryCode ? Number(formData.countryCode) : null,
      network: formData.network,
      MCC: formData.MCC ? Number(formData.MCC) : null,
      MNC: formData.MNC ? Number(formData.MNC) : null,
      rate: formData.rate ? Number(formData.rate) : null,
      dateTime: formattedDateTime,
      remark: formData.remark,
    };

    try {
      if (editingRate) {
        await updateVendorRateApi(editingRate.id!, payload, moduleName);
        toast.success("Vendor rate updated successfully!");
      } else {
        await createVendorRateApi(payload, moduleName);
        toast.success("Rate plan created!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.dateTime) {
        toast.error(`Date Error: ${error.response.data.dateTime[0]}`);
      } else {
        toast.error("Failed to save rate.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isCreateMode = !editingRate && !isViewMode;

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
      className={isCreateMode ? "max-w-xl" : "max-w-4xl"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`grid ${
            isCreateMode
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          } gap-5`}
        >
          <Input
            label="Rate Plan Name"
            name="ratePlan"
            value={formData.ratePlan}
            onChange={handleChange}
            placeholder="Premium Plan"
            required
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

          {!isCreateMode && (
            <>
              <Select
                label="Country"
                value={formData.country}
                onChange={(v) => handleSelect("country", v)}
                options={countryOptions}
                placeholder="Select Country"
                disabled={isViewMode}
              />
              <Input
                label="CountryCode"
                name="countryCode"
                type="number"
                value={formData.countryCode}
                onChange={handleChange}
                placeholder="977"
                disabled={isViewMode}
              />
              <Input
                label="Network"
                name="network"
                value={formData.network}
                onChange={handleChange}
                placeholder="NTC"
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
                label="MNC"
                name="MNC"
                type="number"
                value={formData.MNC}
                onChange={handleChange}
                placeholder="10"
                disabled={isViewMode}
              />
              <Input
                label="Rate"
                name="rate"
                type="number"
                step="0.0001"
                value={formData.rate}
                onChange={handleChange}
                placeholder="0.0000"
                disabled={isViewMode}
              />
              <Input
                label="DateTime"
                name="dateTime"
                type="datetime-local"
                value={formData.dateTime}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </>
          )}
        </div>

        <TextArea
          label="Remark"
          name="remark"
          value={formData.remark}
          onChange={handleChange}
          disabled={isViewMode}
          rows={2}
          placeholder="Optional remarks"
        />

        {isCreateMode && (
          <div className="text-sm text-text-secondary italic text-center p-2 rounded border border-dashed border-gray-200 dark:border-gray-700">
            You can add Country, Network, Rate, and MCC details after creating
            the plan.
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingRate
                ? "Update Rate"
                : "Create Plan"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
