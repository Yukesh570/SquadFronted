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
import { CustomRouteModal } from "../RouteManager/CustomRouteModal";
import { CustomRoutePercentModal } from "../RouteManager/CustomRoutePercentModal";
import { getVendorsApi } from "../../../api/connectivityApi/vendorApi";
import { getCountriesApi } from "../../../api/settingApi/countryApi/countryApi";
import { getOperatorNetworkCodelookupApi } from "../../../api/operatorNetworkCodeApi/operatorNetworkCodeApi";
import { findVendorRateApi } from "../../../api/rateApi/vendorRateApi";
import { toast } from "react-toastify";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Input from "../../ui/Input";
import { StatusBadge } from "../../ui/StatusBadge";
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
  Edit,
  X,
  Layers,
} from "lucide-react";

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

const FilterInput = ({
  fieldKey,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  fieldKey: string;
  placeholder: string;
  value: string;
  onChange: (key: string, val: string) => void;
  type?: string;
}) => (
  <div className="w-full inline-filter-wrapper">
    <Input
      type={type}
      label=""
      name={fieldKey}
      value={value || ""}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(fieldKey, e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

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
  priority: "1",
  trafficPercentage: "",
  status: "ACTIVE",
});

const normalizeKey = (mcc: any, mnc: any) => {
  const normMcc = mcc != null && !isNaN(Number(mcc)) && String(mcc).trim() !== "" ? String(Number(mcc)) : String(mcc || "");
  const normMnc = mnc != null && !isNaN(Number(mnc)) && String(mnc).trim() !== "" ? String(Number(mnc)) : String(mnc || "");
  return `${normMcc}-${normMnc}`;
};

const formatGroupKeyLabel = (groupKey: string) => {
  const [mcc, mnc] = groupKey.split("-");
  if (!mcc || mcc.trim() === "") return "Unassigned Network Group";
  if (!mnc || mnc.trim() === "") return `MCC ${mcc} / MNC (Select MNC)`;
  return `MCC ${mcc} / MNC ${mnc}`;
};

