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
import { getOperatorNetworkCodelookupApi } from "../../../api/operatorNetworkCodeApi/operatorNetworkCodeApi";
import { findVendorRateApi } from "../../../api/rateApi/vendorRateApi";
import { toast } from "react-toastify";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Input from "../../ui/Input"; 
import { StatusBadge } from "../../ui/StatusBadge"; 
import { EditableCell } from "../../ui/EditableCell";
import ContextMenu, { type ContextMenuItem } from "../../ui/ContextMenu";
import {
  Plus,
  Trash2,
  Trash,
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
  vendorRate?: string;
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

const configFilterOptions = [
  { label: "All Types", value: "ALL" },
  { label: "Priority", value: "PRIORITY" },
  { label: "Percentage", value: "PERCENTAGE" },
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

  // ── MCC / MNC options per country (NEW) ─────────────────────────────────
  const [networkCodesByCountry, setNetworkCodesByCountry] = useState<
    Record<
      string,
      { mccOptions: { label: string; value: string }[]; mncOptions: { label: string; value: string }[] }
    >
  >({});

  // ── Country-config section ──────────────────────────────────────────────
  const [configSectionOpen, setConfigSectionOpen] = useState(false);
  const [configFilter, setConfigFilter] = useState("ALL");
  const [newCountry, setNewCountry] = useState("");
  const [newRoutingType, setNewRoutingType] = useState("PRIORITY");
  const [newConfigStatus, setNewConfigStatus] = useState("ACTIVE");
  const [isAddingConfig, setIsAddingConfig] = useState(false);
  const [deleteConfigId, setDeleteConfigId] = useState<number | null>(null);

  // ── Per-country sections ────────────────────────────────────────────────
  const [sections, setSections] = useState<Section[]>([]);
  const [deleteRouteId, setDeleteRouteId] = useState<number | null>(null);
  const [deleteRouteCountry, setDeleteRouteCountry] = useState<string>("");
  const [activeCellId, setActiveCellId] = useState<string | null>(null);

  // ── Route row context menu ──────────────────────────────────────────────
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<CustomRouteData | null>(null);
  const [selectedRouteCountryId, setSelectedRouteCountryId] = useState<string>("");

  const handleRouteContextMenu = (e: React.MouseEvent, route: CustomRouteData, countryId: string) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRoute(route);
    setSelectedRouteCountryId(countryId);
  };

  const routeMenuItems: ContextMenuItem[] = selectedRoute
    ? [
        ...(canDelete
          ? [
              {
                label: "Delete Route",
                icon: <Trash size={16} />,
                variant: "danger" as const,
                onClick: () => {
                  setDeleteRouteId(selectedRoute.id!);
                  setDeleteRouteCountry(selectedRouteCountryId);
                },
              },
            ]
          : []),
      ]
    : [];

  // ── Fetch configs ───────────────────────────────────────────────────────
  const fetchConfigs = useCallback(async () => {
    if (!routeGroupId) return;
    try {
      const res = await getRouteGroupCountriesApi(moduleName, 1, 1000, {
        routeGroup: routeGroupId,
      });
      const results: RouteGroupCountryData[] = res.results || [];
      setSections((prev) => {
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
        const fetchedRoutes = res.results || [];
        setSections((prev) =>
          prev.map((s) =>
            String(s.config.country) === countryId
              ? { ...s, routes: fetchedRoutes, loading: false }
              : s,
          ),
        );
        // vendorRate is already included in the routes API response, no extra fetch needed
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

  // ── Fetch MCC / MNC options for one country (NEW) ───────────────────────
  const fetchNetworkCodesForCountry = useCallback(
    async (countryId: string, countryName: string) => {
      if (!countryId || !countryName) return;
      setNetworkCodesByCountry((prev) => {
        if (prev[countryId]) return prev; // already loaded, skip refetch
        return prev;
      });

      try {
        const res = await getOperatorNetworkCodelookupApi(1, 1000, {
          country__name: countryName,
        });
        const list = res.results || (Array.isArray(res) ? res : []);

        const uniqueMccs = Array.from(new Set(list.map((item: any) => item.MCC))).filter(Boolean);
        const uniqueMncs = Array.from(new Set(list.map((item: any) => item.MNC))).filter(Boolean);

        setNetworkCodesByCountry((prev) => ({
          ...prev,
          [countryId]: {
            mccOptions: uniqueMccs.map((mcc) => ({ label: String(mcc), value: String(mcc) })),
            mncOptions: uniqueMncs.map((mnc) => ({ label: String(mnc), value: String(mnc) })),
          },
        }));
      } catch (err) {
        console.error("Failed to fetch MCC/MNC options:", err);
      }
    },
    [],
  );

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setSections([]);
      setNetworkCodesByCountry({});
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
          fetchSectionRoutes(countryId);
        }
        return { ...s, isOpen: !s.isOpen };
      }),
    );
    // NEW: lazily load MCC/MNC options for this country when its section is opened
    const section = sections.find((s) => String(s.config.country) === countryId);
    if (section && section.config.countryName) {
      fetchNetworkCodesForCountry(countryId, section.config.countryName);
    }
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

  // ── Generic inline cell edit (mirrors SubRouteEditableTable's handleInlineSave) ──
  const handleInlineSave = async (
    countryId: string,
    routeId: number,
    field: keyof CustomRouteData,
    newValue: string,
  ) => {
    setActiveCellId(null);
    const section = sections.find((s) => String(s.config.country) === countryId);
    const originalRoute = section?.routes.find((r) => r.id === routeId);
    if (!originalRoute || String((originalRoute as any)[field]) === newValue) return;

    setSections((prev) =>
      prev.map((s) =>
        String(s.config.country) === countryId
          ? {
              ...s,
              routes: s.routes.map((r) =>
                r.id === routeId ? { ...r, [field]: newValue } : r,
              ),
            }
          : s,
      ),
    );

    try {
      await updateCustomRouteApi(routeId, { [field]: newValue }, moduleName);
      toast.success(`Updated ${field}`);
      if (field === "MCC" || field === "MNC" || field === "terminatingVendor") {
        const updatedRoute = { ...originalRoute, [field]: newValue } as any;
        fetchExistingRouteVendorRate(countryId, routeId, {
          MCC: updatedRoute.MCC,
          MNC: updatedRoute.MNC,
          terminatingVendor: updatedRoute.terminatingVendor,
        });
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.error) {
        toast.error(data.error);
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        Object.entries(data).forEach(([k, msgs]) =>
          toast.error(`${k}: ${Array.isArray(msgs) ? msgs[0] : String(msgs)}`),
        );
      } else {
        toast.error(`Failed to update ${field}`);
      }
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId
            ? {
                ...s,
                routes: s.routes.map((r) =>
                  r.id === routeId ? { ...r, [field]: (originalRoute as any)[field] } : r,
                ),
              }
            : s,
        ),
      );
    }
  };

  // ── Fetch Vendor Rate Inline ────────────────────────────────────────────
  const fetchInlineVendorRate = async (countryId: string, rowId: string, rowData: NewRow) => {
    if (!rowData.MCC || !rowData.MNC || !rowData.terminatingVendor) {
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId
            ? {
                ...s,
                newRows: s.newRows.map((r) =>
                  r._id === rowId ? { ...r, vendorRate: undefined } : r,
                ),
              }
            : s,
        ),
      );
      return;
    }

    try {
      const res = await findVendorRateApi({
        terminatingVendor: rowData.terminatingVendor,
        MCC: rowData.MCC,
        MNC: rowData.MNC,
      });
      const results = res.results || (Array.isArray(res) ? res : []);
      const matchedRate = results.length > 0 ? String(results[0].rate) : "N/A";

      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId
            ? {
                ...s,
                newRows: s.newRows.map((r) =>
                  r._id === rowId ? { ...r, vendorRate: matchedRate } : r,
                ),
              }
            : s,
        ),
      );
    } catch (err) {
      console.error("Failed to fetch inline rate:", err);
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId
            ? {
                ...s,
                newRows: s.newRows.map((r) =>
                  r._id === rowId ? { ...r, vendorRate: "Error" } : r,
                ),
              }
            : s,
        ),
      );
    }
  };

  // ── Fetch Vendor Rate for an existing (saved) route after inline edit ──────
  const fetchExistingRouteVendorRate = async (countryId: string, routeId: number, routeData: { MCC?: string; MNC?: string; terminatingVendor?: any }) => {
    if (!routeData.MCC || !routeData.MNC || !routeData.terminatingVendor) {
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId
            ? { ...s, routes: s.routes.map((r) => (r.id === routeId ? { ...r, vendorRate: undefined } as any : r)) }
            : s,
        ),
      );
      return;
    }

    try {
      const res = await findVendorRateApi({
        terminatingVendor: routeData.terminatingVendor,
        MCC: routeData.MCC,
        MNC: routeData.MNC,
      });
      const results = res.results || (Array.isArray(res) ? res : []);
      const matchedRate = results.length > 0 ? String(results[0].rate) : "N/A";

      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId
            ? { ...s, routes: s.routes.map((r) => (r.id === routeId ? { ...r, vendorRate: matchedRate } as any : r)) }
            : s,
        ),
      );
    } catch (err) {
      console.error("Failed to fetch vendor rate:", err);
      setSections((prev) =>
        prev.map((s) =>
          String(s.config.country) === countryId
            ? { ...s, routes: s.routes.map((r) => (r.id === routeId ? { ...r, vendorRate: "Error" } as any : r)) }
            : s,
        ),
      );
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

  const updateRow = (countryId: string, rowId: string, field: keyof NewRow, value: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (String(s.config.country) !== countryId) return s;
        
        const updatedRows = s.newRows.map((r) => {
          if (r._id === rowId) {
            const updatedRow = { ...r, [field]: value };
            if (field === "MCC" || field === "MNC" || field === "terminatingVendor") {
              fetchInlineVendorRate(countryId, rowId, updatedRow);
            }
            return updatedRow;
          }
          return r;
        });

        return { ...s, newRows: updatedRows };
      }),
    );
  };

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

  const filteredSections = sections.filter(
    (s) => configFilter === "ALL" || s.config.routingType === configFilter
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Manage Route Group: ${routeGroup || ""}`}
        className="max-w-[95vw] w-full"
      >
        <div className="p-4 flex flex-col gap-5">

          {/* ── Country Config (collapsible) ─────────────────────────────── */}
          <div className="border-2 border-primary/20 dark:border-primary/30 rounded-xl bg-primary/[0.03] dark:bg-primary/[0.06] shadow-sm relative">
            <button
              type="button"
              className={`w-full flex items-center justify-between px-4 py-3 bg-primary/[0.07] dark:bg-primary/[0.12] text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-primary/[0.11] dark:hover:bg-primary/[0.16] transition-colors ${configSectionOpen ? 'rounded-t-xl' : 'rounded-xl'}`}
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
              <div className="p-4 space-y-5 bg-white dark:bg-gray-900 border-t border-primary/10 dark:border-primary/20 rounded-b-xl">
                
                {/* --- ADD NEW CONFIG AREA --- */}
                {canUpdate && availableCountries.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold text-primary">Add Country Config</h4>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-56">
                        <Select label="Country" value={newCountry} onChange={setNewCountry} options={availableCountries} placeholder="Select Country" />
                      </div>
                      <div className="w-40">
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
                        className="mb-[2px] h-[38px] text-sm px-4"
                      >
                        {isAddingConfig ? "Adding…" : "Add Config"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* --- SEPARATOR --- */}
                {canUpdate && availableCountries.length > 0 && (
                  <hr className="border-gray-200 dark:border-gray-700" />
                )}

                {/* --- CONFIGURED COUNTRIES CHIPS --- */}
                <div className="flex flex-col gap-3">
                  {sections.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filteredSections.map((s) => (
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
                      {filteredSections.length === 0 && (
                        <p className="text-sm text-gray-400 py-1">No countries match the selected filter.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                       <p className="text-sm text-gray-400">No countries configured yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Type filter (outside config panel) ──────────────────────────── */}
          <div className="flex justify-end -mt-2">
            <div className="w-40 config-filter-wrapper">
              <Select
                label=""
                value={configFilter}
                onChange={(val) => setConfigFilter(val || "ALL")}
                options={configFilterOptions}
                placement="bottom"
              />
            </div>
          </div>

          {/* ── Divider between config panel and country sections ──────────── */}
          <div className="flex items-center gap-3 mt-1">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Routes by Country
            </span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* ── Per-country sections ───────────────────────────────────────── */}
          {/* Reverted the pb-24 spacing hack */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[65vh]">
            {sections.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                No countries configured. Open <strong>Country Routing Configuration</strong> above to add one.
              </div>
            )}

            {filteredSections.map((section) => {
              const countryId = String(section.config.country);
              const isPercentage = section.config.routingType === "PERCENTAGE";

              // NEW: MCC/MNC options for this section's country
              const mccOptions = networkCodesByCountry[countryId]?.mccOptions || [];
              const mncOptions = networkCodesByCountry[countryId]?.mncOptions || [];

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
                  className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                >
                  {/* Section header */}
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer select-none transition-colors ${
                      section.isOpen
                        ? "bg-gray-100 dark:bg-gray-700/60 rounded-t-lg"
                        : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addRow(countryId)}
                          leftIcon={<Plus size={12} />}
                          className="text-xs py-1 px-2 h-auto min-h-0 bg-transparent border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60 hover:text-primary transition-colors"
                        >
                          Add Route
                        </Button>
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
                    <div className="rounded-b-lg">
                      {/* FIXED: Removed the min-h/pb spacing hack entirely. Replaced overflow-x-auto with w-full overflow-visible to prevent clipping without stretching the layout. */}
                      <div className="w-full overflow-visible">
                        <table className="min-w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
                          <thead className="bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-gray-300 shadow-sm">
                            <tr>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-10">#</th>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-24">MCC</th>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-24">MNC</th>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-48">Terminating Vendor</th>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-28">
                                {isPercentage ? "Traffic %" : "Priority"}
                              </th>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-28">Vendor Rate</th>
                              <th className="px-3 py-2 font-bold text-left border-b dark:border-gray-600 w-32">Status</th>
                              {(canUpdate || canDelete) && (
                                <th className="px-3 py-2 font-bold text-center border-b border-l dark:border-gray-600 w-16">Action</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {section.loading && (
                              <tr>
                                <td colSpan={(canUpdate || canDelete) ? 8 : 7} className="px-4 py-6 text-center text-gray-400 animate-pulse bg-white dark:bg-gray-900">
                                  Loading…
                                </td>
                              </tr>
                            )}

                            {/* Existing routes */}
                            {!section.loading &&
                              section.routes.map((route, i) => (
                                <tr
                                  key={route.id}
                                  onContextMenu={canDelete ? (e) => handleRouteContextMenu(e, route, countryId) : undefined}
                                  className={`hover:bg-blue-50/40 dark:hover:bg-primary/5 transition-colors ${canDelete ? "cursor-context-menu" : ""}`}
                                >
                                  <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 text-gray-400 text-xs bg-gray-50/50 dark:bg-gray-800/20">{i + 1}</td>
                                  <td className="p-1.5 border-r border-b dark:border-gray-700 overflow-visible bg-white dark:bg-gray-900 w-24 max-w-[6rem]">
                                    <EditableCell
                                      value={route.MCC || ""}
                                      type="select"
                                      options={mccOptions}
                                      onSave={(val) => handleInlineSave(countryId, route.id!, "MCC", val)}
                                      disabled={!canUpdate}
                                      isEditing={activeCellId === `${route.id}-MCC`}
                                      onEditStart={() => setActiveCellId(`${route.id}-MCC`)}
                                      onEditEnd={() => setActiveCellId(null)}
                                    />
                                  </td>
                                  <td className="p-1.5 border-r border-b dark:border-gray-700 overflow-visible bg-white dark:bg-gray-900 w-24 max-w-[6rem]">
                                    <EditableCell
                                      value={route.MNC || ""}
                                      type="select"
                                      options={mncOptions}
                                      onSave={(val) => handleInlineSave(countryId, route.id!, "MNC", val)}
                                      disabled={!canUpdate}
                                      isEditing={activeCellId === `${route.id}-MNC`}
                                      onEditStart={() => setActiveCellId(`${route.id}-MNC`)}
                                      onEditEnd={() => setActiveCellId(null)}
                                    />
                                  </td>
                                  <td className="p-1.5 border-r border-b dark:border-gray-700 overflow-visible bg-white dark:bg-gray-900 w-48 max-w-[12rem]">
                                    <EditableCell
                                      value={String(route.terminatingVendor ?? "")}
                                      type="select"
                                      options={vendorOptions}
                                      onSave={(val) => handleInlineSave(countryId, route.id!, "terminatingVendor", val)}
                                      disabled={!canUpdate}
                                      isEditing={activeCellId === `${route.id}-vendor`}
                                      onEditStart={() => setActiveCellId(`${route.id}-vendor`)}
                                      onEditEnd={() => setActiveCellId(null)}
                                    />
                                  </td>
                                  <td className="p-1.5 border-r border-b dark:border-gray-700 overflow-visible bg-white dark:bg-gray-900 w-28 max-w-[7rem]">
                                    <EditableCell
                                      value={String(isPercentage ? (route.trafficPercentage ?? "") : (route.priority ?? ""))}
                                      type="number"
                                      onSave={(val) =>
                                        handleInlineSave(countryId, route.id!, isPercentage ? "trafficPercentage" : "priority", val)
                                      }
                                      disabled={!canUpdate}
                                      isEditing={activeCellId === `${route.id}-priorityField`}
                                      onEditStart={() => setActiveCellId(`${route.id}-priorityField`)}
                                      onEditEnd={() => setActiveCellId(null)}
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 font-mono">
                                    {(route as any).vendorRate ?? <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="p-1.5 border-b dark:border-gray-700 overflow-visible bg-white dark:bg-gray-900 w-32 max-w-[8rem]">
                                    {canUpdate ? (
                                      <EditableCell
                                        value={route.status}
                                        type="select"
                                        options={statusOptions}
                                        onSave={(val) => handleInlineSave(countryId, route.id!, "status", val)}
                                        disabled={!canUpdate}
                                        isEditing={activeCellId === `${route.id}-status`}
                                        onEditStart={() => setActiveCellId(`${route.id}-status`)}
                                        onEditEnd={() => setActiveCellId(null)}
                                      />
                                    ) : (
                                      <StatusBadge status={route.status} />
                                    )}
                                  </td>
                                  {(canUpdate || canDelete) && (
                                    <td className="px-3 py-2.5 border-b border-l dark:border-gray-700 text-center">
                                      {canDelete && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDeleteRouteId(route.id!);
                                            setDeleteRouteCountry(countryId);
                                          }}
                                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                          title="Delete Route"
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
                                {/* FIXED: Removed relative positioning from all TDs. This prevents the dropdown's z-index from being trapped underneath sibling rows. */}
                                <td className="px-2 py-1.5 border-b border-r dark:border-gray-700 min-w-[110px] overflow-visible">
                                  <div className="inline-table-field">
                                    <Select
                                      label=""
                                      value={row.MCC}
                                      onChange={(val) => updateRow(countryId, row._id, "MCC", val)}
                                      options={mccOptions}
                                      placeholder="MCC"
                                      placement="bottom"
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-1.5 border-b border-r dark:border-gray-700 min-w-[110px] overflow-visible">
                                  <div className="inline-table-field">
                                    <Select
                                      label=""
                                      value={row.MNC}
                                      onChange={(val) => updateRow(countryId, row._id, "MNC", val)}
                                      options={mncOptions}
                                      placeholder="MNC"
                                      placement="bottom"
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-1.5 border-b border-r dark:border-gray-700 min-w-[160px] overflow-visible">
                                  <div className="inline-table-field">
                                    <Select
                                      label=""
                                      value={row.terminatingVendor}
                                      onChange={(val) => updateRow(countryId, row._id, "terminatingVendor", val)}
                                      options={vendorOptions}
                                      placeholder="Select vendor…"
                                      placement="bottom"
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-1.5 border-b border-r dark:border-gray-700">
                                  <div className="inline-table-field">
                                    <Input
                                      label=""
                                      type="number"
                                      value={isPercentage ? row.trafficPercentage : row.priority}
                                      onChange={(e) =>
                                        updateRow(countryId, row._id, isPercentage ? "trafficPercentage" : "priority", e.target.value)
                                      }
                                      placeholder={isPercentage ? "0–100" : "1–5"}
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-1.5 border-b border-r dark:border-gray-700 text-xs text-gray-500 font-mono">
                                  {row.vendorRate ? (row.vendorRate === "N/A" || row.vendorRate === "Error" ? <span className="text-red-400">{row.vendorRate}</span> : <span>{row.vendorRate}</span>) : "—"}
                                </td>
                                <td className="px-2 py-1.5 border-b dark:border-gray-700 overflow-visible">
                                  <div className="inline-table-field min-w-[110px]">
                                    <Select
                                      label=""
                                      value={row.status}
                                      onChange={(val) => updateRow(countryId, row._id, "status", val)}
                                      options={statusOptions}
                                      placement="bottom"
                                    />
                                  </div>
                                </td>
                                {canUpdate && (
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
                                <td colSpan={canUpdate ? 8 : 7} className="px-4 py-5 text-center text-gray-400 dark:text-gray-500 text-xs">
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

        <ContextMenu
          position={contextMenuPos}
          items={routeMenuItems}
          onClose={() => { setContextMenuPos(null); setSelectedRoute(null); }}
        />
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

      {/* Scoped CSS for inline table form components */}
      <style dangerouslySetInnerHTML={{ __html: `
        .inline-table-field label { display: none !important; }
        .inline-table-field > div { margin-bottom: 0 !important; }
        .inline-table-field input, .inline-table-field select, .inline-table-field button {
          min-height: 32px !important; height: 32px !important; padding-top: 2px !important;
          padding-bottom: 2px !important; padding-left: 8px !important; padding-right: 8px !important;
          font-size: 13px !important; border-radius: 4px !important;
        }
        .config-filter-wrapper label { display: none !important; }
        .config-filter-wrapper > div { margin-bottom: 0 !important; }
        .custom-grid-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-grid-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .dark .custom-grid-scroll::-webkit-scrollbar-track { background: #1f2937; }
        .custom-grid-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-grid-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </>
  );
};