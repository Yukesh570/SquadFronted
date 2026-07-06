import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Select from "../ui/Select";
import MultiEmailInput from "../ui/multiEmailInput";
import {
  createIpWhitelistApi,
  getIpWhitelistApi,
  type IpWhitelistData,
} from "../../api/ipWhitelistApi/ipWhitelistApi";

interface IpWhitelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingData: IpWhitelistData | null;
  isViewMode?: boolean;
  fixedClient?: { id: number; name: string } | null;
}

const IpWhitelistModal: React.FC<IpWhitelistModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  fixedClient = null,
}) => {
  const [formData, setFormData] = useState({
    access_type: "IP",
    ip: "",
    hostname: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRecords, setExistingRecords] = useState<IpWhitelistData[]>([]);
  const [showExisting, setShowExisting] = useState(false);
  const activeClientIdRef = useRef<number | null>(null);

  const fetchRecords = async () => {
    if (fixedClient) {
      const requestedClientId = fixedClient.id;
      activeClientIdRef.current = requestedClientId;
      try {
        const res = await getIpWhitelistApi("ipWhitelist", 1, 1000, {
          client: requestedClientId,
        });
        if (activeClientIdRef.current !== requestedClientId) return;
        const filtered = (res.results || []).filter(
          (r) => r.client === requestedClientId
        );
        setExistingRecords(filtered);
      } catch (e) {
        console.error("Failed to load existing access control records", e);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
      setShowExisting(false);
      if (fixedClient) {
        setFormData({
          access_type: "IP",
          ip: "",
          hostname: "",
        });
      }
    }
  }, [isOpen, fixedClient]);

  const handleSelect = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedClient) return;

    const isIp = formData.access_type === "IP";
    const rawValues = isIp ? formData.ip : formData.hostname;

    if (!rawValues.trim()) {
      toast.error(`Please provide at least one ${isIp ? "IP" : "Hostname"}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const list = rawValues
        .split(/[\n,]+/)
        .map((v) => v.trim())
        .filter((v) => v !== "");

      if (list.length === 0) {
        toast.error(`No valid ${isIp ? "IP" : "Hostname"} entries found.`);
        setIsSubmitting(false);
        return;
      }

      const promises = list.map((val) =>
        createIpWhitelistApi(
          {
            client: fixedClient.id,
            access_type: formData.access_type,
            [isIp ? "ip" : "hostname"]: val,
          },
          moduleName
        )
      );

      await Promise.all(promises);
      toast.success(
        `${list.length} ${isIp ? "IP(s)" : "Hostname(s)"} added successfully!`
      );

      setFormData((prev) => ({ ...prev, ip: "", hostname: "" }));
      fetchRecords();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.ip?.[0] ||
        error.response?.data?.hostname?.[0] ||
        "Failed to save Access Control list.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const existingIps = existingRecords
    .filter((r) => r.access_type === "IP")
    .map((r) => r.ip)
    .join(",");
  const existingHosts = existingRecords
    .filter((r) => r.access_type === "HOSTNAME" || r.access_type === "HOST")
    .map((r) => r.hostname)
    .join(",");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Access Control - ${fixedClient ? fixedClient.name : ""}`}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Access Type"
            value={formData.access_type}
            onChange={(v) => handleSelect("access_type", v)}
            options={[
              { label: "IP Address", value: "IP" },
              { label: "Hostname", value: "HOSTNAME" },
            ]}
          />

          {formData.access_type === "IP" && (
            <div>
              <MultiEmailInput
                label="IP Address"
                name="ip"
                value={formData.ip}
                onChange={handleSelect}
                placeholder="IPv4 or IPv6 (press Enter or comma)"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can add multiple IPs by pressing Enter after each one.
              </p>
            </div>
          )}

          {formData.access_type === "HOSTNAME" && (
            <div>
              <MultiEmailInput
                label="Hostname"
                name="hostname"
                value={formData.hostname}
                onChange={handleSelect}
                placeholder="Enter Hostname (press Enter or comma)"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can add multiple hostnames by pressing Enter after each one.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </div>
      </form>

      {/* Existing Records Section */}
      {existingRecords.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-primary">
              Existing Access Control Records
            </h3>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowExisting(!showExisting)}
            >
              {showExisting ? "Hide" : "View"}
            </Button>
          </div>

          {showExisting && (
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              {existingIps && (
                <MultiEmailInput
                  label="Saved IPs"
                  name="existingIps"
                  value={existingIps}
                  onChange={() => {}}
                  disabled={true}
                />
              )}
              {existingHosts && (
                <MultiEmailInput
                  label="Saved Hostnames"
                  name="existingHosts"
                  value={existingHosts}
                  onChange={() => {}}
                  disabled={true}
                />
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default IpWhitelistModal;