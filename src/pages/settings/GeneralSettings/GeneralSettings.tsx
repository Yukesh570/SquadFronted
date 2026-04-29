import React, { useState, useEffect, useRef } from "react";
import { Home, Save } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getGeneralSettingsApi,
  putGeneralSettingsApi,
  type GeneralSettingsData,
} from "../../../api/settingApi/generalSettingsApi/generalSettingsApi";
// @ts-ignore
import { getCurrenciesApi } from "../../../api/settingApi/currencyApi/currencyApi";
// @ts-ignore
import { getTimezoneApi } from "../../../api/settingApi/timezoneApi/timezoneApi";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { usePagePermissions } from "../../../hooks/usePagePermissions";
import { actionHelper } from "../../../helper/action";

interface Option {
  label: string;
  value: string;
}

const languageOptions: Option[] = [
  { label: "English (EN)", value: "en" },
  { label: "Spanish (ES)", value: "es" },
  { label: "French (FR)", value: "fr" },
  { label: "Nepali (NE)", value: "ne" },
];

const GeneralSettings: React.FC = () => {
  const { canUpdate } = usePagePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currencyOptions, setCurrencyOptions] = useState<Option[]>([]);
  const [timezoneOptions, setTimezoneOptions] = useState<Option[]>([]);

  const [formData, setFormData] = useState<GeneralSettingsData>({
    companyName: "",
    defaultLanguage: "en",
    defaultTimezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    datetimeFormat: "YYYY-MM-DD HH:mm:ss",
    baseCurrency: "USD",
  });

  const location = useLocation();
  const routeName = location.pathname.split("/").pop() || "generalSettings";
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll("aside a.active, nav a.active");
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel = activeItem?.innerText?.split("\n")[0].trim() || "Module";
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  useEffect(() => {
    getCurrenciesApi("currency", 1, 1000)
      .then((res: any) => {
        const rawData = res?.results || res?.data?.results || res?.data || res;
        const list = Array.isArray(rawData) ? rawData : [];
        setCurrencyOptions(
          list.map((c: any) => ({
            label: `${c.name || "Unknown"} (${c.currencyCode || "N/A"})`,
            value: String(c.currencyCode || ""),
          }))
        );
      })
      .catch(console.error);

    getTimezoneApi("timezone", 1, 1000)
      .then((res: any) => {
        const rawData = res?.results || res?.data?.results || res?.data || res;
        const list = Array.isArray(rawData) ? rawData : [];
        setTimezoneOptions(
          list.map((t: any) => ({
            label: t.name || "Unknown Timezone",
            value: String(t.name || ""), 
          }))
        );
      })
      .catch(console.error);
  }, []);

  const fetchSettings = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;
    setIsLoading(true);

    try {
      const response = await getGeneralSettingsApi(routeName);
      if (newController.signal.aborted) return;
      
      if (response) {
        setFormData({
          companyName: response.companyName || "",
          defaultLanguage: response.defaultLanguage || "en",
          defaultTimezone: response.defaultTimezone || "UTC",
          dateFormat: response.dateFormat || "YYYY-MM-DD",
          datetimeFormat: response.datetimeFormat || "YYYY-MM-DD HH:mm:ss",
          baseCurrency: response.baseCurrency || "USD",
        });
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast.error("Failed to fetch settings.");
      }
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [routeName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) {
      toast.error("Permission denied.");
      return;
    }

    setIsSubmitting(true);
    try {
      await putGeneralSettingsApi(formData, routeName);
      toast.success("Settings updated successfully!");
    } catch (error: any) {
      toast.error("Update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          General Settings
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Settings</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-card dark:bg-gray-800">
        {isLoading ? (
          <div className="p-10 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading Configuration...</p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. Squad SMS"
              required
            />

            <Select
              label="Base Currency"
              value={formData.baseCurrency}
              onChange={(v) => handleSelectChange("baseCurrency", v)}
              options={currencyOptions}
              placeholder="Select System Currency"
            />

            <hr className="dark:border-gray-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Default Language"
                value={formData.defaultLanguage}
                onChange={(v) => handleSelectChange("defaultLanguage", v)}
                options={languageOptions}
                placeholder="Language"
              />
              <Select
                label="Default Timezone"
                value={formData.defaultTimezone}
                onChange={(v) => handleSelectChange("defaultTimezone", v)}
                options={timezoneOptions}
                placeholder="Timezone"
              />
            </div>

            <hr className="dark:border-gray-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Date Format"
                name="dateFormat"
                value={formData.dateFormat}
                onChange={handleChange}
                placeholder="YYYY-MM-DD"
                required
              />
              <Input
                label="Date Time Format"
                name="datetimeFormat"
                value={formData.datetimeFormat}
                onChange={handleChange}
                placeholder="YYYY-MM-DD HH:mm:ss"
                required
              />
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={fetchSettings}
                disabled={isSubmitting}
                className="py-3 px-6"
              >
                Discard
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full md:w-auto text-lg py-3 px-8"
                leftIcon={<Save size={20} />}
                disabled={isSubmitting || !canUpdate}
              >
                {isSubmitting ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GeneralSettings;