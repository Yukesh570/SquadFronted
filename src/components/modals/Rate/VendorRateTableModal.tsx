import React, { useState, useEffect } from "react";
import Modal from "../../ui/Modal";
import { DeleteModal } from "../DeleteModal";
import {
  deleteVendorRateApi,
  getVendorRatesApi,
  getVendorRatesPerMNCMCCApi
} from "../../../api/rateApi/vendorRateApi";
import { VendorRateModal } from "./VendorRateModal";
import { RateVersionTableModal } from "./RateVersionTableModal";
import { ImportVendorRateModal } from "./ImportVendorRateModal";
import { toast } from "react-toastify";
import Button from "../../ui/Button"; 
import { Plus, Edit, Trash, Layers, Upload, ChevronLeft, ChevronRight } from "lucide-react"; 
import Select from "../../ui/Select";
import Input from "../../ui/Input";
import DatePicker from "../../ui/DatePicker";
import { StatusBadge } from "../../ui/StatusBadge";
import ContextMenu, { type ContextMenuItem } from "../../ui/ContextMenu";

interface VendorRateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateGroup: string | null;
  rateGroupId: number | null;
  moduleName: string;
  canUpdate: boolean;
  canDelete: boolean;
  countryMap: Record<string, string>;
  timezoneMap?: Record<string, string>;
}

const FilterInput = ({
  fieldKey, placeholder, value, onChange, onEnter, minWidth = "100px", type = "text"
}: {
  fieldKey: string; placeholder: string; value: string;
  onChange: (key: string, val: string) => void; onEnter: () => void; minWidth?: string; type?: string;
}) => (
  <div className="w-full filter-vrt-wrapper" style={{ minWidth }}>
    <Input
      type={type}
      label="" name={fieldKey} value={value || ""}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(fieldKey, e.target.value)}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
      placeholder={placeholder}
    />
  </div>
);

const rowsOptions = [
  { value: "10", label: "10" }, { value: "25", label: "25" },
  { value: "50", label: "50" }, { value: "100", label: "100" },
];

// ⚡️ FIX: Updated options to match DRAFT/ACTIVE/EXPIRED as requested
const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" },
];

