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

interface CurrencyExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingRate: CurrencyExchangeRateData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
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
  const [formData, setFormData] = useState({
    baseCurrency: "",
    targetCurrency: "",
    exchangeRate: "",
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  
  const [currencyOptions, setCurrencyOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (isOpen) {
      setIsFetchingOptions(true);
      getCurrenciesApi("currency", 1, 1000)
        .then((res: any) => {
          let list = res.results || (Array.isArray(res) ? res : []);
          
          setCurrencyOptions(
            list.map((c: any) => ({
              label: `${c.name} (${c.currencyCode})`,
              value: c.currencyCode,
            }))
          );
        })
        .catch((err: any) => {
          console.error("Failed to load currency options", err);
          toast.error("Could not load currency options.");
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
          isActive: editingRate.isActive ?? true,
        });
      } else {
        setFormData({
          baseCurrency: "",
          targetCurrency: "",
          exchangeRate: "",
          isActive: true, 
        });
      }
    }
  }, [isOpen, editingRate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.baseCurrency) {
      toast.error("Base Currency is required");
      return;
    }
    if (!formData.targetCurrency) {
      toast.error("Target Currency is required");
      return;
    }
    
    // We only require exchange rate when editing, since adding handles it via backend fetch
    if (editingRate && !formData.exchangeRate.trim()) {
      toast.error("Exchange Rate is required");
      return;
    }

    if (!editingRate && formData.baseCurrency === formData.targetCurrency) {
      toast.error("Base and Target currency cannot be the same.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingRate?.id) {
        // ⚡️ EDIT MODE: Standard Patch Update
        const payload = {
          baseCurrency: formData.baseCurrency.trim(),
          targetCurrency: formData.targetCurrency.trim(),
          exchangeRate: formData.exchangeRate.trim(),
          isActive: formData.isActive, 
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
        // ⚡️ ADD MODE: Directly hit the Fetch API instead of POST
        const response = await fetchExchangeRatesApi(
          formData.baseCurrency,
          [formData.targetCurrency]
        );
        
        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
           const fetchedRate = response.data[0].exchangeRate;
           // Display the fetched rate dynamically in the toast
           toast.success(`Rate added! 1 ${formData.baseCurrency} = ${fetchedRate} ${formData.targetCurrency}`);
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <Select
          label="Base Currency"
          value={formData.baseCurrency}
          onChange={(v) => handleSelect("baseCurrency", v)}
          options={currencyOptions}
          placeholder="Select Base Currency"
          disabled={isViewMode || isFetchingOptions}
        />
        <Select
          label="Target Currency"
          value={formData.targetCurrency}
          onChange={(v) => handleSelect("targetCurrency", v)}
          options={currencyOptions}
          placeholder="Select Target Currency"
          disabled={isViewMode || isFetchingOptions}
        />
        
        {/* ⚡️ FIX: Exchange Rate Input is COMPLETELY removed when adding a new rate */}
        {editingRate && (
          <Input
            label="Exchange Rate"
            name="exchangeRate"
            type="number"
            step="0.0001"
            value={formData.exchangeRate}
            onChange={handleChange}
            required
            disabled={isViewMode} 
          />
        )}

        {editingRate && (
          <div className={isViewMode ? "pointer-events-none opacity-50" : ""}>
            <ToggleSwitch
              label="Is Active"
              checked={formData.isActive}
              onChange={(v) => handleToggle("isActive", v)}
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