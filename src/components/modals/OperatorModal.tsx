import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import {
  createOperatorApi,
  updateOperatorApi,
  type OperatorData,
} from "../../api/operatorApi/operatorApi";
// Import your existing Country API
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";

interface OperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingOperator: OperatorData | null;
  isViewMode?: boolean;
}

export const OperatorModal: React.FC<OperatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingOperator,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState<OperatorData>({
    name: "",
    country: 0,
    MNC: 0,
  });

  const [countryOptions, setCountryOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCountries, setIsFetchingCountries] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsFetchingCountries(true);

      getCountriesApi("country", 1, 1000)
        .then((response: any) => {
          let data = [];

          if (response && response.results) {
            data = response.results;
          } else if (Array.isArray(response)) {
            data = response;
          } else if (response && Array.isArray(response.data)) {
            data = response.data;
          }

          if (data.length > 0) {
            const options = data.map((c: any) => ({
              label: c.name,
              value: String(c.id),
            }));
            setCountryOptions(options);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch countries", err);
          toast.error("Could not load country list.");
        })
        .finally(() => setIsFetchingCountries(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingOperator) {
        setFormData(editingOperator);
      } else {
        setFormData({ name: "", country: 0, MNC: 0 });
      }
    }
  }, [isOpen, editingOperator]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "MNC" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name) {
      toast.error("Operator Name is required.");
      return;
    }
    if (!formData.country || formData.country === 0) {
      toast.error("Please select a valid country.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingOperator?.id) {
        await updateOperatorApi(editingOperator.id, formData, moduleName);
        toast.success("Operator updated successfully");
      } else {
        await createOperatorApi(formData, moduleName);
        toast.success("Operator created successfully");
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
        toast.error("Operation failed. Please try again.");
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
          ? "View Operator"
          : editingOperator
          ? "Edit Operator"
          : "Add Operator"
      }
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Operator Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter operator name"
          disabled={isViewMode}
          required
        />

        <Select
          label="Country"
          value={formData.country ? String(formData.country) : ""}
          onChange={(v) => handleSelectChange("country", v)}
          options={countryOptions}
          placeholder="Select a country"
          disabled={isViewMode || isFetchingCountries}
        />

        <Input
          label="MNC"
          name="MNC"
          type="number"
          value={formData.MNC}
          onChange={handleChange}
          placeholder="Enter MNC code"
          disabled={isViewMode}
          required
        />

        <div className="flex justify-end pt-2 gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving" : editingOperator ? "Update" : "Save"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