export const VendorRateTableModal: React.FC<VendorRateTableModalProps> = ({
  isOpen,
  onClose,
  rateGroup,
  rateGroupId,
  moduleName,
  canUpdate,
  canDelete,
  countryMap,
}) => {
  const [latestRates, setLatestRates] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); 
  const [versionTargetRate, setVersionTargetRate] = useState<any>(null);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [apiFilters, setApiFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => { setCurrentPage(1); }, [rateGroup, moduleName]);

  useEffect(() => {
    if (isOpen && rateGroup) {
      fetchLatestRates();
    } else {
      setLatestRates([]);
      setTotalItems(0);
    }
  }, [isOpen, rateGroup, currentPage, rowsPerPage, apiFilters]);

  const fetchLatestRates = async () => {
    setIsLoading(true);
    try {
      const searchParams: Record<string, any> = { rateGroup__name: rateGroup };
      Object.keys(apiFilters).forEach((key) => {
        const val = apiFilters[key];
        if (!val) return;

        // ⚡️ FIX: Adjusted mappings explicitly based on backend constraints
        if      (key === "countryName") searchParams["country__name__icontains"] = val;
        else if (key === "MCC")         searchParams["MCC__icontains"]           = val;
        else if (key === "MNC")         searchParams["MNC__icontains"]           = val;
        else if (key === "countryCode") searchParams["countryCode__icontains"]   = val;
        else if (key === "network")     searchParams["network__icontains"]       = val;
        else if (key === "rate")        searchParams["rate"]              = val; 
        else if (key === "version")     searchParams["version"]                  = val; // If backend doesn't support version, this will simply not break, but won't filter
        else if (key === "status")      searchParams["status__icontains"]        = val; 
        else if (key === "effectiveFrom") searchParams["effectiveFrom"] = val; // Using icontains for loose date matching
      });
      const res = await getVendorRatesApi(moduleName, currentPage, rowsPerPage, searchParams);
      const list = res.results || (Array.isArray(res) ? res : []);
      setLatestRates(list);
      setTotalItems(res.count ?? list.length);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load rates.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
    if (value === "") {
      setApiFilters((prev) => { const next = { ...prev }; delete next[key]; return next; });
      setCurrentPage(1);
    }
  };
  const handleFilterApply = () => { setApiFilters(columnFilters); setCurrentPage(1); };
  const handleResetFilters = () => { setColumnFilters({}); setApiFilters({}); setCurrentPage(1); };
  const hasActiveFilters = Object.values(columnFilters).some((v) => v !== "" && v !== undefined);

  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginationLabel = `${totalItems === 0 ? 0 : startIndex + 1}-${Math.min(startIndex + latestRates.length, totalItems)} of ${totalItems}`;

  const handleDelete = async () => {
    if (deleteId && canDelete) {
      try {
        await deleteVendorRateApi(deleteId, moduleName);
        toast.success("Rate deleted successfully.");
        fetchLatestRates();
      } catch (error) {
        toast.error("Failed to delete rate.");
      }
      setDeleteId(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, rate: any) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRate(rate);
  };

  const menuItems: ContextMenuItem[] = selectedRate ? [
    {
      label: "Manage Versions",
      icon: <Layers size={16} />,
      onClick: () => {
        setVersionTargetRate(selectedRate);
        setIsVersionsModalOpen(true);
      }
    },
    ...(canUpdate ? [{ label: "Edit Rate", icon: <Edit size={16} />, onClick: () => { setEditingRate(selectedRate); setIsViewMode(false); setIsCreateModalOpen(true); } }] : []),
    ...(canDelete ? [{ label: "Delete", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRate.id) }] : []),
  ] : [];

  const currencyCode = latestRates.length > 0 ? latestRates[0].currencyCode : "";

  const headers = [
    "Country", "MCC", "MNC", "Country Code", "Network",
    `Rate ${currencyCode ? `(${currencyCode})` : ""}`, "Version", "Status", "Effective From", "Effective To"
  ];

  const renderCountry = (rate: any) => {
    if (rate.countryName) return rate.countryName;
    return countryMap[String(rate.country)] || String(rate.country || "-");
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Vendor Rates: ${rateGroup || ""}`}
        className="max-w-[95vw] w-full"
      >
        <div className="p-4 w-full flex flex-col" onClick={() => setContextMenuPos(null)}>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 w-full shrink-0">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex flex-col space-y-1.5 text-[13px] text-gray-600 dark:text-gray-300 leading-tight">
                <p>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Displaying Latest Rates:</span>{" "}
                  Shows the latest version of each country/network combination in this group.
                </p>
                <p>Right-click a row and select <strong>Manage Versions</strong> to view all versions.</p>
                <p>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Search:</span> Use the input fields in the header row and press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs mx-0.5 shadow-sm">Enter</kbd> to apply the filter.
                </p>
              </div>
            </div>
            {canUpdate && (
              <div className="flex shrink-0 w-full sm:w-auto gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsImportModalOpen(true)}
                  leftIcon={<Upload size={16} />}
                  className="w-full sm:w-auto text-sm py-1.5 px-4"
                >
                  Import
                </Button>
                <Button
                  variant="primary"
                  onClick={() => { setEditingRate(null); setIsViewMode(false); setIsCreateModalOpen(true); }}
                  leftIcon={<Plus size={16} />}
                  className="w-full sm:w-auto text-sm py-1.5 px-4"
                >
                  Add Rate
                </Button>
              </div>
            )}
          </div>

          {/* Pagination bar */}
          <div className="flex items-center mb-3 gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary dark:text-gray-400 whitespace-nowrap">Rows per page:</span>
              <div className="w-24 shrink-0">
                <Select value={String(rowsPerPage)} onChange={(val: string) => { setRowsPerPage(Number(val)); setCurrentPage(1); }} options={rowsOptions} clearable={false} placement="bottom" />
              </div>
            </div>
            <span className="text-sm text-text-secondary dark:text-gray-400 whitespace-nowrap">{paginationLabel}</span>
            <div className="flex items-center space-x-2 shrink-0">
              <button className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1 || isLoading}><ChevronLeft size={20} /></button>
              <button className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages || totalItems === 0 || isLoading}><ChevronRight size={20} /></button>
            </div>
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-1 transition-colors whitespace-nowrap">Reset Filters</button>
            )}
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                  {headers.map((h, i) => (
                    <th key={i} className="py-3 px-4 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-800/80">
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal"><FilterInput fieldKey="countryName" placeholder="Search..." value={columnFilters["countryName"] || ""} onChange={handleFilterChange} onEnter={handleFilterApply} minWidth="100px" /></th>
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal"><FilterInput fieldKey="MCC" placeholder="Search..." value={columnFilters["MCC"] || ""} onChange={handleFilterChange} onEnter={handleFilterApply} minWidth="70px" /></th>
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal"><FilterInput fieldKey="MNC" placeholder="Search..." value={columnFilters["MNC"] || ""} onChange={handleFilterChange} onEnter={handleFilterApply} minWidth="70px" /></th>
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal"><FilterInput fieldKey="countryCode" placeholder="Search..." value={columnFilters["countryCode"] || ""} onChange={handleFilterChange} onEnter={handleFilterApply} minWidth="80px" /></th>
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal"></th>
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal"><FilterInput type="number" fieldKey="rate" placeholder="Search..." value={columnFilters["rate"] || ""} onChange={handleFilterChange} onEnter={handleFilterApply} minWidth="70px" /></th>
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal"></th>
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal relative z-[60]">
                    <div className="filter-vrt-wrapper" style={{ minWidth: "100px" }}>
                      <Select label="" value={columnFilters["status"] || ""} onChange={(val: string) => { handleFilterChange("status", val); setApiFilters((prev) => ({ ...prev, status: val })); setCurrentPage(1); }} options={[{ label: "All", value: "" }, ...statusOptions]} placeholder="All" placement="bottom" />
                    </div>
                  </th>
                  <th className="p-1 border-b border-r dark:border-gray-600 font-normal relative z-[60]">
                    <div className="filter-vrt-wrapper" style={{ minWidth: "130px" }}>
                      <DatePicker
                        label=""
                        selected={columnFilters["effectiveFrom"] ? new Date(columnFilters["effectiveFrom"]) : null}
                        onChange={(date: Date | null) => {
                          // ⚡️ FIX: Format to purely YYYY-MM-DD for icontains to catch substring matches cleanly
                          const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "";
                          handleFilterChange("effectiveFrom", dateStr);
                          setApiFilters((prev) => dateStr ? { ...prev, effectiveFrom: dateStr } : (() => { const next = { ...prev }; delete next["effectiveFrom"]; return next; })());
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </th>
                  <th className="p-1 border-b dark:border-gray-600 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={headers.length} className="text-center py-8 text-gray-500">Loading rates...</td></tr>
                ) : latestRates.length === 0 ? (
                  <tr><td colSpan={headers.length} className="text-center py-8 text-gray-500">{Object.keys(apiFilters).length > 0 ? "No rates match your search filters." : "No rates found in this group."}</td></tr>
                ) : (
                  latestRates.map((v) => (
                    <tr
                      key={v.id}
                      onContextMenu={(e) => handleContextMenu(e, v)}
                      className="group border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-context-menu transition-colors"
                    >
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{renderCountry(v)}</td>

                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.MCC || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.MNC || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.countryCode || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.network || "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 font-medium whitespace-nowrap">
                        {v.rate || "-"}
                      </td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">v{v.version || 0}</td>
                      <td className="py-3 px-4"><StatusBadge status={v.status} /></td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.effectiveFrom ? new Date(v.effectiveFrom).toLocaleString() : "-"}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">{v.effectiveTo ? new Date(v.effectiveTo).toLocaleString() : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ContextMenu
          position={contextMenuPos}
          items={menuItems}
          onClose={() => { setContextMenuPos(null); setSelectedRate(null); }}
        />
      </Modal>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor Rate"
        message="Are you sure you want to delete this specific rate? This action cannot be undone."
      />

      <VendorRateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchLatestRates}
        moduleName={moduleName}
        editingRate={editingRate}
        isViewMode={isViewMode}
        rateGroupId={rateGroupId}
      />

      <RateVersionTableModal
        isOpen={isVersionsModalOpen}
        onClose={() => { 
          setIsVersionsModalOpen(false); 
          setVersionTargetRate(null); 
        }}
        ratePlan={rateGroup}
        ratePlanFilter={versionTargetRate}
        moduleName={moduleName}
        fetchApi={getVendorRatesPerMNCMCCApi}
        deleteApi={deleteVendorRateApi}
        countryMap={countryMap}
        isVendorMode={true}
        onEdit={(rateData) => { setEditingRate(rateData); setIsViewMode(false); setIsCreateModalOpen(true); }}
        onView={(rateData) => { setEditingRate(rateData); setIsViewMode(true); setIsCreateModalOpen(true); }}
        onRefresh={fetchLatestRates}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <ImportVendorRateModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchLatestRates}
        rateGroupId={rateGroupId}
      />
    <style dangerouslySetInnerHTML={{ __html: `
  .filter-vrt-wrapper label { display: none !important; }
  .filter-vrt-wrapper > div { margin-bottom: 0 !important; }
  .filter-vrt-wrapper input, .filter-vrt-wrapper select, .filter-vrt-wrapper button {
    min-height: 28px !important; height: 28px !important; padding-top: 2px !important;
    padding-bottom: 2px !important; padding-right: 6px !important;
    font-size: 12px !important; border-radius: 4px !important;
  }
  .filter-vrt-wrapper input:not(.pl-10) {
    padding-left: 6px !important;
  }
  .filter-vrt-wrapper input.pl-10 {
    padding-left: 2rem !important;
  }
`}} />
    </>
  );
};