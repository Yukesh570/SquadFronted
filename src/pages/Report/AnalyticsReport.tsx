import React, { useState, useEffect, useRef } from "react";
import { Home } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import FilterCard from "../../components/ui/FilterCard";
import DatePicker from "../../components/ui/DatePicker";
import Input from "../../components/ui/Input";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import { actionHelper } from "../../helper/action";

import { getAnalyticsDataApi } from "../../api/reportApi/analyticsReportApi";
import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
import { CountryFlag } from "../../components/ui/CountryFlag";

type FilterColumnType =
  | "number"
  | "boolean"
  | "date"
  | "date_gt_lt"
  | "text"
  | "number_range"
  | "number_gt_lt";

interface ColumnConfig extends Omit<FilterColumn, "type" | "key" | "label"> {
  key: string;
  label: string;
  type?: FilterColumnType;
  filterKey?: string;
  isSearchOnly?: boolean;
  isSearchable?: boolean;
  tableLabel?: string;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatLocalDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const DEFAULT_SEARCH_COLUMNS = ["client_company", "date", "date__gt_lt"];
const BATCH_SIZE = 50;
const LOAD_MORE_THRESHOLD_PX = 200;

const allColumns: ColumnConfig[] = [
  { key: "client_company", label: "Company", type: "text", filterKey: "client_company" },
  { key: "date", label: "Date (Exact)", type: "date" },
  { key: "date__gt_lt", label: "Date (After / Before)", type: "date_gt_lt", isSearchOnly: true },
  // { key: "date__gt", label: "Date After (>)", type: "date" },
  // { key: "date__gte", label: "Date From (>=)", type: "date" },
  // { key: "date__lt", label: "Date Before (<)", type: "date" },
  // { key: "date__lte", label: "Date To (<=)", type: "date" },
];

const ExpandButton: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => {
  return (
    <span className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold leading-none shrink-0 border border-gray-200 dark:border-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
      {isExpanded ? "-" : "+"}
    </span>
  );
};

const DataBarCell: React.FC<{
  value: number;
  max: number;
  type?: "volume" | "currency" | "danger" | "success";
}> = ({ value = 0, max = 1, type = "volume" }) => {
  const percentage = Math.min(Math.max((value / (max || 1)) * 100, 4), 100);

  let containerStyle = "";
  let fillStyle = "";

  if (type === "volume") {
    containerStyle = "bg-sky-50/60 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800";
    fillStyle = "bg-sky-200/90 dark:bg-sky-900/60 border-sky-400 dark:border-sky-700";
  } else if (type === "success") {
    containerStyle = "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800";
    fillStyle = "bg-emerald-200 dark:bg-emerald-900/70 border-emerald-400 dark:border-emerald-700";
  } else if (type === "danger") {
    containerStyle = "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800";
    fillStyle = "bg-rose-200 dark:bg-rose-900/70 border-rose-400 dark:border-rose-700";
  } else if (type === "currency") {
    containerStyle = "bg-fuchsia-50/60 dark:bg-fuchsia-950/20 border-fuchsia-300 dark:border-fuchsia-800";
    fillStyle = "bg-fuchsia-200/90 dark:bg-fuchsia-900/60 border-fuchsia-400 dark:border-fuchsia-700";
  }

  return (
    <div className={`relative w-full h-7 flex items-center justify-end px-2 overflow-hidden rounded border shadow-xs ${containerStyle}`}>
      <div
        className={`absolute right-0 top-0 bottom-0 ${fillStyle} transition-all duration-300 rounded-r border-l`}
        style={{ width: `${percentage}%` }}
      />
      <span className="relative z-1 font-mono text-xs font-semibold text-text-primary dark:text-gray-100">
        {type === "currency" ? `$${Number(value || 0).toFixed(2)}` : Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
};

const DlrCell: React.FC<{ pct: number }> = ({ pct = 0 }) => {
  let boxStyle = "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700";
  if (pct < 85 && pct >= 60) {
    boxStyle = "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700";
  } else if (pct < 60) {
    boxStyle = "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700";
  }

  return (
    <div className={`w-full h-7 flex items-center justify-center rounded px-1.5 font-mono text-xs font-bold border shadow-xs ${boxStyle}`}>
      {Number(pct || 0).toFixed(2)}%
    </div>
  );
};

const MarginPctCell: React.FC<{ pct: number }> = ({ pct = 0 }) => {
  const percentage = Math.min(Math.max((pct / 100) * 100, 4), 100);

  let boxStyle = "bg-emerald-50/80 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700";
  let fillStyle = "bg-emerald-200/90 dark:bg-emerald-900/60 border-emerald-400 dark:border-emerald-700";
  if (pct < 20 && pct >= 8) {
    boxStyle = "bg-amber-50/80 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700";
    fillStyle = "bg-amber-200/90 dark:bg-amber-900/60 border-amber-400 dark:border-amber-700";
  } else if (pct < 8) {
    boxStyle = "bg-red-50/80 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700";
    fillStyle = "bg-red-200/90 dark:bg-red-900/60 border-red-400 dark:border-red-700";
  }

  return (
    <div className={`relative w-full h-7 flex items-center justify-end px-2 overflow-hidden rounded border shadow-xs ${boxStyle}`}>
      <div
        className={`absolute right-0 top-0 bottom-0 ${fillStyle} transition-all duration-300 rounded-r border-l`}
        style={{ width: `${percentage}%` }}
      />
      <span className="relative z-1 font-mono text-xs font-bold">
        {Number(pct || 0).toFixed(2)}%
      </span>
    </div>
  );
};

const tableHeaders = [
  "Entity",
  "Attempts",
  "Successful",
  "Submitted",
  "ASR %",
  "DLR %",
  "Delivered",
  "Failed",
  "Revenue ($)",
  "Vendor Cost ($)",
  "Margin ($)",
  "Margin %",
];

type DatePresetKey = "today" | "yesterday" | "last7" | "last30" | "last60" | "last90" | "lastMonth" | "custom";

interface DatePresetOption {
  key: DatePresetKey;
  label: string;
}

const DATE_PRESETS: DatePresetOption[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "last30", label: "Last 30 Days" },
  { key: "last60", label: "Last 60 Days" },
  { key: "last90", label: "Last 90 Days" },
  { key: "lastMonth", label: "Last Month" },
];

const getPresetDateRange = (preset: DatePresetKey): { start: string; end: string } => {
  const now = new Date();
  const todayStr = formatLocalDate(now);

  switch (preset) {
    case "today":
      return { start: todayStr, end: todayStr };

    case "yesterday": {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      return { start: formatLocalDate(y), end: todayStr };
    }

    case "last7": {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { start: formatLocalDate(start), end: todayStr };
    }

    case "last30": {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { start: formatLocalDate(start), end: todayStr };
    }

    case "last60": {
      const start = new Date(now);
      start.setDate(now.getDate() - 59);
      return { start: formatLocalDate(start), end: todayStr };
    }

    case "last90": {
      const start = new Date(now);
      start.setDate(now.getDate() - 89);
      return { start: formatLocalDate(start), end: todayStr };
    }

    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: formatLocalDate(start), end: formatLocalDate(end) };
    }

    default:
      return { start: todayStr, end: todayStr };
  }
};

