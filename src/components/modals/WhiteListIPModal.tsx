import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Select from "../ui/Select";
import MultiEmailInput from "../ui/multiEmailInput";
import {
  createIpWhitelistApi,
  updateIpWhitelistApi,
  type IpWhitelistData,
} from "../../api/ipWhitelistApi/ipWhitelistApi";
import { getClientsApi } from "../../api/clientApi/clientApi";

interface IpWhitelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: IpWhitelistData | null;
  isViewMode?: boolean;
  fixedClient?: { id: number; name: string } | null;
}

interface Option {
  label: string;
  value: string;
}

const IpWhitelistModal: React.FC<IpWhitelistModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingData,
  isViewMode = false,
  fixedClient = null,
}) => {
  const [formData, setFormData] = useState({
    ip: "",
    client: "",
  });

  const [clientOptions, setClientOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Clients
  useEffect(() => {
    if (isOpen) {
      if (fixedClient) {
        setClientOptions([
          { label: fixedClient.name, value: String(fixedClient.id) },
        ]);
        setFormData((prev) => ({ ...prev, client: String(fixedClient.id) }));
      } else {
        const fetchClients = async () => {
          try {
            const res: any = await getClientsApi("client", 1, 1000);
            const list = res.results || (Array.isArray(res) ? res : []);
            setClientOptions(
              list.map((item: any) => ({
                label: item.name,
                value: String(item.id),
              })),
            );
          } catch (error) {
            console.error("Failed to load clients", error);
          }
        };
        fetchClients();
      }
    }
  }, [isOpen, fixedClient]);

  // Load Edit Data
  useEffect(() => {
    if (isOpen && editingData) {
      setFormData({
        ip: editingData.ip || "",
        client: String(editingData.client || ""),
      });
    } else if (isOpen && !editingData && !fixedClient) {
      setFormData({
        ip: "",
        client: "",
      });
    } else if (isOpen && fixedClient && !editingData) {
      setFormData((prev) => ({ ...prev, ip: "" }));
    }
  }, [isOpen, editingData, fixedClient]);

  // Removed unused handleChange function

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.ip) {
      toast.error("IP Address is required");
      return;
    }
    if (!formData.client) {
      toast.error("Client is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingData?.id) {
        const payload = {
          ip: formData.ip.trim(),
          client: Number(formData.client),
        };
        await updateIpWhitelistApi(editingData.id, payload, moduleName);
        toast.success("IP Whitelist updated successfully!");
      } else {
        const ipList = formData.ip
          .split(/[\n,]+/)
          .map((ip) => ip.trim())
          .filter((ip) => ip !== "");

        if (ipList.length === 0) {
          toast.error("No valid IP addresses found.");
          setIsSubmitting(false);
          return;
        }

        const promises = ipList.map((singleIp) =>
          createIpWhitelistApi(
            {
              ip: singleIp,
              client: Number(formData.client),
            },
            moduleName,
          ),
        );

        await Promise.all(promises);
        toast.success(`${ipList.length} IP(s) added successfully!`);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.ip?.[0] || "Failed to save IP Whitelist.";
      toast.error(msg);
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
          ? "View IP Whitelist"
          : editingData
            ? "Edit IP Whitelist"
            : "Add IP Whitelist"
      }
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Client"
            value={formData.client}
            onChange={(v) => handleSelect("client", v)}
            options={clientOptions}
            placeholder="Select Client"
            disabled={isViewMode || !!fixedClient}
          />
          <MultiEmailInput
            label="IP Address"
            name="ip"
            value={formData.ip}
            onChange={handleSelect}
            placeholder="IPv4 or IPv6 (press Enter or comma)"
            disabled={isViewMode}
          />
          {!editingData && !isViewMode && (
            <p className="-mt-3 text-xs text-gray-500">
              You can add multiple IPs by pressing Enter after each one.
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingData ? "Update" : "Add"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default IpWhitelistModal;