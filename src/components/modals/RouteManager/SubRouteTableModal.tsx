import React, { useState, useEffect, useCallback } from "react";
import Modal from "../../ui/Modal";
import { DeleteModal } from "../DeleteModal";
import {
  deleteCustomRouteApi,
  getCustomRoutesApi,
  getRouteGroupCountriesApi,
  createRouteGroupCountryApi,
  deleteRouteGroupCountryApi,
  createCustomRouteApi,
  updateCustomRouteApi,
  type RouteGroupCountryData,
  type CustomRouteData,
} from "../../../api/routeManagerApi/customRouteApi";
import { getVendorsApi } from "../../../api/connectivityApi/vendorApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import { toast } from "react-toastify";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NewRow {
  _id: string;
  MCC: string;
  MNC: string;
  terminatingVendor: string;
  priority: string;
  trafficPercentage: string;
  status: string;
}

interface Section {
  config: RouteGroupCountryData;
  routes: CustomRouteData[];
  loading: boolean;
  newRows: NewRow[];
  isOpen: boolean;
  saving: boolean;
}

interface SubRouteTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeGroup: string | null;
  routeGroupId?: number | null;
  moduleName: string;
  canUpdate: boolean;
  canDelete: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const routingTypeOptions = [
  { label: "Priority", value: "PRIORITY" },
  { label: "Percentage", value: "PERCENTAGE" },
];
const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const emptyRow = (): NewRow => ({
  _id: String(Date.now() + Math.random()),
  MCC: "",
  MNC: "",
  terminatingVendor: "",
  priority: "",
  trafficPercentage: "",
  status: "ACTIVE",
});

const makeSections = (configs: RouteGroupCountryData[]): Section[] =>
  configs.map((cfg) => ({
    config: cfg,
    routes: [],
    loading: false,
    newRows: [],
    isOpen: false,
    saving: false,
  }));

// ── Component ─────────────────────────────────────────────────────────────────

