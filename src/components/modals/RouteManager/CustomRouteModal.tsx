import React, { useState, useEffect } from "react";
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
import { getOperatorsApi } from "../../../api/operatorApi/operatorApi";
import { getVendorsApi } from "../../../api/connectivityApi/vendorApi";

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
    operator: 0,
    terminatingCompany: 0,
    terminatingVendor: 0,
  });

  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<Option[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

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
          const [companies, clients, countries, operators, vendors] =
            await Promise.all([
              getCompaniesApi("company", 1, 1000),
              getClientsApi("client", 1, 1000),
              getCountriesApi("country", 1, 1000),
              getOperatorsApi("operator", 1, 1000),
              getVendorsApi("vendor", 1, 1000),
            ]);

          setCompanyOptions(extractOptions(companies, "name"));
          setClientOptions(extractOptions(clients, "name"));
          setCountryOptions(extractOptions(countries, "name"));
          setOperatorOptions(extractOptions(operators, "name"));
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
    const isNumericField = !["priority", "status"].includes(name);

    setFormData((prev: any) => ({
      ...prev,
      [name]: isNumericField ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    // ✅ STRICT VALIDATION for ALL Dropdowns
    if (!formData.name) {
      toast.error("Name is required.");
      return;
    }
    // Added validation for Originating Company
    if (!formData.orginatingCompany || formData.orginatingCompany === 0) {
      toast.error("Originating Company is required.");
      return;
    }
    if (!formData.orginatingClient || formData.orginatingClient === 0) {
      toast.error("Originating Client is required.");
      return;
    }
    if (!formData.country || formData.country === 0) {
      toast.error("Country is required.");
      return;
    }
    if (!formData.operator || formData.operator === 0) {
      toast.error("Operator is required.");
      return;
    }
    // Added validation for Terminating Company
    if (!formData.terminatingCompany || formData.terminatingCompany === 0) {
      toast.error("Terminating Company is required.");
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

    try {
      if (editingRoute?.id) {
        await updateCustomRouteApi(editingRoute.id, formData, moduleName);
        toast.success("Route updated successfully!");
      } else {
        await createCustomRouteApi(formData, moduleName);
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
              label="Originating Company"
              value={
                formData.orginatingCompany
                  ? String(formData.orginatingCompany)
                  : ""
              }
              onChange={(v) => handleSelectChange("orginatingCompany", v)}
              options={companyOptions}
              placeholder="Select Company"
              disabled={isViewMode || isFetchingOptions}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Country"
              value={formData.country ? String(formData.country) : ""}
              onChange={(v) => handleSelectChange("country", v)}
              options={countryOptions}
              placeholder="Select Country"
              disabled={isViewMode || isFetchingOptions}
            />
            <Select
              label="Operator"
              value={formData.operator ? String(formData.operator) : ""}
              onChange={(v) => handleSelectChange("operator", v)}
              options={operatorOptions}
              placeholder="Select Operator"
              disabled={isViewMode || isFetchingOptions}
            />
          </div>
        </fieldset>

        {/* Vendor Info */}
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-semibold text-primary px-2">
            Vendor Info
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Terminating Company"
              value={
                formData.terminatingCompany
                  ? String(formData.terminatingCompany)
                  : ""
              }
              onChange={(v) => handleSelectChange("terminatingCompany", v)}
              options={companyOptions}
              placeholder="Select Company"
              disabled={isViewMode || isFetchingOptions}
            />
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
