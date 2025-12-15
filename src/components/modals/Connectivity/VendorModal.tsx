import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  createVendorApi,
  updateVendorApi,
  type VendorData,
} from "../../../api/connectivityApi/vendorApi";
import {
  createSmppApi,
  updateSmppApi,
  getSmppByIdApi,
} from "../../../api/connectivityApi/smppApi";
import { getCompaniesApi } from "../../../api/companyApi/companyApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Modal from "../../ui/Modal";
import { Eye, EyeOff } from "lucide-react";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingVendor: VendorData | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingVendor,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    company: "",
    profileName: "",
    connectionType: "SMPP",
    smppId: 0,
    smppHost: "",
    smppPort: "",
    systemID: "",
    password: "",
    bindMode: "TRANSMITTER",
    sourceTON: "",
    sourceNPI: "",
    destTON: "",
    destNPI: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const connectionTypeOptions = [
    { label: "SMPP", value: "SMPP" },
    { label: "HTTP", value: "HTTP" },
  ];

  const bindModeOptions = [
    { label: "Transmitter", value: "TRANSMITTER" },
    { label: "Receiver", value: "RECEIVER" },
    { label: "Transceiver", value: "TRANSCEIVER" },
  ];

  useEffect(() => {
    if (isOpen) {
      getCompaniesApi("company", 1, 1000)
        .then((res: any) => {
          let list = [];
          if (res && res.results) list = res.results;
          else if (Array.isArray(res)) list = res;

          setCompanyOptions(
            list.map((c: any) => ({ label: c.name, value: String(c.id) }))
          );
        })
        .catch((err) => console.error("Failed to load companies", err));
    }
  }, [isOpen]);

  useEffect(() => {
    const loadData = async () => {
      if (isOpen && editingVendor) {
        const anyVendor = editingVendor as any;

        const initialData = {
          company: editingVendor.company ? String(editingVendor.company) : "",
          profileName: editingVendor.profileName,
          connectionType: editingVendor.connectionType || "",
          smppId: anyVendor.smpp || 0,
          smppHost: "",
          smppPort: "",
          systemID: "",
          password: "",
          bindMode: "TRANSMITTER",
          sourceTON: "",
          sourceNPI: "",
          destTON: "",
          destNPI: "",
        };

        setFormData(initialData);

        // 2. Fetch fresh SMPP details if ID exists and type is SMPP
        if (anyVendor.connectionType === "SMPP" && anyVendor.smpp) {
          setIsLoadingDetails(true);
          try {
            const smppData = await getSmppByIdApi(anyVendor.smpp, "smpp");

            setFormData((prev) => ({
              ...prev,
              smppHost: smppData.smppHost || "",
              smppPort: String(smppData.smppPort) || "",
              systemID: smppData.systemID || "",
              password: smppData.password || "",
              bindMode: smppData.bindMode || "TRANSMITTER",
              sourceTON: String(smppData.sourceTON || ""),
              sourceNPI: String(smppData.sourceNPI || ""),
              destTON: String(smppData.destTON || ""),
              destNPI: String(smppData.destNPI || ""),
            }));
          } catch (error) {
            console.error("Failed to load SMPP details", error);
            toast.error("Could not load SMPP configuration details.");
          } finally {
            setIsLoadingDetails(false);
          }
        }
      } else if (isOpen) {
        setFormData({
          company: "",
          profileName: "",
          connectionType: "",
          smppId: 0,
          smppHost: "",
          smppPort: "",
          systemID: "",
          password: "",
          bindMode: "TRANSMITTER",
          sourceTON: "",
          sourceNPI: "",
          destTON: "",
          destNPI: "",
        });
      }
    };

    loadData();
  }, [isOpen, editingVendor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.company || !formData.profileName) {
      toast.error("Company and Profile Name are required.");
      return;
    }

    if (formData.connectionType === "SMPP") {
      if (!formData.smppHost || !formData.systemID || !formData.smppPort) {
        toast.error("Host, Port, and System ID are required for SMPP.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let createdSmppId = formData.smppId;

      // --- STEP 1: Handle SMPP Creation ---
      if (formData.connectionType === "SMPP") {
        const smppPayload = {
          smppHost: formData.smppHost,
          smppPort: Number(formData.smppPort),
          systemID: formData.systemID,
          password: formData.password,
          bindMode: formData.bindMode,
          sourceTON: Number(formData.sourceTON),
          sourceNPI: Number(formData.sourceNPI),
          destTON: Number(formData.destTON),
          destNPI: Number(formData.destNPI),
        };

        if (editingVendor && createdSmppId) {
          await updateSmppApi(createdSmppId, smppPayload, "smpp");
        } else {
          const smppResponse = await createSmppApi(smppPayload, "smpp");
          if (smppResponse && smppResponse.id) {
            createdSmppId = smppResponse.id;
          } else {
            throw new Error("Failed to create SMPP configuration.");
          }
        }
      }

      const finalSmppValue =
        formData.connectionType === "SMPP" && createdSmppId
          ? createdSmppId
          : null;

      const vendorPayload = {
        company: Number(formData.company),
        profileName: formData.profileName,
        connectionType: formData.connectionType,
        smpp: finalSmppValue,
      };

      if (editingVendor) {
        await updateVendorApi(editingVendor.id!, vendorPayload, moduleName);
        toast.success("Vendor updated successfully!");
      } else {
        await createVendorApi(vendorPayload, moduleName);
        toast.success("Vendor added successfully!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to save vendor.");
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
          ? "View Vendor"
          : editingVendor
          ? "Edit Vendor"
          : "Add Vendor"
      }
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {isLoadingDetails && (
          <div className="p-3 mb-2 text-sm text-blue-800 bg-blue-50 rounded border border-blue-200 flex items-center">
            <span className="mr-2 animate-spin">⏳</span> Loading configuration
            details...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Company Name"
            value={formData.company}
            onChange={(v) => handleSelect("company", v)}
            options={companyOptions}
            placeholder="Select Company"
            disabled={isViewMode}
          />

          <Input
            label="Profile Name"
            name="profileName"
            value={formData.profileName}
            onChange={handleChange}
            placeholder="Vendor A"
            required
            disabled={isViewMode}
          />
        </div>

        <Select
          label="Connection Type"
          value={formData.connectionType}
          onChange={(v) => handleSelect("connectionType", v)}
          options={connectionTypeOptions}
          placeholder="Select Type"
          disabled={isViewMode}
        />

        {formData.connectionType === "SMPP" && (
          <div
            className={`border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 space-y-4 ${
              isLoadingDetails ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <h3 className="text-sm font-semibold text-text-primary dark:text-white">
              SMPP Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SMPP Host"
                name="smppHost"
                value={formData.smppHost}
                onChange={handleChange}
                placeholder="smpp.host.com"
                required
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="SMPP Port"
                name="smppPort"
                type="number"
                value={formData.smppPort}
                onChange={handleChange}
                placeholder="2775"
                required
                disabled={isViewMode || isLoadingDetails}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="System ID"
                name="systemID"
                value={formData.systemID}
                onChange={handleChange}
                placeholder="User ID"
                required
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Secret"
                disabled={isViewMode || isLoadingDetails}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <Select
                label="Bind Mode"
                value={formData.bindMode}
                onChange={(v) => handleSelect("bindMode", v)}
                options={bindModeOptions}
                placeholder="Select Mode"
                disabled={isViewMode || isLoadingDetails}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <Input
                label="Source TON"
                name="sourceTON"
                type="number"
                value={formData.sourceTON}
                onChange={handleChange}
                placeholder="1"
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="Source NPI"
                name="sourceNPI"
                type="number"
                value={formData.sourceNPI}
                onChange={handleChange}
                placeholder="1"
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="Dest TON"
                name="destTON"
                type="number"
                value={formData.destTON}
                onChange={handleChange}
                placeholder="1"
                disabled={isViewMode || isLoadingDetails}
              />
              <Input
                label="Dest NPI"
                name="destNPI"
                type="number"
                value={formData.destNPI}
                onChange={handleChange}
                placeholder="1"
                disabled={isViewMode || isLoadingDetails}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isLoadingDetails}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
