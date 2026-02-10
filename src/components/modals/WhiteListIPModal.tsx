import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
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
  // New Prop to lock the client
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

  // Load Clients (Only if not fixed, or to populate the label correctly)
  useEffect(() => {
    if (isOpen) {
      if (fixedClient) {
        // If client is locked, just set it directly
        setClientOptions([
          { label: fixedClient.name, value: String(fixedClient.id) },
        ]);
        setFormData((prev) => ({ ...prev, client: String(fixedClient.id) }));
      } else {
        // Otherwise fetch list
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
      // Reset only if not editing and no fixed client
      setFormData({
        ip: "",
        client: "",
      });
    } else if (isOpen && fixedClient && !editingData) {
      // Ensure IP is clear when opening for new IP on fixed client
      setFormData((prev) => ({ ...prev, ip: "" }));
    }
  }, [isOpen, editingData, fixedClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      const payload = {
        ip: formData.ip,
        client: Number(formData.client),
      };

      if (editingData?.id) {
        await updateIpWhitelistApi(editingData.id, payload, moduleName);
        toast.success("IP Whitelist updated successfully!");
      } else {
        await createIpWhitelistApi(payload, moduleName);
        toast.success("IP Whitelist created successfully!");
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
          <Input
            label="IP Address"
            name="ip"
            value={formData.ip}
            onChange={handleChange}
            placeholder="IPv4 or IPv6 (e.g. 192.168.1.1)"
            required
            disabled={isViewMode}
          />

          <Select
            label="Client"
            value={formData.client}
            onChange={(v) => handleSelect("client", v)}
            options={clientOptions}
            placeholder="Select Client"
            // DISABLE if fixedClient is passed
            disabled={isViewMode || !!fixedClient}
          />
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
