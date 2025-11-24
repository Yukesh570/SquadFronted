import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createStateApi,
  updateStateApi,
  type StateData,
} from "../../../api/settingApi/stateApi/stateApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";

interface StateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingState: StateData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const StateModal: React.FC<StateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingState,
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
        .catch((err) => {
          console.error("Failed to load countries", err);
          // toast.error("Could not load countries");
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingState) {
        setFormData({
          name: editingState.name,
          country: String(editingState.country || ""),
        });
      } else {
        setFormData({ name: "", country: "" });
      }
    }
  }, [isOpen, editingState]);

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
      toast.error("State Name is required");
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
      if (editingState) {
        await updateStateApi(editingState.id!, dataToSend, moduleName);
        toast.success("State updated successfully!");
      } else {
        await createStateApi(dataToSend, moduleName);
        toast.success("State added successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving state:", error);
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
        toast.error("Failed to save state.");
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
        isViewMode ? "View State" : editingState ? "Edit State" : "Add State"
      }
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="State Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Bagmati"
          required
          disabled={isViewMode}
        />

        <Select
          label="Country"
          value={formData.country}
          onChange={handleCountryChange}
          options={[...countryOptions]}
          placeholder="Select Country"
          // Note: If you want to visually disable it in view mode:
          // You can wrap it in a div with pointer-events-none if Select doesn't support disabled
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingState
                ? "Save Changes"
                : "Add State"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
