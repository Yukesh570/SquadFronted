import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  updateCurrencyExchangeRateApi,
  fetchExchangeRatesApi,
  type CurrencyExchangeRateData,
} from "../../../api/settingApi/currencyExchangeRateApi/currencyExchangeRateApi";
import { getCurrenciesApi } from "../../../api/settingApi/currencyApi/currencyApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import ToggleSwitch from "../../ui/ToggleSwitch";
import Select from "../../ui/Select";

import { getGeneralSettingsApi } from "../../../api/settingApi/generalSettingsApi/generalSettingsApi";

interface CurrencyExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingRate: CurrencyExchangeRateData | null;
  isViewMode?: boolean;
}

export const CurrencyExchangeRateModal: React.FC<
  CurrencyExchangeRateModalProps
> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingRate,
  isViewMode = false,
}) => {
    const [formData, setFormData] = useState<{
      baseCurrency: string;
      targetCurrency: string;
      exchangeRate: string;
      status: "ACTIVE" | "INACTIVE" | "EXPIRED";
    }>({
      baseCurrency: "",
      targetCurrency: "",
      exchangeRate: "",
      status: "ACTIVE",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingOptions, setIsFetchingOptions] = useState(false);
    const [currencyOptions, setCurrencyOptions] = useState<{ label: string, value: string }[]>([]);
    const [currencySymbols, setCurrencySymbols] = useState<Record<string, string>>({});

    useEffect(() => {
      if (isOpen) {
        setIsFetchingOptions(true);

        // Fetch both currencies and general settings in parallel
        Promise.all([
          getCurrenciesApi("currency", 1, 1000),
          getGeneralSettingsApi("generalSettings").catch(() => null)
        ])
          .then(([currenciesRes, settingsRes]: [any, any]) => {
            let list = currenciesRes.results || (Array.isArray(currenciesRes) ? currenciesRes : []);

            // Deduplicate the list by currencyCode to prevent duplicate React keys which break the search filter
            const uniqueCurrencies = new Map();
            list.forEach((c: any) => {
              if (!uniqueCurrencies.has(c.currencyCode)) {
                uniqueCurrencies.set(c.currencyCode, c);
              }
            });
            const uniqueList = Array.from(uniqueCurrencies.values());

            const symbolsMap: Record<string, string> = {};
            setCurrencyOptions(
              uniqueList.map((c: any) => {
                if (c.symbol) symbolsMap[c.currencyCode] = c.symbol;
                return {
                  label: `${c.name} (${c.currencyCode})`,
                  value: c.currencyCode,
                };
              })
            );
            setCurrencySymbols(symbolsMap);

            // Find the base currency from General Settings
            if (settingsRes && settingsRes.baseCurrency_code) {
              setFormData(prev => ({ ...prev, baseCurrency: settingsRes.baseCurrency_code }));
            }
          })
          .catch((err: any) => {
            console.error("Failed to load options", err);
            toast.error("Could not load form options.");
          })
          .finally(() => {
            setIsFetchingOptions(false);
          });

        if (editingRate) {
          setFormData({
            baseCurrency: editingRate.baseCurrency || "",
            targetCurrency: editingRate.targetCurrency || "",
            exchangeRate: editingRate.exchangeRate
              ? String(editingRate.exchangeRate)
              : "",
            status: editingRate.status || "ACTIVE",
          });
        } else {
          setFormData({
            baseCurrency: "",
            targetCurrency: "",
            exchangeRate: "",
            status: "ACTIVE",
          });
        }
      }
    }, [isOpen, editingRate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelect = (name: string, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [name]: value as string }));
    };

    const handleToggle = (name: string, value: boolean) => {
      if (name === "status") {
        setFormData({ ...formData, status: value ? "ACTIVE" : "INACTIVE" });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isViewMode) return;

      if (!formData.baseCurrency) {
        toast.error("Base Currency is required");
        return;
      }
      if (!formData.targetCurrency) {
        toast.error("Please select a target currency.");
        return;
      }

      if (!formData.exchangeRate.trim()) {
        toast.error("Exchange Rate is required");
        return;
      }

      if (!editingRate && formData.targetCurrency === formData.baseCurrency) {
        toast.error("Base and Target currency cannot be the same.");
        return;
      }

      setIsSubmitting(true);

      try {
        if (editingRate?.id) {
          const payload = {
            baseCurrency: formData.baseCurrency.trim(),
            source: "Manual",
            targetCurrency: formData.targetCurrency.trim(),
            exchangeRate: formData.exchangeRate.trim(),
            status: formData.status,
          };

          await updateCurrencyExchangeRateApi(
            editingRate.id,
            payload,
            moduleName,
          );
          toast.success("Exchange rate updated successfully!");
          onSuccess();
          onClose();

        } else {
          // ⚡️ ADD MODE: Send array of target currencies
          const response = await fetchExchangeRatesApi(
            formData.baseCurrency,
            [formData.targetCurrency], // API expects string[]
            formData.exchangeRate
          );

          if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            toast.success(`Successfully fetched and saved ${response.data.length} exchange rate(s) for ${formData.baseCurrency}.`);
            onSuccess();
            onClose();
          } else {
            toast.warning("Failed to retrieve valid rate data from server.");
          }
        }
      } catch (error: any) {
        console.error(error);
        const serverError = error.response?.data;
        if (serverError) {
          if (typeof serverError === "object") {
            Object.entries(serverError).forEach(([key, msgs]) => {
              toast.error(`${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
            });
          } else {
            toast.error(String(serverError));
          }
        } else {
          toast.error("Failed to save exchange rate.");
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
            ? "View Exchange Rate"
            : editingRate
              ? "Edit Exchange Rate"
              : "Add Exchange Rate"
        }
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5 overflow-visible">
          <Select
            label="Base Currency (From General Settings)"
            value={formData.baseCurrency}
            onChange={(v) => handleSelect("baseCurrency", v)}
            options={currencyOptions}
            placeholder="Loading Base Currency..."
            disabled={true}
          />

          <Select
            label="Target Currency"
            value={formData.targetCurrency}
            onChange={(v) => handleSelect("targetCurrency", v)}
            options={currencyOptions}
            placeholder="Select Target Currency"
            disabled={isViewMode || isFetchingOptions || !!editingRate}
          />

          <Input
            label="Exchange Rate"
            name="exchangeRate"
            type="number"
            step="0.0001"
            value={formData.exchangeRate}
            onChange={handleChange}
            required
            disabled={isViewMode}
            leftIcon={
              formData.targetCurrency && currencySymbols[formData.targetCurrency]
                ? <span className="font-semibold text-gray-500 dark:text-gray-400">{currencySymbols[formData.targetCurrency]}</span>
                : undefined
            }
          />

          {editingRate && (
            <div className={isViewMode ? "pointer-events-none opacity-50" : ""}>
              <ToggleSwitch
                label="Active"
                checked={formData.status === "ACTIVE"}
                onChange={(v) => handleToggle("status", v)}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={onClose}>
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <Button type="submit" variant="primary" disabled={isSubmitting || isFetchingOptions}>
                {isSubmitting
                  ? "Saving..."
                  : editingRate
                    ? "Save Changes"
                    : "Add Rate"}
              </Button>
            )}
          </div>
        </form>
      </Modal>
    );
  };