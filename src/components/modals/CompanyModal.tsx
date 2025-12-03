import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createCompanyApi,
  updateCompanyApi,
  type CompanyData,
} from "../../api/companyApi/companyApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { getStateApi } from "../../api/settingApi/stateApi/stateApi";
import { getCompanyCategoryApi } from "../../api/settingApi/companyCategoryApi/companyCategoryApi";
import { getCurrenciesApi } from "../../api/settingApi/currencyApi/currencyApi";
import { getEntityApi } from "../../api/settingApi/entityApi/entityApi";
import { getCompanyStatusApi } from "../../api/settingApi/companyStatusApi/companyStatusApi";
import { getTimezoneApi } from "../../api/settingApi/timezoneApi/timezoneApi";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import ToggleSwitch from "../ui/ToggleSwitch";
import TextArea from "../ui/TextArea";

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingCompany: CompanyData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingCompany,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    phone: "",
    companyEmail: "",
    supportEmail: "",
    billingEmail: "",
    ratesEmail: "",
    lowBalanceAlertEmail: "",
    country: "",
    state: "",
    category: "",
    status: "",
    currency: "",
    timeZone: "",
    customerCreditLimit: "",
    vendorCreditLimit: "",
    balanceAlertAmount: "",
    referenceNumber: "",
    businessEntity: "",
    vatNumber: "",
    address: "",
    validityPeriod: "LTD",
    defaultEmail: "CMP",
    onlinePayment: false,
    companyBlocked: false,
    allowWhiteListedCards: false,
    sendDailyReports: false,
    allowNetting: false,
    showHlrApi: false,
    enableVendorPanel: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [statuses, setStatuses] = useState<Option[]>([]);
  const [currencies, setCurrencies] = useState<Option[]>([]);
  const [timeZones, setTimeZones] = useState<Option[]>([]);
  const [entities, setEntities] = useState<Option[]>([]);

  useEffect(() => {
    if (isOpen) {
      const loadOptions = async (apiCall: any, module: string, setter: any) => {
        try {
          const res = await apiCall(module, 1, 1000);
          const list = res.results || (Array.isArray(res) ? res : []);
          setter(
            list.map((item: any) => ({
              label: item.name,
              value: String(item.id),
            }))
          );
        } catch (e) {
          console.error(`Failed to load ${module}`, e);
        }
      };

      loadOptions(getCountriesApi, "country", setCountries);
      loadOptions(getStateApi, "state", setStates);
      loadOptions(getCompanyCategoryApi, "companyCategory", setCategories);
      loadOptions(getCurrenciesApi, "currency", setCurrencies);
      loadOptions(getEntityApi, "entity", setEntities);
      if (typeof getCompanyStatusApi === "function")
        loadOptions(getCompanyStatusApi, "companyStatus", setStatuses);
      if (typeof getTimezoneApi === "function")
        loadOptions(getTimezoneApi, "timeZone", setTimeZones);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingCompany) {
      setFormData({
        name: editingCompany.name,
        shortName: editingCompany.shortName,
        phone: editingCompany.phone,
        companyEmail: editingCompany.companyEmail,
        supportEmail: editingCompany.supportEmail,
        billingEmail: editingCompany.billingEmail,
        ratesEmail: editingCompany.ratesEmail,
        lowBalanceAlertEmail: editingCompany.lowBalanceAlertEmail,

        country: String(editingCompany.country || ""),
        state: String(editingCompany.state || ""),
        category: String(editingCompany.category || ""),
        status: String(editingCompany.status || ""),
        currency: String(editingCompany.currency || ""),
        timeZone: String(editingCompany.timeZone || ""),
        businessEntity: String(editingCompany.businessEntity || ""),

        customerCreditLimit: String(editingCompany.customerCreditLimit || ""),
        vendorCreditLimit: String(editingCompany.vendorCreditLimit || ""),
        balanceAlertAmount: String(editingCompany.balanceAlertAmount || ""),
        referenceNumber: editingCompany.referencNumber || "",

        vatNumber: editingCompany.vatNumber,
        address: editingCompany.address,

        validityPeriod: editingCompany.validityPeriod || "LTD",
        defaultEmail: editingCompany.defaultEmail || "CMP",

        onlinePayment: editingCompany.onlinePayment,
        companyBlocked: editingCompany.companyBlocked,
        allowWhiteListedCards: editingCompany.allowWhiteListedCards,
        sendDailyReports: editingCompany.sendDailyReports,
        allowNetting: editingCompany.allowNetting,
        showHlrApi: editingCompany.showHlrApi,
        enableVendorPanel: editingCompany.enableVendorPanel,
      });
    } else if (isOpen) {
      setFormData({
        name: "",
        shortName: "",
        phone: "",
        companyEmail: "",
        supportEmail: "",
        billingEmail: "",
        ratesEmail: "",
        lowBalanceAlertEmail: "",
        country: "",
        state: "",
        category: "",
        status: "",
        currency: "",
        timeZone: "",
        customerCreditLimit: "",
        vendorCreditLimit: "",
        balanceAlertAmount: "",
        referenceNumber: "",
        businessEntity: "",
        vatNumber: "",
        address: "",
        validityPeriod: "LTD",
        defaultEmail: "CMP",
        onlinePayment: false,
        companyBlocked: false,
        allowWhiteListedCards: false,
        sendDailyReports: false,
        allowNetting: false,
        showHlrApi: false,
        enableVendorPanel: false,
      });
    }
  }, [isOpen, editingCompany]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleToggle = (name: string, value: boolean) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    setIsSubmitting(true);

    // FIX: Explicit type conversion for backend
    const payload = {
      ...formData,
      country: Number(formData.country) || null,
      state: Number(formData.state) || null,
      category: Number(formData.category) || null,
      status: Number(formData.status) || null,
      currency: Number(formData.currency) || null,
      timeZone: Number(formData.timeZone) || null,
      businessEntity: Number(formData.businessEntity) || null,

      referencNumber: formData.referenceNumber,
    };

    try {
      if (editingCompany) {
        await updateCompanyApi(editingCompany.id!, payload, moduleName);
        toast.success("Company updated successfully!");
      } else {
        await createCompanyApi(payload, moduleName);
        toast.success("Company created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const serverError = error.response?.data;
      if (serverError && typeof serverError === "object") {
        Object.entries(serverError).forEach(([key, msgs]) => {
          toast.error(`${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
        });
      } else {
        toast.error("Failed to save company.");
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
        isViewMode
          ? "View Company"
          : editingCompany
          ? "Edit Company"
          : "Add New Company"
      }
      className="max-w-6xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-[80vh] overflow-y-auto px-1"
      >
        {/* Identity & Contacts */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Identity & Contacts
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Company Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., ACME TECHNOLOGIES"
              required
              disabled={isViewMode}
            />
            <Input
              label="Short Name"
              name="shortName"
              value={formData.shortName}
              onChange={handleChange}
              placeholder="e.g., ACME"
              required
              disabled={isViewMode}
            />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., +977 9800000000"
              disabled={isViewMode}
            />
            <Input
              label="Company Email"
              name="companyEmail"
              type="email"
              value={formData.companyEmail}
              onChange={handleChange}
              placeholder="e.g., contact@acme.com"
              disabled={isViewMode}
            />
            <Input
              label="Support Email"
              name="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={handleChange}
              placeholder="e.g., support@acme.com"
              disabled={isViewMode}
            />
            <Input
              label="Billing Email"
              name="billingEmail"
              type="email"
              value={formData.billingEmail}
              onChange={handleChange}
              placeholder="e.g., billing@acme.com"
              disabled={isViewMode}
            />
            <Input
              label="Rates Email"
              name="ratesEmail"
              type="email"
              value={formData.ratesEmail}
              onChange={handleChange}
              placeholder="e.g., rates@acme.com"
              disabled={isViewMode}
            />
            <Input
              label="Low Balance Alert Email"
              name="lowBalanceAlertEmail"
              type="email"
              value={formData.lowBalanceAlertEmail}
              onChange={handleChange}
              placeholder="e.g., finance@acme.com"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Classification & Location */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Classification & Location
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Country Name"
              value={formData.country}
              onChange={(v) => handleSelect("country", v)}
              options={countries}
              placeholder="Select Country"
              disabled={isViewMode}
            />
            <Select
              label="State Name"
              value={formData.state}
              onChange={(v) => handleSelect("state", v)}
              options={states}
              placeholder="Select State"
              disabled={isViewMode}
            />
            <Select
              label="Company Category"
              value={formData.category}
              onChange={(v) => handleSelect("category", v)}
              options={categories}
              placeholder="Select Category"
              disabled={isViewMode}
            />
            <Select
              label="Company Status"
              value={formData.status}
              onChange={(v) => handleSelect("status", v)}
              options={statuses}
              placeholder="Select Status"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Finance & System */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Finance & System
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Currency"
              value={formData.currency}
              onChange={(v) => handleSelect("currency", v)}
              options={currencies}
              placeholder="Select Currency"
              disabled={isViewMode}
            />
            <Select
              label="Time Zone"
              value={formData.timeZone}
              onChange={(v) => handleSelect("timeZone", v)}
              options={timeZones}
              placeholder="Select Time Zone"
              disabled={isViewMode}
            />
            <Input
              label="Customer Credit Limit"
              name="customerCreditLimit"
              type="number"
              value={formData.customerCreditLimit}
              onChange={handleChange}
              placeholder="e.g., 5000.00"
              disabled={isViewMode}
            />
            <Input
              label="Vendor Credit Limit"
              name="vendorCreditLimit"
              type="number"
              value={formData.vendorCreditLimit}
              onChange={handleChange}
              placeholder="e.g., 10000.00"
              disabled={isViewMode}
            />
            <Input
              label="Balance Alert Amount"
              name="balanceAlertAmount"
              type="number"
              value={formData.balanceAlertAmount}
              onChange={handleChange}
              placeholder="e.g., 500.00"
              disabled={isViewMode}
            />
            <Input
              label="Reference Number"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleChange}
              placeholder="e.g., REF-2024-001"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Legal & Address */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Legal & Address
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="Business Entity"
              value={formData.businessEntity}
              onChange={(v) => handleSelect("businessEntity", v)}
              options={entities}
              placeholder="Select Entity Type"
              disabled={isViewMode}
            />
            <Input
              label="Vat Number"
              name="vatNumber"
              value={formData.vatNumber}
              onChange={handleChange}
              placeholder="e.g., VAT12345678"
              disabled={isViewMode}
            />
          </div>
        </fieldset>

        {/* Address */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Address
          </legend>
          <TextArea
            label="Full Address"
            name="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="e.g., Koteshwor, Kathmandu, Nepal"
            disabled={isViewMode}
          />
        </fieldset>

        {/* Policies */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Policies & Settings
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="Validity Period"
              value={formData.validityPeriod}
              onChange={(v) => handleSelect("validityPeriod", v)}
              options={[
                { label: "Limited", value: "LTD" },
                { label: "Unlimited", value: "UNL" },
              ]}
              placeholder="Select Validity Period"
              disabled={isViewMode}
            />
            <Select
              label="Default Email"
              value={formData.defaultEmail}
              onChange={(v) => handleSelect("defaultEmail", v)}
              options={[
                { label: "Company", value: "CMP" },
                { label: "Support", value: "SUP" },
              ]}
              placeholder="Select Default Email"
              disabled={isViewMode}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ToggleSwitch
              label="Online Payment"
              checked={formData.onlinePayment}
              onChange={(v) => handleToggle("onlinePayment", v)}
            />
            <ToggleSwitch
              label="Company Blocked"
              checked={formData.companyBlocked}
              onChange={(v) => handleToggle("companyBlocked", v)}
            />
            <ToggleSwitch
              label="Allow Whitelisted Cards"
              checked={formData.allowWhiteListedCards}
              onChange={(v) => handleToggle("allowWhiteListedCards", v)}
            />
            <ToggleSwitch
              label="Send Daily Reports"
              checked={formData.sendDailyReports}
              onChange={(v) => handleToggle("sendDailyReports", v)}
            />
            <ToggleSwitch
              label="Allow Netting"
              checked={formData.allowNetting}
              onChange={(v) => handleToggle("allowNetting", v)}
            />
            <ToggleSwitch
              label="Show HLR API"
              checked={formData.showHlrApi}
              onChange={(v) => handleToggle("showHlrApi", v)}
            />
            <ToggleSwitch
              label="Enable Vendor Panel"
              checked={formData.enableVendorPanel}
              onChange={(v) => handleToggle("enableVendorPanel", v)}
            />
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingCompany
                ? "Save Changes"
                : "Add Company"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
