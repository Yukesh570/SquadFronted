import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createCurrencyApi,
  updateCurrencyApi,
  type CurrencyData,
} from "../../../api/settingApi/currencyApi/currencyApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import Select from "../../ui/Select";
import ToggleSwitch from "../../ui/ToggleSwitch";

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingCurrency: CurrencyData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

// Curated list of common currency symbols
const symbolOptions: Option[] = [
  { label: "$ (Dollar)", value: "$" },
  { label: "€ (Euro)", value: "€" },
  { label: "£ (British Pound)", value: "£" },
  { label: "¥ (Japanese Yen / Chinese Yuan)", value: "¥" },
  { label: "₹ (Indian Rupee)", value: "₹" },
  { label: "₨ (Nepalese / Pakistani Rupee)", value: "₨" },
  { label: "A$ (Australian Dollar)", value: "A$" },
  { label: "C$ (Canadian Dollar)", value: "C$" },
  { label: "CHF (Swiss Franc)", value: "CHF" },
  { label: "kr (Krone / Krona)", value: "kr" },
  { label: "R (South African Rand)", value: "R" },
  { label: "₽ (Russian Ruble)", value: "₽" },
  { label: "₺ (Turkish Lira)", value: "₺" },
  { label: "د.إ (UAE Dirham)", value: "د.إ" },
  { label: "ر.س (Saudi Riyal)", value: "ر.س" },
  { label: "RM (Malaysian Ringgit)", value: "RM" },
  { label: "฿ (Thai Baht)", value: "฿" },
  { label: "₩ (Thai Baht / Korean Won)", value: "₩" },
];

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingCurrency,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    currencyCode: "",
    numericCode: "",
    symbol: "",
    decimalPlaces: "",
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingCurrency) {
        setFormData({
          name: editingCurrency.name || "",
          currencyCode: editingCurrency.currencyCode || "",
          numericCode: editingCurrency.numericCode || "",
          symbol: editingCurrency.symbol || "",
          decimalPlaces: editingCurrency.decimalPlaces !== undefined ? String(editingCurrency.decimalPlaces) : "",
          isActive: editingCurrency.isActive ?? true,
        });
      } else {
        setFormData({
          name: "",
          currencyCode: "",
          numericCode: "",
          symbol: "",
          decimalPlaces: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, editingCurrency]);

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

    if (!formData.name.trim() || !formData.currencyCode.trim()) {
      toast.error("Currency Name and Currency Code are required");
      return;
    }

    setIsSubmitting(true);

    const dataToSend = {
      name: formData.name,
      currencyCode: formData.currencyCode,
      numericCode: formData.numericCode,
      symbol: formData.symbol,
      decimalPlaces: formData.decimalPlaces ? Number(formData.decimalPlaces) : 0,
      isActive: formData.isActive,
    };

    try {
      if (editingCurrency) {
        await updateCurrencyApi(editingCurrency.id!, dataToSend, moduleName);
        toast.success("Currency updated successfully!");
      } else {
        await createCurrencyApi(dataToSend, moduleName);
        toast.success("Currency added successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving currency:", error);
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
        toast.error("Failed to save currency.");
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
          ? "View Currency"
          : editingCurrency
          ? "Edit Currency"
          : "Add Currency"
      }
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Currency Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. US Dollar"
            required
            disabled={isViewMode}
          />
          <Input
            label="Currency Code"
            name="currencyCode"
            value={formData.currencyCode}
            onChange={handleChange}
            placeholder="e.g. USD"
            required
            disabled={isViewMode}
          />
          <Input
            label="Numeric Code"
            name="numericCode"
            value={formData.numericCode}
            onChange={handleChange}
            placeholder="e.g. 840"
            disabled={isViewMode}
          />
          <Select
            label="Symbol"
            value={formData.symbol}
            onChange={(v) => handleSelect("symbol", v)}
            options={symbolOptions}
            placeholder="Select Symbol"
            disabled={isViewMode}
          />
          <Input
            label="Decimal Places"
            name="decimalPlaces"
            type="number"
            value={formData.decimalPlaces}
            onChange={handleChange}
            placeholder="e.g. 2"
            disabled={isViewMode}
          />
          <div className="flex items-center mt-6">
            <div className={isViewMode ? "pointer-events-none opacity-50" : ""}>
              <ToggleSwitch
                label="Is Active"
                checked={formData.isActive}
                onChange={(v) => handleToggle("isActive", v)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving"
                : editingCurrency
                ? "Save Changes"
                : "Add Currency"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};