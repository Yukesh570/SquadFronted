import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateClientApi, getClientRateOverViewApi, type ClientData } from "../../api/clientApi/clientApi";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal";

interface Option { label: string; value: string; }

// --- Types for Warning Response ---
interface ExpensiveVendor {
  vendor_name: string;
  vendor_rate: number;
  customer_rate: number;
  margin: number;
}

interface WarningData {
  warning: string;
  expensive_vendors: ExpensiveVendor[];
}

interface ClientRoutingRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingClient: ClientData | null;
  routeGroupOptions: Option[];
  customerRateGroupOptions: Option[];
}

export const ClientRoutingRateModal: React.FC<ClientRoutingRateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingClient,
  routeGroupOptions,
  customerRateGroupOptions,
}) => {
  const [formData, setFormData] = useState({
    routeGroup: "",
    customerRateGroup: "", 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningData, setWarningData] = useState<WarningData | null>(null);

  useEffect(() => {
    if (isOpen && editingClient) {
      setFormData({
        routeGroup: editingClient.routeGroup != null ? String(editingClient.routeGroup) : "",
        customerRateGroup: editingClient.customerRateGroup != null ? String(editingClient.customerRateGroup) : "",
      });
      setWarningData(null); 
    }
  }, [isOpen, editingClient]);

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    setWarningData(null); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.id) return;

    if (!warningData) {
      setIsSubmitting(true);
      try {
        const routeGroupName = routeGroupOptions.find(o => o.value === formData.routeGroup)?.label || formData.routeGroup;
        const customerRateGroupName = customerRateGroupOptions.find(o => o.value === formData.customerRateGroup)?.label || formData.customerRateGroup;

        const overviewRes = await getClientRateOverViewApi({
          client: editingClient.id,
          routeGroup: routeGroupName || "", 
          customerRateGroup: customerRateGroupName || "",
        });

        if (overviewRes && overviewRes.warning) {
          setWarningData({
            warning: overviewRes.warning,
            expensive_vendors: overviewRes.expensive_vendors || [],
          }); 
          setIsSubmitting(false);
          return; 
        }
      } catch (error: any) {
        setIsSubmitting(false);
        const serverError = error.response?.data;
        if (serverError) {
          if (typeof serverError === "string") {
            toast.error(serverError);
          } else if (serverError.detail) {
            toast.error(serverError.detail);
          } else if (serverError.error) {
            toast.error(serverError.error);
          } else if (typeof serverError === "object") {
            Object.entries(serverError).forEach(([key, msgs]) => {
              toast.error(`${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
            });
          } else {
            toast.error("Error validating Route & Rate Plan.");
          }
        } else {
          toast.error("Error validating Route & Rate Plan.");
        }
        return; 
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        routeGroup: formData.routeGroup ? Number(formData.routeGroup) : null,
        customerRateGroup: formData.customerRateGroup ? Number(formData.customerRateGroup) : null,
      };

      await updateClientApi(editingClient.id, payload, moduleName);
      toast.success("Route & Rate Plan updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      const serverError = error.response?.data;
      if (serverError) {
        if (typeof serverError === "string") {
          toast.error(serverError);
        } else if (serverError.detail) {
          toast.error(serverError.detail);
        } else if (serverError.error) {
          toast.error(serverError.error);
        } else if (typeof serverError === "object") {
          Object.entries(serverError).forEach(([key, msgs]) => {
            toast.error(`${key}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
          });
        } else {
          toast.error("Failed to update Route & Rate Plan.");
        }
      } else {
        toast.error("Failed to update Route & Rate Plan.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = (!editingClient?.routeGroup && !editingClient?.customerRateGroup) 
    ? "Add Route & Rate Plan" 
    : "Edit Route & Rate Plan";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Select
            label="Route Group"
            value={formData.routeGroup}
            onChange={(v) => handleSelect("routeGroup", v)}
            options={routeGroupOptions}
            placeholder="Select Route Group"
          />
          <Select
            label="Customer Rate Group"
            value={formData.customerRateGroup}
            onChange={(v) => handleSelect("customerRateGroup", v)}
            options={customerRateGroupOptions}
            placeholder="Select Rate Group"
          />
        </div>

        {warningData && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-in fade-in zoom-in duration-300 space-y-3">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
              {warningData.warning}
            </p>
            
            {/* Vendor Details Table */}
            {warningData.expensive_vendors.length > 0 && (
              <div className="bg-white/60 dark:bg-black/20 rounded border border-yellow-200 dark:border-yellow-700/50 overflow-hidden">
                <table className="w-full text-left text-xs text-yellow-900 dark:text-yellow-200">
                  <thead className="bg-yellow-100/50 dark:bg-yellow-900/50 font-semibold border-b border-yellow-200 dark:border-yellow-700/50">
                    <tr>
                      <th className="px-3 py-2">Vendor</th>
                      <th className="px-3 py-2 text-right">Vendor Rate</th>
                      <th className="px-3 py-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-200/50 dark:divide-yellow-800/50">
                    {warningData.expensive_vendors.map((vendor, idx) => (
                      <tr key={idx} className="hover:bg-yellow-100/30 dark:hover:bg-yellow-900/40 transition-colors">
                        <td className="px-3 py-2 font-medium">{vendor.vendor_name}</td>
                        <td className="px-3 py-2 text-right font-mono">{vendor.vendor_rate}</td>
                        <td className="px-3 py-2 text-right font-mono text-red-600 dark:text-red-400">
                          {vendor.margin}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting || !formData.routeGroup || !formData.customerRateGroup}
            className={warningData ? "bg-yellow-600 hover:bg-yellow-700 text-white border-none" : ""}
          >
            {isSubmitting ? "Saving..." : warningData ? "Update Anyway" : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};