export const SubRouteTableModal: React.FC<SubRouteTableModalProps> = ({
  isOpen,
  onClose,
  routeGroup,
  routeGroupId,
  moduleName,
  canUpdate,
  canDelete,
}) => {
  const [vendorOptions, setVendorOptions] = useState<{ label: string; value: string }[]>([]);
  const [countryOptions, setCountryOptions] = useState<{ label: string; value: string }[]>([]);

  const [networkCodesByCountry, setNetworkCodesByCountry] = useState<
    Record<
      string,
      {
        mccOptions: { label: string; value: string }[];
        mncOptions: { label: string; value: string }[];
        brandMap: Record<string, string>;
      }
    >
  >({});

  const [configSectionOpen, setConfigSectionOpen] = useState(false);
  const [configFilter, setConfigFilter] = useState("ALL");
  const [newCountry, setNewCountry] = useState("");
  const [newRoutingType, setNewRoutingType] = useState("PRIORITY");
  const [newConfigStatus, setNewConfigStatus] = useState("ACTIVE");
  const [isAddingConfig, setIsAddingConfig] = useState(false);
  
  const [deleteConfigData, setDeleteConfigData] = useState<{ id: number; countryName: string } | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [deleteRouteData, setDeleteRouteData] = useState<{ id: number; name: string; countryId: string } | null>(null);

  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [sectionFilters, setSectionFilters] = useState<Record<string, Record<string, string>>>({});

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<CustomRouteData | null>(null);
  const [selectedRouteCountryId, setSelectedRouteCountryId] = useState<string>("");
  const [selectedRoutingType, setSelectedRoutingType] = useState<"PRIORITY" | "PERCENTAGE">("PRIORITY");

  const [isEditPriorityModalOpen, setIsEditPriorityModalOpen] = useState(false);
  const [isEditPercentModalOpen, setIsEditPercentModalOpen] = useState(false);
  const [editingRouteData, setEditingRouteData] = useState<CustomRouteData | null>(null);

  const handleRouteContextMenu = (
    e: React.MouseEvent,
    route: CustomRouteData,
    countryId: string,
    routingType: "PRIORITY" | "PERCENTAGE"
  ) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRoute(route);
    setSelectedRouteCountryId(countryId);
    setSelectedRoutingType(routingType);
  };

  const routeMenuItems: ContextMenuItem[] = selectedRoute
    ? [
      ...(canUpdate
        ? [
          {
            label: "Edit Route",
            icon: <Edit size={16} />,
            onClick: () => {
              setEditingRouteData(selectedRoute);
              if (selectedRoutingType === "PERCENTAGE") {
                setIsEditPercentModalOpen(true);
              } else {
                setIsEditPriorityModalOpen(true);
              }
            },
          },
        ]
        : []),
      ...(canDelete
        ? [
          {
            label: "Delete Route",
            icon: <Trash size={16} />,
            variant: "danger" as const,
            onClick: () => {
              const vendorMatch = vendorOptions.find(v => String(v.value) === String(selectedRoute.terminatingVendor));
              const displayName = selectedRoute.name || vendorMatch?.label || `Route #${selectedRoute.id}`;
              setDeleteRouteData({
                id: selectedRoute.id!,
                name: displayName,
                countryId: selectedRouteCountryId,
              });
            },
          },
        ]
        : []),
    ]
    : [];

  const handleFilterChange = (countryId: string, fieldKey: string, val: string) => {
    setSectionFilters((prev) => ({
      ...prev,
      [countryId]: {
        ...(prev[countryId] || {}),
        [fieldKey]: val,
      },
    }));
  };

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

  const fetchNetworkCodesForCountry = useCallback(
    async (countryId: string, countryName: string) => {
      if (!countryId || !countryName) return;

      try {
        const res = await getOperatorNetworkCodelookupApi(1, 1000, {
          country__name: countryName,
        });
        const list = res.results || (Array.isArray(res) ? res : []);

        const uniqueMccs = Array.from(new Set(list.map((item: any) => item.MCC))).filter(Boolean);
        
        const mncMap = new Map<string, string>();
        const brandMap: Record<string, string> = {};

        list.forEach((item: any) => {
          if (item.MNC) {
            const mncStr = String(item.MNC).trim();
            const opName = String(item.operator || item.operatorName || item.brandName || "").trim();
            
            if (opName && opName !== mncStr && opName !== String(Number(mncStr))) {
              brandMap[mncStr] = opName;
              if (!mncMap.has(mncStr)) {
                mncMap.set(mncStr, `${mncStr} (${opName})`);
              }
            } else {
              if (!mncMap.has(mncStr)) {
                mncMap.set(mncStr, mncStr);
              }
            }
          }
        });

        const mncOptionsFormatted = Array.from(mncMap.entries()).map(([value, label]) => ({
          label,
          value,
        }));

        setNetworkCodesByCountry((prev) => ({
          ...prev,
          [countryId]: {
            mccOptions: uniqueMccs.map((mcc) => ({ label: String(mcc), value: String(mcc) })),
            mncOptions: mncOptionsFormatted,
            brandMap,
          },
        }));
      } catch (err) {
        console.error("Failed to fetch MCC/MNC options:", err);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      setSections([]);
      setNetworkCodesByCountry({});
      setSectionFilters({});
      setSectionErrors({});
      return;
    }
    fetchConfigs();
    getCountriesApi("country", 1, 1000)
      .then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        setCountryOptions(list.map((c: any) => ({ label: c.name, value: String(c.id) })));
      })
      .catch(() => { });
    getVendorsApi("vendor", 1, 1000)
      .then((res: any) => {
        const list = res.results || (Array.isArray(res) ? res : []);
        setVendorOptions(list.map((v: any) => ({ label: v.profileName || v.name, value: String(v.id) })));
      })
      .catch(() => { });
  }, [isOpen, routeGroupId]);

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
    const section = sections.find((s) => String(s.config.country) === countryId);
    if (section && section.config.countryName) {
      fetchNetworkCodesForCountry(countryId, section.config.countryName);
    }
  };

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
      toast.success("Country added successfully.");
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
    if (!deleteConfigData) return;
    try {
      await deleteRouteGroupCountryApi(deleteConfigData.id, moduleName);
      toast.success(`Country ${deleteConfigData.countryName} removed successfully.`);
      setDeleteConfigData(null);
      fetchConfigs();
    } catch {
      toast.error("Failed to remove country.");
    }
  };

  const handleDeleteRoute = async () => {
    if (!deleteRouteData) return;
    try {
      await deleteCustomRouteApi(deleteRouteData.id, moduleName);
      toast.success("Route deleted successfully.");
      fetchSectionRoutes(deleteRouteData.countryId);
      setDeleteRouteData(null);
    } catch {
      toast.error("Failed to delete route.");
    }
  };

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

  // PREPEND NEW ROW SO IT APPEARS AT THE TOP & SMARTLY PICK NON-100% MNC
  const addRow = (countryId: string) => {
    setSectionErrors((prev) => ({ ...prev, [countryId]: "" }));
    
    setSections((prev) =>
      prev.map((s) => {
        if (String(s.config.country) !== countryId) return s;

        const codes = networkCodesByCountry[countryId];
        const row = emptyRow();
        
        if (codes?.mccOptions.length === 1) {
          row.MCC = codes.mccOptions[0].value;
        } else if (s.newRows.length > 0 && s.newRows[0].MCC) {
          row.MCC = s.newRows[0].MCC;
        } else if (s.routes.length > 0 && s.routes[0].MCC) {
          row.MCC = String(s.routes[0].MCC);
        }

        const isPercentage = s.config.routingType === "PERCENTAGE";
        const groupTotals = new Map<string, number>();

        s.routes.filter(r => r.status === "ACTIVE").forEach(r => {
          const k = normalizeKey(r.MCC, r.MNC);
          groupTotals.set(k, (groupTotals.get(k) || 0) + Number(r.trafficPercentage || 0));
        });
        s.newRows.forEach(r => {
          const k = normalizeKey(r.MCC, r.MNC);
          groupTotals.set(k, (groupTotals.get(k) || 0) + Number(r.trafficPercentage || 0));
        });

        let candidateMnc = "";
        if (row.MCC && codes?.mncOptions) {
          const validOpt = codes.mncOptions.find((opt) => {
            const k = normalizeKey(row.MCC, opt.value);
            const total = groupTotals.get(k) || 0;
            return !isPercentage || total < 100;
          });
          if (validOpt) candidateMnc = validOpt.value;
        }

        row.MNC = candidateMnc;

        return { ...s, newRows: [row, ...s.newRows] };
      }),
    );
  };

  const updateRow = (countryId: string, rowId: string, field: keyof NewRow, value: string) => {
    setSectionErrors((prev) => ({ ...prev, [countryId]: "" }));

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

  const removeRow = (countryId: string, rowId: string) => {
    setSectionErrors((prev) => ({ ...prev, [countryId]: "" }));
    setSections((prev) =>
      prev.map((s) =>
        String(s.config.country) === countryId
          ? { ...s, newRows: s.newRows.filter((r) => r._id !== rowId) }
          : s,
      ),
    );
  };

  const handleLocalRouteSave = (updatedData: {
    trafficPercentage: number;
    terminatingVendor: number;
    status: string;
  }) => {
    if (!editingRouteData || !selectedRouteCountryId) return;

    setSections((prev) =>
      prev.map((s) => {
        if (String(s.config.country) !== selectedRouteCountryId) return s;

        return {
          ...s,
          routes: s.routes.map((r) =>
            r.id === editingRouteData.id
              ? {
                  ...r,
                  trafficPercentage: updatedData.trafficPercentage,
                  terminatingVendor: updatedData.terminatingVendor,
                  status: updatedData.status as any,
                  isModified: true,
                }
              : r
          ),
        };
      })
    );
  };

  const saveGroupRows = async (countryId: string, targetGroupKey?: string) => {
    setSectionErrors((prev) => ({ ...prev, [countryId]: "" }));

    const section = sections.find((s) => String(s.config.country) === countryId);
    if (!section) return;

    const isPercentage = section.config.routingType === "PERCENTAGE";

    const targetNewRows = targetGroupKey
      ? section.newRows.filter((r) => normalizeKey(r.MCC, r.MNC) === targetGroupKey)
      : section.newRows;

    const targetModifiedRoutes = targetGroupKey
      ? section.routes.filter((r) => (r as any).isModified && normalizeKey(r.MCC, r.MNC) === targetGroupKey)
      : section.routes.filter((r) => (r as any).isModified);

    if (targetNewRows.length === 0 && targetModifiedRoutes.length === 0) return;

    for (let idx = 0; idx < targetNewRows.length; idx++) {
      const row = targetNewRows[idx];
      const rowNum = idx + 1;

      if (!row.MCC) {
        const errorMsg = `Row #${rowNum}: MCC is required.`;
        setSectionErrors((prev) => ({ ...prev, [countryId]: errorMsg }));
        toast.error(errorMsg);
        return;
      }
      if (!row.MNC) {
        const errorMsg = `Row #${rowNum}: MNC is required.`;
        setSectionErrors((prev) => ({ ...prev, [countryId]: errorMsg }));
        toast.error(errorMsg);
        return;
      }
      if (!row.terminatingVendor) {
        const errorMsg = `Row #${rowNum}: Terminating Vendor is required.`;
        setSectionErrors((prev) => ({ ...prev, [countryId]: errorMsg }));
        toast.error(errorMsg);
        return;
      }
      if (isPercentage && (!row.trafficPercentage || Number(row.trafficPercentage) <= 0)) {
        const errorMsg = `Row #${rowNum}: Traffic Percentage is required.`;
        setSectionErrors((prev) => ({ ...prev, [countryId]: errorMsg }));
        toast.error(errorMsg);
        return;
      }
      if (!isPercentage && !row.priority) {
        const errorMsg = `Row #${rowNum}: Priority is required.`;
        setSectionErrors((prev) => ({ ...prev, [countryId]: errorMsg }));
        toast.error(errorMsg);
        return;
      }
    }

    if (isPercentage) {
      const groups = new Map<string, number>();
      
      const routesToValidate = targetGroupKey
        ? section.routes.filter(r => normalizeKey(r.MCC, r.MNC) === targetGroupKey)
        : section.routes;

      const newRowsToValidate = targetGroupKey
        ? section.newRows.filter(r => normalizeKey(r.MCC, r.MNC) === targetGroupKey)
        : section.newRows;

      routesToValidate.filter(r => r.status === "ACTIVE").forEach(r => {
        const key = normalizeKey(r.MCC, r.MNC);
        groups.set(key, (groups.get(key) || 0) + Number(r.trafficPercentage || 0));
      });
      
      newRowsToValidate.forEach(r => {
        const key = normalizeKey(r.MCC, r.MNC);
        groups.set(key, (groups.get(key) || 0) + Number(r.trafficPercentage || 0));
      });

      for (const [key, total] of groups.entries()) {
        const groupLabel = formatGroupKeyLabel(key);
        if (total > 100) {
          const errorMsg = `${groupLabel}: Total is ${total}% (${total - 100}% over limit)`;
          setSectionErrors((prev) => ({ ...prev, [countryId]: errorMsg }));
          toast.error(errorMsg);
          return;
        }
        if (total < 100) {
          const errorMsg = `${groupLabel}: Total is ${total}% (${100 - total}% remaining)`;
          setSectionErrors((prev) => ({ ...prev, [countryId]: errorMsg }));
          toast.error(errorMsg);
          return;
        }
      }
    }

    setSections((prev) =>
      prev.map((s) => (String(s.config.country) === countryId ? { ...s, saving: true } : s)),
    );

    try {
      const apiPromises: Promise<any>[] = [];

      targetModifiedRoutes.forEach((route) => {
        apiPromises.push(
          updateCustomRouteApi(
            route.id!,
            {
              trafficPercentage: Number(route.trafficPercentage),
              terminatingVendor: Number(route.terminatingVendor),
              status: route.status,
            },
            moduleName
          )
        );
      });

      if (targetNewRows.length > 0) {
        const payloads = targetNewRows.map((row) => ({
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

        apiPromises.push(
          createCustomRouteApi(payloads.length === 1 ? payloads[0] : payloads, moduleName)
        );
      }

      await Promise.all(apiPromises);
      toast.success("Route changes saved successfully.");

      setSections((prev) =>
        prev.map((s) => {
          if (String(s.config.country) !== countryId) return s;
          return {
            ...s,
            newRows: targetGroupKey
              ? s.newRows.filter((r) => normalizeKey(r.MCC, r.MNC) !== targetGroupKey)
              : [],
            saving: false,
          };
        }),
      );
      setSectionErrors((prev) => ({ ...prev, [countryId]: "" }));
      fetchSectionRoutes(countryId);
    } catch (err: any) {
      const data = err.response?.data;
      let errorMsg = "Failed to save routes.";

      if (data && typeof data === "object" && !Array.isArray(data)) {
        const formattedErrs = Object.entries(data).map(
          ([k, msgs]) => `${k}: ${Array.isArray(msgs) ? msgs[0] : String(msgs)}`
        );
        errorMsg = formattedErrs.join(" | ");
      } else if (typeof data === "string") {
        errorMsg = data;
      }

      setSectionErrors((prev) => ({ ...prev, [countryId]: errorMsg }));
      toast.error(errorMsg);

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

  const getOtherRoutesTotal = (countryId: string, currentRouteId?: number | string, mcc?: string, mnc?: string) => {
    if (!countryId) return 0;
    
    const targetCountryStr = typeof countryId === "object" ? String((countryId as any).id || (countryId as any).country || "") : String(countryId);

    const section = sections.find((s) => {
      const cfgCountryStr = typeof s.config.country === "object" ? String((s.config.country as any).id || (s.config.country as any).country || "") : String(s.config.country);
      return cfgCountryStr === targetCountryStr || String(s.config.country) === targetCountryStr;
    });

    if (!section) return 0;

    const targetRouteIdStr = currentRouteId != null ? String(currentRouteId) : "";

    return section.routes
      .filter((r) => {
        const rIdStr = r.id != null ? String(r.id) : "";
        const isSameRoute = rIdStr !== "" && rIdStr === targetRouteIdStr;
        const isActive = !r.status || String(r.status).toUpperCase() === "ACTIVE";
        const isSameMCCMNC = mcc && mnc ? normalizeKey(r.MCC, r.MNC) === normalizeKey(mcc, mnc) : true;
        return !isSameRoute && isActive && isSameMCCMNC;
      })
      .reduce((sum, r) => sum + Number(r.trafficPercentage || 0), 0);
  };

  const isItemMatchingFilters = (
    item: CustomRouteData | { isNew: true; row: NewRow },
    filters: Record<string, string>,
    isPercentage: boolean
  ) => {
    const mcc = "isNew" in item ? item.row.MCC : String(item.MCC || "");
    const mnc = "isNew" in item ? item.row.MNC : String(item.MNC || "");
    const vendorId = "isNew" in item ? item.row.terminatingVendor : String(item.terminatingVendor || "");
    
    const vMatch = vendorOptions.find(v => String(v.value) === vendorId);
    const vendorName = "isNew" in item 
      ? (vMatch?.label || "")
      : (vMatch?.label || (item as any).terminatingVendorProfileName || vendorId);

    const val = "isNew" in item
      ? (isPercentage ? item.row.trafficPercentage : item.row.priority)
      : (isPercentage ? String(item.trafficPercentage || "") : String(item.priority || ""));
    
    const status = "isNew" in item ? item.row.status : String(item.status || "");

    if (filters.mcc && !mcc.toLowerCase().includes(filters.mcc.toLowerCase())) return false;
    if (filters.mnc && !mnc.toLowerCase().includes(filters.mnc.toLowerCase())) return false;
    if (filters.vendor && !vendorName.toLowerCase().includes(filters.vendor.toLowerCase())) return false;
    if (filters.priority && !val.toLowerCase().includes(filters.priority.toLowerCase())) return false;
    if (filters.status && !status.toLowerCase().includes(filters.status.toLowerCase())) return false;

    return true;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Manage Route Group: ${routeGroup || ""}`}
        className="max-w-[95vw] w-full relative"
      >
        {/* Top Right "All Types" Filter Dropdown beside Modal Close Button with Spacing */}
        <div className="absolute top-5 right-20 z-30 w-36 config-filter-wrapper" onClick={(e) => e.stopPropagation()}>
          <Select
            label=""
            value={configFilter}
            onChange={(val) => setConfigFilter(val || "ALL")}
            options={configFilterOptions}
            placement="bottom"
          />
        </div>

        <div className="p-4 flex flex-col gap-5">

          {/* Country Config (collapsible) */}
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

                {/* ADD NEW CONFIG AREA */}
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

                {canUpdate && availableCountries.length > 0 && (
                  <hr className="border-gray-200 dark:border-gray-700" />
                )}

                {/* CONFIGURED COUNTRIES CHIPS */}
                <div className="flex flex-col gap-3">
                  {sections.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filteredSections.map((s) => (
                        <div
                          key={s.config.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${s.config.routingType === "PERCENTAGE"
                            ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300"
                            : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
                            }`}
                        >
                          <span>{s.config.countryName}</span>
                          <span className="text-xs opacity-60">({s.config.routingType})</span>
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfigData({ id: s.config.id!, countryName: s.config.countryName || "this country" })}
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

          {/* Divider */}
          <div className="flex items-center gap-3 mt-1">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Routes by Country
            </span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Per-country sections */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[65vh]">
            {sections.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                No countries configured. Open <strong>Country Routing Configuration</strong> above to add one.
              </div>
            )}

            {filteredSections.map((section) => {
              const countryId = String(section.config.country);
              const isPercentage = section.config.routingType === "PERCENTAGE";

              const mccOptions = networkCodesByCountry[countryId]?.mccOptions || [];
              const mncOptions = networkCodesByCountry[countryId]?.mncOptions || [];
              const brandMap = networkCodesByCountry[countryId]?.brandMap || {};

              const filters = sectionFilters[countryId] || {};
              const hasActiveFilters = Object.values(filters).some((v) => v.trim() !== "");
              const sectionError = sectionErrors[countryId];

              // Group items by MCC & MNC
              const mccMncGroupsMap = new Map<string, { total: number; items: (CustomRouteData | { isNew: true; row: NewRow })[] }>();
              
              section.newRows.forEach((row) => {
                const key = normalizeKey(row.MCC, row.MNC);
                if (!mccMncGroupsMap.has(key)) {
                  mccMncGroupsMap.set(key, { total: 0, items: [] });
                }
                const group = mccMncGroupsMap.get(key)!;
                group.items.unshift({ isNew: true, row });
                group.total += Number(row.trafficPercentage || 0);
              });

              section.routes.forEach((route) => {
                const key = normalizeKey(route.MCC, route.MNC);
                if (!mccMncGroupsMap.has(key)) {
                  mccMncGroupsMap.set(key, { total: 0, items: [] });
                }
                const group = mccMncGroupsMap.get(key)!;
                group.items.push(route);
                if (route.status === "ACTIVE") {
                  group.total += Number(route.trafficPercentage || 0);
                }
              });

              const mccMncGroups = Array.from(mccMncGroupsMap.entries())
                .map(([groupKey, groupData]) => {
                  const filteredItems = groupData.items.filter((item) =>
                    isItemMatchingFilters(item, filters, isPercentage)
                  );
                  return [groupKey, { ...groupData, items: filteredItems }] as [string, typeof groupData];
                })
                .filter(([_, groupData]) => !hasActiveFilters || groupData.items.length > 0);

              const usedVendors = new Map<string, Set<string>>();
              section.routes.filter(r => r.status === "ACTIVE").forEach(r => {
                const key = normalizeKey(r.MCC, r.MNC);
                if (!usedVendors.has(key)) usedVendors.set(key, new Set());
                if (r.terminatingVendor != null) usedVendors.get(key)!.add(String(r.terminatingVendor));
              });
              section.newRows.forEach(r => {
                const key = normalizeKey(r.MCC, r.MNC);
                if (!usedVendors.has(key)) usedVendors.set(key, new Set());
                if (r.terminatingVendor != null && String(r.terminatingVendor).trim() !== "") {
                  usedVendors.get(key)!.add(String(r.terminatingVendor));
                }
              });

              return (
                <div
                  key={countryId}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                >
                  {/* Section header */}
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer select-none transition-colors ${section.isOpen
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
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPercentage
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
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {canUpdate && section.isOpen && (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => addRow(countryId)}
                          leftIcon={<Plus size={13} />}
                          className="text-xs py-1.5 px-3 h-auto min-h-0 bg-primary text-white hover:opacity-90 shadow-sm transition-all"
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

                      {/* IN-TABLE ERROR BANNER */}
                      {sectionError && (
                        <div className="mx-4 mt-3 mb-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 flex items-center justify-between text-xs text-red-700 dark:text-red-300 shadow-sm">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-500 shrink-0" />
                            <span className="font-semibold">{sectionError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSectionErrors((prev) => ({ ...prev, [countryId]: "" }))}
                            className="text-red-400 hover:text-red-600 p-0.5 rounded transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

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
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-28">
                                Customer Rate
                              </th>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-28">
                                Vendor Rate
                              </th>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-28">
                                Margin
                              </th>
                              <th className="px-3 py-2 font-bold text-left border-b border-r dark:border-gray-600 w-24">
                                Margin %
                              </th>
                              <th className="px-3 py-2 font-bold text-left border-b dark:border-gray-600 w-32">Status</th>
                              {(canUpdate || canDelete) && (
                                <th className="px-3 py-2 font-bold text-center border-b border-l dark:border-gray-600 w-16">Action</th>
                              )}
                            </tr>
                            
                            {/* In-Table Search Filter Row */}
                            <tr className="bg-gray-50 dark:bg-gray-800/80">
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal"></th>
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
                                <FilterInput
                                  fieldKey="mcc"
                                  placeholder="MCC..."
                                  value={filters.mcc || ""}
                                  onChange={(k, val) => handleFilterChange(countryId, k, val)}
                                />
                              </th>
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
                                <FilterInput
                                  fieldKey="mnc"
                                  placeholder="MNC..."
                                  value={filters.mnc || ""}
                                  onChange={(k, val) => handleFilterChange(countryId, k, val)}
                                />
                              </th>
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
                                <FilterInput
                                  fieldKey="vendor"
                                  placeholder="Vendor..."
                                  value={filters.vendor || ""}
                                  onChange={(k, val) => handleFilterChange(countryId, k, val)}
                                />
                              </th>
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
                                <FilterInput
                                  fieldKey="priority"
                                  placeholder={isPercentage ? "%..." : "Priority..."}
                                  value={filters.priority || ""}
                                  onChange={(k, val) => handleFilterChange(countryId, k, val)}
                                />
                              </th>
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal"></th>
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal"></th>
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal"></th>
                              <th className="p-1 border-b border-r dark:border-gray-600 font-normal"></th>
                              <th className="p-1 border-b dark:border-gray-600 font-normal">
                                <FilterInput
                                  fieldKey="status"
                                  placeholder="Status..."
                                  value={filters.status || ""}
                                  onChange={(k, val) => handleFilterChange(countryId, k, val)}
                                />
                              </th>
                              {(canUpdate || canDelete) && (
                                <th className="p-1 border-b border-l dark:border-gray-600 font-normal"></th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {section.loading && (
                              <tr>
                                <td colSpan={(canUpdate || canDelete) ? 11 : 10} className="px-4 py-6 text-center text-gray-400 animate-pulse bg-white dark:bg-gray-900">
                                  Loading…
                                </td>
                              </tr>
                            )}

                            {/* Grouped Rendering by MCC / MNC */}
                            {!section.loading &&
                              mccMncGroups.map(([groupKey, groupData], groupIdx) => {
                                const [_mccVal, mncVal] = groupKey.split("-");

                                // Extract brand name if available
                                const operatorName = brandMap[mncVal] || "";

                                // Alternating Background style for MNC Groups
                                const rowBgClass = groupIdx % 2 === 0
                                  ? "bg-white dark:bg-gray-900"
                                  : "bg-gray-50/70 dark:bg-gray-800/40";

                                const formattedGroupHeaderLabel = formatGroupKeyLabel(groupKey);

                                // Check if this specific MNC group has unsaved/modified changes
                                const groupNewRows = groupData.items.filter(item => "isNew" in item);
                                const groupModifiedRoutes = groupData.items.filter(item => !("isNew" in item) && (item as any).isModified);
                                const groupHasChanges = groupNewRows.length > 0 || groupModifiedRoutes.length > 0;
                                const groupIsValid = !isPercentage || groupData.total === 100;

                                return (
                                  <React.Fragment key={groupKey}>
                                    {/* MNC Group Banner Header Row */}
                                    <tr className="bg-gray-100/90 dark:bg-gray-800/90 border-t border-b border-gray-200 dark:border-gray-700">
                                      <td colSpan={(canUpdate || canDelete) ? 11 : 10} className="px-3 py-1.5 text-xs font-semibold">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Layers size={13} className="text-primary" />
                                            <span className="text-gray-700 dark:text-gray-200">
                                              <strong>{formattedGroupHeaderLabel}</strong>
                                              {operatorName && (
                                                <span className="ml-1.5 text-gray-500 font-normal">({operatorName})</span>
                                              )}
                                              <span className="ml-2 text-[11px] font-normal text-gray-400">
                                                ({groupData.items.length})
                                              </span>
                                            </span>
                                          </div>

                                          {/* PER-MNC 100% VALIDATION BADGE */}
                                          {isPercentage && (
                                            <span
                                              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${
                                                groupData.total === 100
                                                  ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400"
                                                  : groupData.total > 100
                                                  ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300"
                                                  : "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300"
                                              }`}
                                            >
                                              {groupData.total === 100 ? (
                                                <CheckCircle2 size={12} />
                                              ) : (
                                                <AlertCircle size={12} />
                                              )}
                                              {groupData.total === 100
                                                ? "100% (Valid)"
                                                : groupData.total < 100
                                                ? `${groupData.total}% allocated (${100 - groupData.total}% remaining)`
                                                : `${groupData.total}% allocated (Exceeds by ${groupData.total - 100}%)`}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Group Row Items */}
                                    {groupData.items.map((item, i) => {
                                      if ("isNew" in item) {
                                        // Unsaved / New Row
                                        const row = item.row;
                                        const rowMncOptions = mncOptions.filter((opt) => {
                                          if (opt.value === row.MNC) return true;
                                          if (isPercentage && row.MCC) {
                                            const key = normalizeKey(row.MCC, opt.value);
                                            const gTotal = mccMncGroupsMap.get(key)?.total || 0;
                                            if (gTotal >= 100) return false;
                                          }
                                          return true;
                                        });

                                        const rowVendorOptions = vendorOptions.filter((opt) => {
                                          if (String(opt.value) === String(row.terminatingVendor)) return true;
                                          if (row.MCC && row.MNC) {
                                            const key = normalizeKey(row.MCC, row.MNC);
                                            if (usedVendors.get(key)?.has(String(opt.value))) return false;
                                          }
                                          return true;
                                        });

                                        return (
                                          <tr
                                            key={row._id}
                                            className="relative focus-within:z-20 bg-blue-50/70 dark:bg-blue-900/10 border-l-[3px] border-l-blue-400"
                                          >
                                            <td className="px-3 py-1.5 border-b border-r dark:border-gray-700 text-blue-500 text-xs font-bold">
                                              NEW
                                            </td>
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
                                                  options={rowMncOptions}
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
                                                  options={rowVendorOptions}
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
                                            <td className="px-3 py-1.5 border-b border-r dark:border-gray-700 text-xs text-gray-500 font-mono text-center">
                                              —
                                            </td>
                                            <td className="px-3 py-1.5 border-b border-r dark:border-gray-700 text-xs text-gray-500 font-mono">
                                              {row.vendorRate ? (row.vendorRate === "N/A" || row.vendorRate === "Error" ? <span className="text-red-400">{row.vendorRate}</span> : <span>{row.vendorRate}</span>) : "—"}
                                            </td>
                                            <td className="px-3 py-1.5 border-b border-r dark:border-gray-700 text-xs text-gray-500 font-mono text-center">
                                              —
                                            </td>
                                            <td className="px-3 py-1.5 border-b border-r dark:border-gray-700 text-xs text-gray-500 font-mono text-center">
                                              —
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
                                        );
                                      }

                                      // Existing Saved Route
                                      const route = item as CustomRouteData;
                                      const vendorMatch = vendorOptions.find((v) => String(v.value) === String(route.terminatingVendor));
                                      const vendorName = vendorMatch?.label || (route as any).terminatingVendorProfileName || route.terminatingVendor || "-";
                                      const isLocallyModified = (route as any).isModified;

                                      return (
                                        <tr
                                          key={route.id}
                                          onContextMenu={(e) => handleRouteContextMenu(e, route, countryId, section.config.routingType as "PRIORITY" | "PERCENTAGE")}
                                          className={`relative focus-within:z-20 transition-colors cursor-context-menu ${
                                            isLocallyModified
                                              ? "bg-amber-50/60 dark:bg-amber-900/10 border-l-[3px] border-l-amber-500 hover:bg-amber-100/50"
                                              : `${rowBgClass} hover:bg-blue-50/40 dark:hover:bg-primary/5`
                                          }`}
                                        >
                                          <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 text-gray-400 text-xs bg-gray-50/30 dark:bg-gray-800/10">{i + 1}</td>
                                          <td className="px-3 py-2.5 border-r border-b dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                                            {route.MCC || "-"}
                                          </td>
                                          <td className="px-3 py-2.5 border-r border-b dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                                            {route.MNC || "-"}
                                          </td>
                                          <td className="px-3 py-2.5 border-r border-b dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                                            {vendorName}
                                          </td>
                                          <td className="px-3 py-2.5 border-r border-b dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                                            {isPercentage ? `${route.trafficPercentage ?? "-"}%` : (route.priority ?? "-")}
                                            {isLocallyModified && (
                                              <span className="ml-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                                                Edited
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 font-mono text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {(route as any).customerRate ? `${(route as any).customerRate} ${(route as any).clientCurrencyCode || ''}` : "—"}
                                          </td>
                                          <td className="px-3 py-2.5 border-b border-r dark:border-gray-700 font-mono text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {(route as any).vendorRate ? `${(route as any).vendorRate} ${(route as any).vendorCurrencyCode || ''}` : "—"}
                                          </td>
                                          <td className={`px-3 py-2.5 border-b border-r dark:border-gray-700 font-mono text-xs whitespace-nowrap ${(route as any).margin < 0 ? 'text-red-500 font-medium' : (route as any).margin > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                            {(route as any).margin !== undefined ? `${(route as any).margin} ${(route as any).baseCurrencyCode || ''}` : "—"}
                                          </td>
                                          <td className={`px-3 py-2.5 border-b border-r dark:border-gray-700 font-mono text-xs whitespace-nowrap ${(route as any).marginPercentage < 0 ? 'text-red-500 font-medium' : (route as any).marginPercentage > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                            {(route as any).marginPercentage !== undefined ? `${(route as any).marginPercentage}%` : "—"}
                                          </td>
                                          <td className="px-3 py-2.5 border-b dark:border-gray-700 whitespace-nowrap">
                                            <StatusBadge status={route.status} />
                                          </td>
                                          {(canUpdate || canDelete) && (
                                            <td className="px-3 py-2.5 border-b border-l dark:border-gray-700 text-center whitespace-nowrap">
                                              {canDelete && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const displayName = route.name || vendorName || `Route #${route.id}`;
                                                    setDeleteRouteData({
                                                      id: route.id!,
                                                      name: displayName,
                                                      countryId: countryId,
                                                    });
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
                                      );
                                    })}

                                    {/* DEDICATED IN-BOX ACTION & VALIDATION BAR FOR THIS MNC GROUP */}
                                    {(groupHasChanges || (isPercentage && groupData.total !== 100)) && (
                                      <tr className="bg-gray-50/90 dark:bg-gray-800/60 border-b-2 border-gray-300 dark:border-gray-700">
                                        <td colSpan={(canUpdate || canDelete) ? 11 : 10} className="px-4 py-2">
                                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                            
                                            {/* Informative Status Message for this MNC */}
                                            {isPercentage ? (
                                              <div
                                                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md border ${
                                                  groupData.total === 100
                                                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                                                    : groupData.total > 100
                                                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                                                    : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
                                                }`}
                                              >
                                                {groupData.total === 100 ? (
                                                  <CheckCircle2 size={15} className="shrink-0 text-green-600 dark:text-green-400" />
                                                ) : (
                                                  <AlertCircle size={15} className="shrink-0" />
                                                )}
                                                <span>
                                                  {groupData.total === 100 ? (
                                                    <>
                                                      <strong className="font-bold">{formattedGroupHeaderLabel}: 100%</strong> (Ready to save)
                                                    </>
                                                  ) : groupData.total > 100 ? (
                                                    <>
                                                      <strong className="font-bold">{formattedGroupHeaderLabel}: {groupData.total}%</strong> ({groupData.total - 100}% over limit)
                                                    </>
                                                  ) : (
                                                    <>
                                                      <strong className="font-bold">{formattedGroupHeaderLabel}: {groupData.total}%</strong> ({100 - groupData.total}% remaining)
                                                    </>
                                                  )}
                                                </span>
                                              </div>
                                            ) : <div />}

                                            {/* Direct Save Button for this MNC Box */}
                                            {groupHasChanges && canUpdate && (
                                              <Button
                                                type="button"
                                                variant="primary"
                                                onClick={() => saveGroupRows(countryId, groupKey)}
                                                disabled={section.saving || !groupIsValid}
                                                leftIcon={<Save size={13} />}
                                                className="text-xs py-1.5 px-3 ml-auto shadow-sm"
                                              >
                                                {section.saving ? "Saving…" : "Save Changes"}
                                              </Button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}

                            {!section.loading && mccMncGroups.length === 0 && (
                              <tr>
                                <td colSpan={canUpdate ? 11 : 10} className="px-4 py-5 text-center text-gray-400 dark:text-gray-500 text-xs">
                                  No routes match your search filters.{canUpdate && " Click \"Add Route\" to create one."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
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

      {/* EDIT PRIORITY ROUTE MODAL */}
      <CustomRouteModal
        isOpen={isEditPriorityModalOpen}
        onClose={() => {
          setIsEditPriorityModalOpen(false);
          setEditingRouteData(null);
        }}
        onSuccess={() => {
          if (selectedRouteCountryId) fetchSectionRoutes(selectedRouteCountryId);
        }}
        moduleName={moduleName}
        editingRoute={editingRouteData}
        lockedName={routeGroup || undefined}
      />

      {/* EDIT PERCENTAGE ROUTE MODAL */}
      <CustomRoutePercentModal
        isOpen={isEditPercentModalOpen}
        onClose={() => {
          setIsEditPercentModalOpen(false);
          setEditingRouteData(null);
        }}
        onSuccess={() => {
          if (selectedRouteCountryId) fetchSectionRoutes(selectedRouteCountryId);
        }}
        moduleName={moduleName}
        editingRoute={editingRouteData}
        lockedName={routeGroup || undefined}
        otherRoutesTotal={getOtherRoutesTotal(selectedRouteCountryId, editingRouteData?.id, editingRouteData?.MCC, editingRouteData?.MNC)}
        onSaveLocal={handleLocalRouteSave}
      />

      {/* DYNAMIC DELETE ROUTE MODAL */}
      <DeleteModal
        isOpen={!!deleteRouteData}
        onClose={() => setDeleteRouteData(null)}
        onConfirm={handleDeleteRoute}
        title="Delete Route"
        message={deleteRouteData ? `Are you sure you want to delete route "${deleteRouteData.name}"? This action cannot be undone.` : "Are you sure you want to delete this route?"}
      />

      {/* DYNAMIC DELETE COUNTRY CONFIG MODAL */}
      <DeleteModal
        isOpen={!!deleteConfigData}
        onClose={() => setDeleteConfigData(null)}
        onConfirm={handleDeleteConfig}
        title="Remove Country"
        message={deleteConfigData ? `Are you sure you want to remove routing configuration for "${deleteConfigData.countryName}"? Its routes will no longer be active.` : "Remove this country's routing configuration?"}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .inline-table-field label, .inline-filter-wrapper label { display: none !important; }
        .inline-table-field > div, .inline-filter-wrapper > div { margin-bottom: 0 !important; }
        .inline-table-field input, .inline-filter-wrapper input,
        .inline-table-field select, .inline-filter-wrapper select,
        .inline-table-field button, .inline-filter-wrapper button {
          min-height: 28px !important; height: 28px !important; padding-top: 2px !important;
          padding-bottom: 2px !important; padding-left: 6px !important; padding-right: 6px !important;
          font-size: 12px !important; border-radius: 4px !important;
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