const AnalyticsReport: React.FC = () => {
  const [companyRows, setCompanyRows] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loadedPage, setLoadedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activePreset, setActivePreset] = useState<DatePresetKey>("today");

  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});

  const [countryData, setCountryData] = useState<Record<string, any[]>>({});
  const [vendorData, setVendorData] = useState<Record<string, any[]>>({});

  const [nodeLoading, setNodeLoading] = useState<Record<string, boolean>>({});

  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [countryOptions, setCountryOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await getCountriesApi("country", 1, 1000);
        const data = res.results || (Array.isArray(res) ? res : []);
        setCountryOptions(
          data.map((item: any) => ({
            label: item.name || "Unknown",
            value: item.name || String(item.id),
            iso2: item.iso2,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch countries", error);
      }
    };
    fetchCountries();
  }, []);

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        actionHelper("Analytics", "Opened Analytics Report Module", false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  const resetTreeState = () => {
    setExpandedClients({});
    setExpandedCountries({});
    setCountryData({});
    setVendorData({});
  };

  const getActiveFilterParams = (
    customFilters?: Record<string, string>,
    presetOverride?: DatePresetKey
  ) => {
    const params: Record<string, any> = {};
    const activeFilters = customFilters || filterValues;
    const currentPreset = presetOverride !== undefined ? presetOverride : activePreset;

    searchColumns.forEach((key) => {
      const val = activeFilters[key];
      if (!val) return;
      const colDef = allColumns.find((c) => c.key === key);

      if (colDef?.type === "date") {
        const cleanDate = val.split("T")[0];
        params.start_date = cleanDate;
        params.end_date = cleanDate;
      } else if (colDef?.type === "date_gt_lt") {
        const [gt, lt] = val.split(",");
        if (gt && gt.trim() !== "") {
          params.start_date = gt.split("T")[0];
        }
        if (lt && lt.trim() !== "") {
          params.end_date = lt.split("T")[0];
        }
      } else {
        params[colDef?.filterKey || key] = val;
      }
    });

    const hasExplicitDateFilter = params.start_date || params.end_date;

    if (!hasExplicitDateFilter && currentPreset && currentPreset !== "custom") {
      const range = getPresetDateRange(currentPreset);
      params.start_date = range.start;
      params.end_date = range.end;
    }

    return params;
  };

  const fetchCompanyData = async (
    page: number = 1,
    append: boolean = false,
    customFilters?: Record<string, string>,
    presetOverride?: DatePresetKey
  ) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;

    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

    try {
      const filterParams = getActiveFilterParams(customFilters, presetOverride);
      const searchParams: Record<string, any> = {
        group_by: "client_company",
        page: page,
        page_size: BATCH_SIZE,
        ...filterParams,
      };

      const res = await getAnalyticsDataApi(searchParams);
      if (newController.signal.aborted) return;

      const rawList: any[] = Array.isArray(res)
        ? res
        : res.results || [];
      const count = res.count ?? rawList.length;
      setTotalItems(count);
      setHasMore(Boolean(res.next));
      setLoadedPage(page);

      const newRows = rawList.map((m: any, idx: number) => {
        const clientName = m.client_company || m.client || `Company ${idx + 1}`;
        return {
          id: clientName,
          client_company: clientName,
          attempts: m.attempts || 0,
          successful: m.successful || 0,
          submitted: m.submitted || 0,
          asrPct: m.asr_percent || 0,
          dlrPct: m.dlr_percent || 0,
          delivered: m.delivered || 0,
          failed: m.failed || 0,
          revenue: m.revenue || 0,
          vendorCost: m.vendor_cost || 0,
          marginUsd: m.margin_usd || 0,
          marginPct: m.margin_percent || 0,
        };
      });

      setCompanyRows((prev) => (append ? [...prev, ...newRows] : newRows));
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Failed to fetch analytics company data:", error);
        toast.error("Failed to retrieve analytics data from backend.");
        if (!append) setCompanyRows([]);
      }
    } finally {
      if (abortControllerRef.current === newController) {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchCompanyData(1, false);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const scrollEl = tableWrapperRef.current?.querySelector<HTMLDivElement>("div.overflow-auto");
    if (!scrollEl) return;

    const handleScroll = () => {
      if (isLoading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop - clientHeight < LOAD_MORE_THRESHOLD_PX) {
        fetchCompanyData(loadedPage + 1, true);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [isLoading, isFetchingMore, hasMore, loadedPage, filterValues, companyRows.length]);

  const toggleClientCompany = async (clientCompany: string) => {
    const compositeKey = clientCompany;
    const isCurrentlyExpanded = !!expandedClients[compositeKey];
    setExpandedClients((prev) => ({ ...prev, [compositeKey]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !countryData[compositeKey]) {
      setNodeLoading((prev) => ({ ...prev, [compositeKey]: true }));
      try {
        const filterParams = getActiveFilterParams();
        const res = await getAnalyticsDataApi({
          group_by: "country",
          client_company: clientCompany,
          ...filterParams,
        });
        const items = Array.isArray(res) ? res : res.results || [];
        setCountryData((prev) => ({ ...prev, [compositeKey]: items }));
      } catch (err) {
        console.error("Failed to load countries", err);
        toast.error(`Failed to load countries for ${clientCompany}`);
      } finally {
        setNodeLoading((prev) => ({ ...prev, [compositeKey]: false }));
      }
    }
  };

  const toggleCountry = async (clientCompany: string, countryName: string) => {
    const compositeKey = `${clientCompany}__${countryName}`;
    const isCurrentlyExpanded = !!expandedCountries[compositeKey];
    setExpandedCountries((prev) => ({ ...prev, [compositeKey]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !vendorData[compositeKey]) {
      setNodeLoading((prev) => ({ ...prev, [compositeKey]: true }));
      try {
        const filterParams = getActiveFilterParams();
        const res = await getAnalyticsDataApi({
          group_by: "vendor_company",
          client_company: clientCompany,
          country_name: countryName,
          ...filterParams,
        });
        const items = Array.isArray(res) ? res : res.results || [];
        setVendorData((prev) => ({ ...prev, [compositeKey]: items }));
      } catch (err) {
        console.error("Failed to load vendor companies", err);
        toast.error(`Failed to load vendors for ${countryName}`);
      } finally {
        setNodeLoading((prev) => ({ ...prev, [compositeKey]: false }));
      }
    }
  };

  const handlePresetClick = (presetKey: DatePresetKey) => {
    setActivePreset(presetKey);
    let updatedFilters: Record<string, string> = {};
    setFilterValues((prev) => {
      const next = { ...prev };
      delete next.date;
      delete next.date__gt_lt;
      updatedFilters = next;
      return next;
    });

    resetTreeState();
    fetchCompanyData(1, false, updatedFilters, presetKey);
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === "date" || key === "date__gt_lt") {
      setActivePreset("custom");
    }
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    resetTreeState();
    fetchCompanyData(1, false);
  };

  const handleClearFilters = () => {
    setActivePreset("today");
    setFilterValues({});
    resetTreeState();
    fetchCompanyData(1, false, {}, "today");
  };

  const paginationLabel = `${totalItems === 0 ? 0 : 1}-${Math.min(companyRows.length, totalItems)} of ${totalItems}`;

  const maxAttempts = Math.max(...companyRows.map((d) => d.attempts || 1), 100);
  const maxRevenue = Math.max(...companyRows.map((d) => d.revenue || 1), 10);

  const visibleSearchFields = allColumns.filter((col) => searchColumns.includes(col.key));
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto pb-12">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Analytics Report
          </h1>
          <div className="relative z-20">
            <AdvancedFilter
              columns={allColumns}
              selectedColumns={searchColumns}
              defaultColumns={DEFAULT_SEARCH_COLUMNS}
              onFilter={(newCols) => {
                setSearchColumns(newCols);
                setFilterValues((prev) => {
                  const next = { ...prev };
                  Object.keys(next).forEach((k) => {
                    if (!newCols.includes(k)) delete next[k];
                  });
                  return next;
                });
              }}
              onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)}
              isLoading={isLoading}
              buttonLabel="Search Fields"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Analytics</span>
        </div>
      </div>

      {/* Dynamic Filter Card */}
      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          const baseLabel = getBaseLabel(col.label);
          if (col.type === "date") {
            return (
              <DatePicker
                key={col.key}
                label={`Search ${baseLabel}`}
                showTimeSelect={true}
                selected={
                  filterValues[col.key] ? new Date(filterValues[col.key]) : null
                }
                onChange={(val: Date | null) =>
                  handleFilterChange(col.key, val ? formatLocalDateTime(val) : "")
                }
                placeholder="Select Date & Time"
              />
            );
          }
          if (col.type === "date_gt_lt") {
            const [gtStr, ltStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${baseLabel} (> After)`}
                  showTimeSelect={true}
                  selected={gtStr ? new Date(gtStr) : null}
                  onChange={(val: Date | null) => {
                    const newGt = val ? formatLocalDateTime(val) : "";
                    const currentLt = ltStr || "";
                    handleFilterChange(
                      col.key,
                      newGt || currentLt ? `${newGt},${currentLt}` : "",
                    );
                  }}
                  placeholder="Select Date & Time"
                />
                <DatePicker
                  label={`Search ${baseLabel} (< Before)`}
                  showTimeSelect={true}
                  selected={ltStr ? new Date(ltStr) : null}
                  onChange={(val: Date | null) => {
                    const newLt = val ? formatLocalDateTime(val) : "";
                    const currentGt = gtStr || "";
                    handleFilterChange(
                      col.key,
                      currentGt || newLt ? `${currentGt},${newLt}` : "",
                    );
                  }}
                  placeholder="Select Date & Time"
                />
              </React.Fragment>
            );
          }
          return (
            <Input
              key={col.key}
              type={col.type || "text"}
              label={`Search ${baseLabel}`}
              value={filterValues[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              placeholder={`${baseLabel}`}
            />
          );
        })}
      </FilterCard>

      {/* DataTable-Matching Container */}
      <div
        ref={tableWrapperRef}
        className="mt-6 rounded-xl bg-white shadow-card overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col relative z-0 app-data-table"
      >
        {/* Top Bar: Pagination Count on Left & Date Pills Aligned to the Right */}
        <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800 relative z-10 gap-3">
          <span className="text-sm text-text-secondary dark:text-gray-400 whitespace-nowrap">
            {paginationLabel}
          </span>

          <div className="flex flex-wrap gap-2 items-center justify-end ml-auto">
            {DATE_PRESETS.map((preset) => {
              const isActive = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePresetClick(preset.key)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all duration-200 focus:outline-none shadow-xs ${isActive
                    ? "bg-primary text-white border-primary dark:bg-primary dark:border-primary"
                    : "bg-white text-text-secondary border-gray-200 hover:border-primary hover:text-primary dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-primary"
                    }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Data Table with Sticky Header */}
        <div className="overflow-auto max-h-[65vh] min-h-[300px] relative z-0 custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-separate border-spacing-0">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-30 shadow-xs">
              <tr>
                {tableHeaders.map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 whitespace-nowrap min-w-[120px]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="px-4 py-12 text-center text-text-secondary dark:text-gray-400"
                  >
                    Loading analytics data...
                  </td>
                </tr>
              ) : companyRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="px-4 py-12 text-center text-text-secondary dark:text-gray-400"
                  >
                    No analytics records found.
                  </td>
                </tr>
              ) : (
                companyRows.map((clientRow: any, cIdx: number) => {
                  const clientName = clientRow.client_company || clientRow.client || `Company ${cIdx + 1}`;
                  const isClientExpanded = !!expandedClients[clientName];
                  const isClientLoading = !!nodeLoading[clientName];
                  const countries = countryData[clientName] || [];

                  return (
                    <React.Fragment key={clientName}>
                      {/* LEVEL 0: CLIENT COMPANY ROW */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-semibold">
                        <td className="px-4 py-2.5 whitespace-nowrap min-w-[260px]">
                          <button
                            type="button"
                            onClick={() => toggleClientCompany(clientName)}
                            className="inline-flex items-center space-x-2 text-text-primary dark:text-gray-200 hover:text-primary focus:outline-none group"
                          >
                            <ExpandButton isExpanded={isClientExpanded} />
                            <span className="text-xs font-semibold">{clientName}</span>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded ml-1">
                              COMPANY
                            </span>
                          </button>
                        </td>
                        <td className="px-2 py-2"><DataBarCell value={clientRow.attempts} max={maxAttempts} /></td>
                        <td className="px-2 py-2"><DataBarCell value={clientRow.successful} max={maxAttempts} /></td>
                        <td className="px-2 py-2"><DataBarCell value={clientRow.submitted} max={maxAttempts} /></td>
                        <td className="px-2 py-2"><DlrCell pct={clientRow.asrPct} /></td>
                        <td className="px-2 py-2"><DlrCell pct={clientRow.dlrPct} /></td>
                        <td className="px-2 py-2"><DataBarCell value={clientRow.delivered} max={maxAttempts} type="success" /></td>
                        <td className="px-2 py-2"><DataBarCell value={clientRow.failed} max={maxAttempts} type="danger" /></td>
                        <td className="px-2 py-2"><DataBarCell value={clientRow.revenue} max={maxRevenue} type="currency" /></td>
                        <td className="px-2 py-2"><DataBarCell value={clientRow.vendorCost} max={maxRevenue} type="currency" /></td>
                        <td className="px-2 py-2"><DataBarCell value={clientRow.marginUsd} max={maxRevenue} type="currency" /></td>
                        <td className="px-2 py-2"><MarginPctCell pct={clientRow.marginPct} /></td>
                      </tr>

                      {/* LEVEL 1: COUNTRY ROWS */}
                      {isClientExpanded && (
                        isClientLoading ? (
                          <tr>
                            <td colSpan={12} className="py-2 pl-10 text-xs text-gray-500 italic">Loading countries...</td>
                          </tr>
                        ) : countries.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="py-2 pl-10 text-xs text-gray-400 italic">No country data found for {clientName}.</td>
                          </tr>
                        ) : (
                          countries.map((countryRow: any, coIdx: number) => {
                            const countryName = countryRow.country || countryRow.country_name || `Country ${coIdx + 1}`;
                            const countryKey = `${clientName}__${countryName}`;
                            const isCountryExpanded = !!expandedCountries[countryKey];
                            const isCountryLoading = !!nodeLoading[countryKey];
                            const vendors = vendorData[countryKey] || [];
                            const match = countryOptions.find((opt) => opt.label === countryName);

                            return (
                              <React.Fragment key={countryKey}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="px-4 py-2 pl-10 whitespace-nowrap min-w-[260px]">
                                    <button
                                      type="button"
                                      onClick={() => toggleCountry(clientName, countryName)}
                                      className="inline-flex items-center space-x-2 text-text-primary dark:text-gray-300 hover:text-amber-600 focus:outline-none group"
                                    >
                                      <ExpandButton isExpanded={isCountryExpanded} />
                                      <div className="flex items-center gap-1.5">
                                        {match?.iso2 && <CountryFlag iso2={match.iso2} />}
                                        <span className="text-xs font-medium">{countryName}</span>
                                      </div>
                                      <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded ml-1">
                                        COUNTRY
                                      </span>
                                    </button>
                                  </td>
                                  <td className="px-2 py-1.5"><DataBarCell value={countryRow.attempts} max={maxAttempts} /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={countryRow.successful} max={maxAttempts} /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={countryRow.submitted} max={maxAttempts} /></td>
                                  <td className="px-2 py-1.5"><DlrCell pct={countryRow.asr_percent} /></td>
                                  <td className="px-2 py-1.5"><DlrCell pct={countryRow.dlr_percent} /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={countryRow.delivered} max={maxAttempts} type="success" /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={countryRow.failed} max={maxAttempts} type="danger" /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={countryRow.revenue} max={maxRevenue} type="currency" /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={countryRow.vendorCost} max={maxRevenue} type="currency" /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={countryRow.marginUsd} max={maxRevenue} type="currency" /></td>
                                  <td className="px-2 py-1.5"><MarginPctCell pct={countryRow.margin_percent} /></td>
                                </tr>

                                {/* LEVEL 2: VENDOR COMPANY ROWS (Directly under Country) */}
                                {isCountryExpanded && (
                                  isCountryLoading ? (
                                    <tr>
                                      <td colSpan={12} className="py-2 pl-14 text-xs text-gray-500 italic">Loading vendor companies...</td>
                                    </tr>
                                  ) : vendors.length === 0 ? (
                                    <tr>
                                      <td colSpan={12} className="py-2 pl-14 text-xs text-gray-400 italic">No vendor company traffic found.</td>
                                    </tr>
                                  ) : (
                                    vendors.map((vendorRow: any, vIdx: number) => {
                                      const vendorName = vendorRow.vendor_company || vendorRow.vendor || `Vendor ${vIdx + 1}`;

                                      return (
                                        <tr
                                          key={`${countryKey}__${vendorName}_${vIdx}`}
                                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-xs text-text-secondary dark:text-gray-400"
                                        >
                                          <td className="px-4 py-2 pl-14 whitespace-nowrap min-w-[260px]">
                                            <div className="inline-flex items-center space-x-2">
                                              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                                {vendorName}
                                              </span>
                                              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded ml-1">
                                                VENDOR
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-2 py-1"><DataBarCell value={vendorRow.attempts} max={maxAttempts} /></td>
                                          <td className="px-2 py-1"><DataBarCell value={vendorRow.successful} max={maxAttempts} /></td>
                                          <td className="px-2 py-1"><DataBarCell value={vendorRow.submitted} max={maxAttempts} /></td>
                                          <td className="px-2 py-1"><DlrCell pct={vendorRow.asr_percent} /></td>
                                          <td className="px-2 py-1"><DlrCell pct={vendorRow.dlr_percent} /></td>
                                          <td className="px-2 py-1"><DataBarCell value={vendorRow.delivered} max={maxAttempts} type="success" /></td>
                                          <td className="px-2 py-1"><DataBarCell value={vendorRow.failed} max={maxAttempts} type="danger" /></td>
                                          <td className="px-2 py-1"><DataBarCell value={vendorRow.revenue} max={maxRevenue} type="currency" /></td>
                                          <td className="px-2 py-1"><DataBarCell value={vendorRow.vendor_cost} max={maxRevenue} type="currency" /></td>
                                          <td className="px-2 py-1"><DataBarCell value={vendorRow.marginUsd} max={maxRevenue} type="currency" /></td>
                                          <td className="px-2 py-1"><MarginPctCell pct={vendorRow.margin_percent} /></td>
                                        </tr>
                                      );
                                    })
                                  )
                                )}
                              </React.Fragment>
                            );
                          })
                        )
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {isFetchingMore && (
          <div className="text-center text-xs text-text-secondary dark:text-gray-400 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsReport;