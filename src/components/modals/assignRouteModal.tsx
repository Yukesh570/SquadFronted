import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getGroupedCustomRoutesApi } from "../../api/routeManagerApi/customRouteApi";
import { updateClientApi } from "../../api/clientApi/clientApi";

import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal"; // ⚡️ Imported your custom Modal

interface AssignRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: number | null;
  moduleName: string;
}

export const AssignRouteModal: React.FC<AssignRouteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  moduleName,
}) => {
  const [routes, setRoutes] = useState<{ label: string; value: string }[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedRoute("");
      fetchRoutes();
    }
  }, [isOpen]);

  const fetchRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      const response = await getGroupedCustomRoutesApi("customRoute", 1, 1000);
      const routeList =
        response.results || (Array.isArray(response) ? response : []);

      setRoutes(
        routeList.map((r: any) => ({
          label: r.routeGroup__name,
          value: String(r.id),
        })),
      );
    } catch (error) {
      toast.error("Failed to load custom routes.");
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ⚡️ Prevent page reload on form submit

    if (!selectedRoute) {
      toast.error("Please select a route.");
      return;
    }

    if (!clientId) {
      toast.error("Invalid Client ID.");
      return;
    }
    const payload = {
      routeGroup: selectedRoute,
    };
    setIsSubmitting(true);
    try {
      await updateClientApi(clientId, payload, moduleName);

      toast.success("Route assigned successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to assign route.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Custom Route"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Select
          label="Select Custom Route"
          options={routes}
          value={selectedRoute}
          onChange={setSelectedRoute}
          placeholder={
            isLoadingRoutes ? "Loading routes..." : "Choose a route..."
          }
        />

        {/* Action Buttons matching ModuleModal structure */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !selectedRoute}
          >
            {isSubmitting ? "Assigning..." : "Assign Route"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
