import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createCurrencyApi,
  updateCurrencyApi,
  type CurrencyData,
} from "../../../api/settingApi/currencyApi/currencyApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";

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
    country: "",
  });

  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCountriesApi("country", 1, 1000)
        .then((response: any) => {
          let data = [];
          if (response && response.results) {
            data = response.results;
          } else if (Array.isArray(response)) {
            data = response;
          }

          const options = data.map((c: any) => ({
            label: c.name,
            value: String(c.id),
          }));
          setCountryOptions(options);
        })
        .catch((err) => console.error("Failed to load countries", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingCurrency) {
        setFormData({
          name: editingCurrency.name,
          country: String(editingCurrency.country || ""),
        });
      } else {
        setFormData({ name: "", country: "" });
      }
    }
  }, [isOpen, editingCurrency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (value: string) => {
    setFormData({ ...formData, country: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name.trim()) {
      toast.error("Currency Name is required");
      return;
    }
    if (!formData.country) {
      toast.error("Please select a Country");
      return;
    }

    setIsSubmitting(true);

    const dataToSend = {
      name: formData.name,
      country: Number(formData.country),
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
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Currency Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., US Dollar"
          required
          disabled={isViewMode}
        />

        <Select
          label="Country"
          value={formData.country}
          onChange={handleCountryChange}
          options={[...countryOptions]}
          placeholder="Select Country"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
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