export const SubRouteTableModal: React.FC<SubRouteTableModalProps> = ({
  isOpen,
  onClose,
  routeGroup,
  routeGroupId,
  moduleName,
  canUpdate,
  canDelete,
}) => {
  // ── Shared options ──────────────────────────────────────────────────────
  const [vendorOptions, setVendorOptions] = useState<{ label: string; value: string }[]>([]);
  const [countryOptions, setCountryOptions] = useState<{ label: string; value: string }[]>([]);

  // ── Country-config section ──────────────────────────────────────────────
  const [configSectionOpen, setConfigSectionOpen] = useState(false);
  const [newCountry, setNewCountry] = useState("");
  const [newRoutingType, setNewRoutingType] = useState("PRIORITY");
  const [newConfigStatus, setNewConfigStatus] = useState("ACTIVE");
  const [isAddingConfig, setIsAddingConfig] = useState(false);
  const [deleteConfigId, setDeleteConfigId] = useState<number | null>(null);

  // ── Per-country sections ────────────────────────────────────────────────
  const [sections, setSections] = useState<Section[]>([]);
  const [deleteRouteId, setDeleteRouteId] = useState<number | null>(null);
  const [deleteRouteCountry, setDeleteRouteCountry] = useState<string>("");

  // ── Fetch configs ───────────────────────────────────────────────────────
  const fetchConfigs = useCallback(async () => {
    if (!routeGroupId) return;
    try {
      const res = await getRouteGroupCountriesApi(moduleName, 1, 1000, {
        routeGroup: routeGroupId,
      });
      const results: RouteGroupCountryData[] = res.results || [];
      setSections((prev) => {
        // Merge: keep existing sections' routes/rows/isOpen, add new configs, remove stale
        const prevMap = new Map(prev.map((s) => [String(s.config.country), s]));
        return results.map((cfg) => {
          const existing = prevMap.get(String(cfg.country));
          return existing
            ? { ...existing, config: cfg }
            : {
                config: cfg,
                routes: [],
                loading: false,
                newRows: [],
                isOpen: false,
                saving: false,
              };
        });
      });
      if (results.length === 0) setConfigSectionOpen(true);
    } catch {
      toast.error("Failed to load country configurations.");
    }
  }, [routeGroupId, moduleName]);

  // ── Fetch routes for one section ────────────────────────────────────────
  const fetchSectionRoutes = useCallback(
    async (countryId: string) => {
      if (!routeGroup) return;
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId ? { ...s, loading: true } : s,
        ),
      );
      try {
        const res = await getCustomRoutesApi(moduleName, 1, 200, {
          routeGroup__name: routeGroup,
          country: countryId,
        });
        setSections((prev) =>
          prev.map((s) =>
            String(s.config.country) === countryId
              ? { ...s, routes: res.results || [], loading: false }
              : s,
          ),
        );
      } catch {
        toast.error("Failed to load routes.");
        setSections((prev) =>
          prev.map((s) =>
            String(s.config.country) === countryId ? { ...s, loading: false } : s,
          ),
        );
      }
    },
    [routeGroup, moduleName],
  );

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setSections([]);
      return;
    }
    fetchConfigs();
    getCountriesApi("country", 1, 1000)
      .then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        setCountryOptions(list.map((c: any) => ({ label: c.name, value: String(c.id) })));
      })
      .catch(() => {});
    getVendorsApi("vendor", 1, 1000)
      .then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        setVendorOptions(list.map((v: any) => ({ label: v.profileName || v.name, value: String(v.id) })));
      })
      .catch(() => {});
  }, [isOpen, routeGroupId]);

  // ── Toggle section open/closed ──────────────────────────────────────────
  const toggleSection = (countryId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (String(s.config.country) !== countryId) return s;
        if (!s.isOpen && s.routes.length === 0 && !s.loading) {
          // First open: fetch routes
          fetchSectionRoutes(countryId);
        }
        return { ...s, isOpen: !s.isOpen };
      }),
    );
  };

  // ── Config management ───────────────────────────────────────────────────
  const configuredIds = new Set(sections.map((s) => String(s.config.country)));
  const availableCountries = countryOptions.filter((o) => !configuredIds.has(o.value));

  const handleAddConfig = async () => {
    if (!newCountry) return toast.error("Select a country.");
    if (!routeGroupId) return toast.error("Route group not identified.");
    setIsAddingConfig(true);
    try {
      await createRouteGroupCountryApi(
        {
          routeGroup: routeGroupId,
          country: Number(newCountry),
          routingType: newRoutingType as "PRIORITY" | "PERCENTAGE",
          status: newConfigStatus as "ACTIVE" | "INACTIVE",
        },
        moduleName,
      );
      toast.success("Country added.");
      setNewCountry("");
      setNewRoutingType("PRIORITY");
      setNewConfigStatus("ACTIVE");
      fetchConfigs();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        Object.entries(data).forEach(([k, msgs]) =>
          toast.error(`${k}: ${Array.isArray(msgs) ? msgs[0] : String(msgs)}`),
        );
      } else {
        toast.error("Failed to add country.");
      }
    } finally {
      setIsAddingConfig(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!deleteConfigId) return;
    try {
      await deleteRouteGroupCountryApi(deleteConfigId, moduleName);
      toast.success("Country removed.");
      setDeleteConfigId(null);
      fetchConfigs();
    } catch {
      toast.error("Failed to remove country.");
    }
  };

  // ── Route delete ────────────────────────────────────────────────────────
  const handleDeleteRoute = async () => {
    if (!deleteRouteId) return;
    try {
      await deleteCustomRouteApi(deleteRouteId, moduleName);
      toast.success("Route deleted.");
      fetchSectionRoutes(deleteRouteCountry);
      setDeleteRouteId(null);
    } catch {
      toast.error("Failed to delete route.");
    }
  };

  // ── Status inline edit ──────────────────────────────────────────────────
  const handleStatusChange = async (countryId: string, routeId: number, newStatus: string) => {
    try {
      await updateCustomRouteApi(routeId, { status: newStatus }, moduleName);
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId
            ? {
                ...s,
                routes: s.routes.map((r) =>
                  r.id === routeId ? { ...r, status: newStatus as "ACTIVE" | "INACTIVE" } : r,
                ),
              }
            : s,
        ),
      );
    } catch {
      toast.error("Failed to update status.");
    }
  };

  // ── New row helpers ─────────────────────────────────────────────────────
  const addRow = (countryId: string) =>
    setSections((prev) =>
      prev.map((s) =>
        String(s.config.country) === countryId
          ? { ...s, newRows: [...s.newRows, emptyRow()] }
          : s,
      ),
    );

  const updateRow = (countryId: string, rowId: string, field: keyof NewRow, value: string) =>
    setSections((prev) =>
      prev.map((s) =>
        String(s.config.country) === countryId
          ? {
              ...s,
              newRows: s.newRows.map((r) => (r._id === rowId ? { ...r, [field]: value } : r)),
            }
          : s,
      ),
    );

  const removeRow = (countryId: string, rowId: string) =>
    setSections((prev) =>
      prev.map((s) =>
        String(s.config.country) === countryId
          ? { ...s, newRows: s.newRows.filter((r) => r._id !== rowId) }
          : s,
      ),
    );

  // ── Save new rows ───────────────────────────────────────────────────────
  const saveRows = async (countryId: string) => {
    const section = sections.find((s) => String(s.config.country) === countryId);
    if (!section || section.newRows.length === 0) return;

    const isPercentage = section.config.routingType === "PERCENTAGE";

    for (const row of section.newRows) {
      if (!row.MCC) return toast.error(`MCC required.`);
      if (!row.MNC) return toast.error(`MNC required.`);
      if (!row.terminatingVendor) return toast.error(`Vendor required.`);
      if (isPercentage && !row.trafficPercentage) return toast.error(`Traffic % required.`);
      if (!isPercentage && !row.priority) return toast.error(`Priority required.`);
    }

    if (isPercentage) {
      const existingTotal = section.routes
        .filter((r) => r.status === "ACTIVE")
        .reduce((s, r) => s + Number(r.trafficPercentage || 0), 0);
      const newTotal = section.newRows.reduce((s, r) => s + Number(r.trafficPercentage || 0), 0);
      if (existingTotal + newTotal !== 100) {
        toast.error(
          `Total must be 100%. Existing active: ${existingTotal}%, new: ${newTotal}% = ${existingTotal + newTotal}%.`,
        );
        return;
      }
    }

    setSections((prev) =>
      prev.map((s) => (String(s.config.country) === countryId ? { ...s, saving: true } : s)),
    );

    try {
      const payloads = section.newRows.map((row) => ({
        name: routeGroup,
        routeGroup: routeGroup,
        country: Number(countryId),
        MCC: row.MCC,
        MNC: row.MNC,
        terminatingVendor: Number(row.terminatingVendor),
        ...(isPercentage
          ? { trafficPercentage: Number(row.trafficPercentage) }
          : { priority: Number(row.priority) }),
        status: row.status,
      }));

      await createCustomRouteApi(payloads.length === 1 ? payloads[0] : payloads, moduleName);
      toast.success(`${payloads.length} route(s) saved.`);
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId ? { ...s, newRows: [], saving: false } : s,
        ),
      );
      fetchSectionRoutes(countryId);
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        Object.entries(data).forEach(([k, msgs]) =>
          toast.error(`${k}: ${Array.isArray(msgs) ? msgs[0] : String(msgs)}`),
        );
      } else {
        toast.error("Failed to save routes.");
      }
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId ? { ...s, saving: false } : s,
        ),
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Manage Route Group: ${routeGroup || ""}`}
        className="max-w-[95vw] w-full"
      >
        <div className="p-4 flex flex-col gap-4">

          {/* ── Country Config (collapsible) ─────────────────────────────── */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setConfigSectionOpen((o) => !o)}
            >
              <span className="flex items-center gap-2">
                Country Routing Configuration
                {sections.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {sections.length} configured
                  </span>
                )}
                {sections.length === 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-normal">
                    — Add a country to start
                  </span>
                )}
              </span>
              {configSectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {configSectionOpen && (
              <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
                {sections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sections.map((s) => (
                      <div
                        key={s.config.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${
                          s.config.routingType === "PERCENTAGE"
                            ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300"
                            : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
                        }`}
                      >
                        <span>{s.config.countryName}</span>
                        <span className="text-xs opacity-60">({s.config.routingType})</span>
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfigId(s.config.id!)}
                            className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-1">No countries configured yet.</p>
                )}

                {canUpdate && availableCountries.length > 0 && (
                  <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="w-44">
                      <Select label="Country" value={newCountry} onChange={setNewCountry} options={availableCountries} placeholder="Select Country" />
                    </div>
                    <div className="w-36">
                      <Select label="Routing Type" value={newRoutingType} onChange={setNewRoutingType} options={routingTypeOptions} />
                    </div>
                    <div className="w-32">
                      <Select label="Status" value={newConfigStatus} onChange={setNewConfigStatus} options={statusOptions} />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddConfig}
                      disabled={isAddingConfig || !newCountry}
                      leftIcon={<Plus size={14} />}
                      className="text-sm py-[9px] px-4 mb-[2px]"
                    >
                      {isAddingConfig ? "Adding…" : "Add"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Per-country sections ───────────────────────────────────────── */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[65vh]">
            {sections.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                No countries configured. Open <strong>Country Routing Configuration</strong> above to add one.
              </div>
            )}

            {sections.map((section) => {
              const countryId = String(section.config.country);
              const isPercentage = section.config.routingType === "PERCENTAGE";

              const existingActiveTotal = section.routes
                .filter((r) => r.status === "ACTIVE")
                .reduce((sum, r) => sum + Number(r.trafficPercentage || 0), 0);
              const newRowsTotal = section.newRows.reduce(
                (sum, r) => sum + Number(r.trafficPercentage || 0),
                0,
              );
              const grandTotal = existingActiveTotal + newRowsTotal;
              const totalValid = grandTotal === 100;

              return (
                <div
                  key={countryId}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Section header */}
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer select-none transition-colors ${
                      section.isOpen
                        ? "bg-gray-100 dark:bg-gray-700/60"
                        : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => toggleSection(countryId)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                        {section.config.countryName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isPercentage
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}
                      >
                        {isPercentage ? "Percentage" : "Priority"}
                      </span>
                      {section.routes.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {section.routes.length} route{section.routes.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {isPercentage && section.isOpen && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                            totalValid
                              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {totalValid ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {grandTotal}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {canUpdate && section.isOpen && (
                        <button
                          type="button"
                          onClick={() => addRow(countryId)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded px-2 py-1 transition-colors"
                        >
                          <Plus size={12} />
                          Add Route
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleSection(countryId)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {section.isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Section body */}
                  {section.isOpen && (
                    <div className="bg-white dark:bg-gray-900">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-separate border-spacing-0">
                          <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs text-gray-500 dark:text-gray-400">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold border-b border-r dark:border-gray-700 w-10">#</th>
                              <th className="px-3 py-2 text-left font-semibold border-b border-r dark:border-gray-700">MCC</th>
                              <th className="px-3 py-2 text-left font-semibold border-b border-r dark:border-gray-700">MNC</th>
                              <th className="px-3 py-2 text-left font-semibold border-b border-r dark:border-gray-700 min-w-[180px]">Terminating Vendor</th>
                              <th className="px-3 py-2 text-left font-semibold border-b border-r dark:border-gray-700 w-28">
                                {isPercentage ? "Traffic %" : "Priority"}
                              </th>
                              <th className="px-3 py-2 text-left font-semibold border-b border-r dark:border-gray-700 w-28">Vendor Rate</th>
                              <th className="px-3 py-2 text-left font-semibold border-b dark:border-gray-700 w-28">Status</th>
                              {(canUpdate || canDelete) && (
                                <th className="px-3 py-2 text-center font-semibold border-b border-l dark:border-gray-700 w-16">Action</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {section.loading && (
                              <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-gray-400 animate-pulse">
                                  Loading…
                                </td>
                              </tr>
                            )}

                            {/* Existing routes */}
                            {!section.loading &&
                              section.routes.map((route, i) => (
                                <tr
                                  key={route.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                  <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 text-gray-400 text-xs">{i + 1}</td>
                                  <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 font-mono text-xs text-gray-700 dark:text-gray-300">{route.MCC || "—"}</td>
                                  <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 font-mono text-xs text-gray-700 dark:text-gray-300">{route.MNC || "—"}</td>
                                  <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 text-gray-800 dark:text-gray-200">{route.terminatingVendorProfileName || "—"}</td>
                                  <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 text-center font-medium text-gray-700 dark:text-gray-300">
                                    {isPercentage ? (route.trafficPercentage != null ? `${route.trafficPercentage}%` : "—") : (route.priority ?? "—")}
                                  </td>
                                  <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 text-xs text-green-700 dark:text-green-400 font-mono">
                                    {(route as any).vendorRate ?? <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-3 py-2.5 border-b dark:border-gray-700">
                                    {canUpdate ? (
                                      <select
                                        value={route.status}
                                        onChange={(e) =>
                                          handleStatusChange(countryId, route.id!, e.target.value)
                                        }
                                        className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                                      >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                      </select>
                                    ) : (
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${route.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                                        {route.status}
                                      </span>
                                    )}
                                  </td>
                                  {(canUpdate || canDelete) && (
                                    <td className="px-3 py-2.5 border-b border-l dark:border-gray-700 text-center">
                                      {canDelete && (
                                        <button
                                          onClick={() => {
                                            setDeleteRouteId(route.id!);
                                            setDeleteRouteCountry(countryId);
                                          }}
                                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              ))}

                            {/* New (unsaved) rows */}
                            {section.newRows.map((row, i) => (
                              <tr key={row._id} className="bg-blue-50/70 dark:bg-blue-900/10 border-l-[3px] border-l-blue-400">
                                <td className="px-3 py-1.5 border-b border-r dark:border-gray-700 text-blue-400 text-xs">
                                  {section.routes.length + i + 1}
                                </td>
                                <td className="px-2 py-1.5 border-b border-r dark:border-gray-700">
                                  <input
                                    type="text"
                                    value={row.MCC}
                                    onChange={(e) => updateRow(countryId, row._id, "MCC", e.target.value)}
                                    placeholder="e.g. 520"
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-300"
                                  />
                                </td>
                                <td className="px-2 py-1.5 border-b border-r dark:border-gray-700">
                                  <input
                                    type="text"
                                    value={row.MNC}
                                    onChange={(e) => updateRow(countryId, row._id, "MNC", e.target.value)}
                                    placeholder="e.g. 66"
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-300"
                                  />
                                </td>
                                <td className="px-2 py-1.5 border-b border-r dark:border-gray-700 min-w-[160px]">
                                  <select
                                    value={row.terminatingVendor}
                                    onChange={(e) => updateRow(countryId, row._id, "terminatingVendor", e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="">Select vendor…</option>
                                    {vendorOptions.map((v) => (
                                      <option key={v.value} value={v.value}>{v.label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1.5 border-b border-r dark:border-gray-700">
                                  <input
                                    type="number"
                                    value={isPercentage ? row.trafficPercentage : row.priority}
                                    onChange={(e) =>
                                      updateRow(countryId, row._id, isPercentage ? "trafficPercentage" : "priority", e.target.value)
                                    }
                                    placeholder={isPercentage ? "0–100" : "1–5"}
                                    min={isPercentage ? 0 : 1}
                                    max={isPercentage ? 100 : 5}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-300"
                                  />
                                </td>
                                <td className="px-3 py-1.5 border-b border-r dark:border-gray-700 text-xs text-gray-400">—</td>
                                <td className="px-2 py-1.5 border-b dark:border-gray-700">
                                  <select
                                    value={row.status}
                                    onChange={(e) => updateRow(countryId, row._id, "status", e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                  </select>
                                </td>
                                {(canUpdate || canDelete) && (
                                  <td className="px-3 py-1.5 border-b border-l dark:border-gray-700 text-center">
                                    <button
                                      onClick={() => removeRow(countryId, row._id)}
                                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}

                            {/* Empty state */}
                            {!section.loading && section.routes.length === 0 && section.newRows.length === 0 && (
                              <tr>
                                <td colSpan={8} className="px-4 py-5 text-center text-gray-400 dark:text-gray-500 text-xs">
                                  No routes yet.{canUpdate && " Click \"Add Route\" to create one."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Save footer */}
                      {section.newRows.length > 0 && canUpdate && (
                        <div className="flex justify-end px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => saveRows(countryId)}
                            disabled={section.saving}
                            leftIcon={<Save size={13} />}
                            className="text-xs py-1.5 px-3"
                          >
                            {section.saving
                              ? "Saving…"
                              : `Save ${section.newRows.length} New Row${section.newRows.length > 1 ? "s" : ""}`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <DeleteModal
        isOpen={!!deleteRouteId}
        onClose={() => setDeleteRouteId(null)}
        onConfirm={handleDeleteRoute}
        title="Delete Route"
        message="Are you sure you want to delete this route? This action cannot be undone."
      />

      <DeleteModal
        isOpen={!!deleteConfigId}
        onClose={() => setDeleteConfigId(null)}
        onConfirm={handleDeleteConfig}
        title="Remove Country"
        message="Remove this country's routing configuration? Its routes will no longer be active."
      />
    </>
  );
};
