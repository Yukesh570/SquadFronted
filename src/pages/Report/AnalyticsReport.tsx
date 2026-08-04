import React, { useState, useEffect, useRef } from "react";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import FilterCard from "../../components/ui/FilterCard";
import DatePicker from "../../components/ui/DatePicker";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import AdvancedFilter, { type FilterColumn } from "../../components/ui/AdvancedFilter";
import { actionHelper } from "../../helper/action";
import {
  getAnalyticsDatesApi,
  getAnalyticsDataApi,
} from "../../api/reportApi/analyticsReportApi";

interface Option {
  label: string;
  value: string;
}

interface ColumnConfig extends FilterColumn {
  filterKey?: string;
  options?: Option[];
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
};

const normalizeDateStr = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}-${parseInt(parts[1], 10)}-${parseInt(parts[2], 10)}`;
};

const rowsOptions = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

const DEFAULT_SEARCH_COLUMNS = ["client_company", "country_name", "vendor_company", "date_range"];

const allColumns: ColumnConfig[] = [
  { key: "client_company", label: "Client Company", type: "text" },
  { key: "vendor_company", label: "Vendor Company", type: "text" },
  { key: "country_name", label: "Country Name", type: "text" },
  { key: "client_name", label: "Client Name", type: "text" },
  { key: "vendor_name", label: "Vendor Name", type: "text" },
  { key: "date_range", label: "Date Range", type: "date_range" },
];

// --- UNIFORM NEUTRAL EXPAND/COLLAPSE (+ / -) BUTTON ---

const ExpandButton: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => {
  return (
    <span className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold leading-none shrink-0 border border-gray-200 dark:border-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
      {isExpanded ? "-" : "+"}
    </span>
  );
};

// --- UNIFORM SIZED SINGLE-BOX COMPONENTS (All strictly h-7) ---

const DataBarCell: React.FC<{
  value: number;
  max: number;
  type?: "volume" | "currency";
}> = ({ value = 0, max = 1, type = "volume" }) => {
  const percentage = Math.min(Math.max((value / (max || 1)) * 100, 4), 100);

  const containerStyle =
    type === "volume"
      ? "bg-sky-50/60 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800"
      : "bg-fuchsia-50/60 dark:bg-fuchsia-950/20 border-fuchsia-300 dark:border-fuchsia-800";

  const fillStyle =
    type === "volume"
      ? "bg-sky-200/90 dark:bg-sky-900/60 border-sky-400 dark:border-sky-700"
      : "bg-fuchsia-200/90 dark:bg-fuchsia-900/60 border-fuchsia-400 dark:border-fuchsia-700";

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
  "DLR %",
  "Delivered",
  "Revenue ($)",
  "Vendor Cost ($)",
  "Margin ($)",
  "Margin %",
];

const AnalyticsReport: React.FC = () => {
  const [dateRows, setDateRows] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  // Advanced search columns & filter values
  const [searchColumns, setSearchColumns] = useState<string[]>(DEFAULT_SEARCH_COLUMNS);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Expanded tree node states
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});

  // Lazy loaded node data
  const [clientData, setClientData] = useState<Record<string, any[]>>({});
  const [countryData, setCountryData] = useState<Record<string, any[]>>({});
  const [vendorData, setVendorData] = useState<Record<string, any[]>>({});

  // Loading indicators for tree nodes
  const [nodeLoading, setNodeLoading] = useState<Record<string, boolean>>({});

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        actionHelper("Analytics", "Opened Analytics Report Module", false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  useEffect(() => {
    fetchDatesAndOverallData();
  }, [currentPage, rowsPerPage]);

  const getActiveFilterParams = () => {
    const params: Record<string, any> = {};

    searchColumns.forEach((key) => {
      const val = filterValues[key];
      if (!val) return;

      if (key === "date_range") {
        const [startRange, endRange] = val.split(",");
        if (startRange) params.start_date = normalizeDateStr(startRange);
        if (endRange) params.end_date = normalizeDateStr(endRange);
      } else {
        params[key] = val;
      }
    });

    return params;
  };

  const fetchDatesAndOverallData = async () => {
    setIsLoading(true);
    try {
      const filterParams = getActiveFilterParams();
      const searchParams: Record<string, any> = {
        page: currentPage,
        page_size: rowsPerPage,
        ...filterParams,
      };

      const datesRes = await getAnalyticsDatesApi(searchParams);
      const rawDates: string[] = Array.isArray(datesRes)
        ? datesRes
        : datesRes.results || [];
      const count = datesRes.count ?? rawDates.length;
      setTotalItems(count);

      const dailyMetricsRes = await getAnalyticsDataApi({
        group_by: "day",
        page_size: 1000,
        ...filterParams,
      });

      const metricsList = Array.isArray(dailyMetricsRes)
        ? dailyMetricsRes
        : dailyMetricsRes.results || [];

      const metricsMap: Record<string, any> = {};
      metricsList.forEach((m: any) => {
        const key = m.period || m.date;
        if (key) {
          metricsMap[key] = m;
          metricsMap[normalizeDateStr(key)] = m;
        }
      });

      const dateRowsWithMetrics = rawDates.map((dateStr: string) => {
        const m = metricsMap[dateStr] || metricsMap[normalizeDateStr(dateStr)] || {};
        return {
          id: dateStr,
          date: dateStr,
          attempts: m.attempts || 0,
          successful: m.successful || 0,
          submitted: m.submitted || 0,
          delivered: m.delivered || 0,
          failed: m.failed || 0,
          revenue: m.revenue || 0,
          vendorCost: m.vendor_cost || 0,
          marginUsd: m.margin_usd || 0,
          dlrPct: m.dlr_percent || 0,
          marginPct: m.margin_percent || 0,
        };
      });

      setDateRows(dateRowsWithMetrics);
      toast.success("Analytics data loaded successfully");
    } catch (error) {
      console.error("Failed to fetch dates:", error);
      toast.error("Failed to retrieve analytics data from backend.");
      setDateRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Level 1: Toggle Date -> Fetch Client Companies
  const toggleDate = async (dateStr: string) => {
    const isCurrentlyExpanded = !!expandedDates[dateStr];
    setExpandedDates((prev) => ({ ...prev, [dateStr]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !clientData[dateStr]) {
      setNodeLoading((prev) => ({ ...prev, [dateStr]: true }));
      try {
        const reqDate = normalizeDateStr(dateStr);
        const filterParams = getActiveFilterParams();
        const res = await getAnalyticsDataApi({
          start_date: reqDate,
          group_by: "client_company",
          ...filterParams,
        });
        const items = Array.isArray(res) ? res : res.results || [];
        setClientData((prev) => ({ ...prev, [dateStr]: items }));
      } catch (err) {
        console.error("Failed to load client companies", err);
        toast.error(`Failed to load client companies for ${dateStr}`);
      } finally {
        setNodeLoading((prev) => ({ ...prev, [dateStr]: false }));
      }
    }
  };

  // Level 2: Toggle Client Company -> Fetch Countries
  const toggleClientCompany = async (dateStr: string, clientCompany: string) => {
    const compositeKey = `${dateStr}__${clientCompany}`;
    const isCurrentlyExpanded = !!expandedClients[compositeKey];
    setExpandedClients((prev) => ({ ...prev, [compositeKey]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !countryData[compositeKey]) {
      setNodeLoading((prev) => ({ ...prev, [compositeKey]: true }));
      try {
        const reqDate = normalizeDateStr(dateStr);
        const filterParams = getActiveFilterParams();
        const res = await getAnalyticsDataApi({
          start_date: reqDate,
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

  // Level 3: Toggle Country -> Fetch Vendor Companies
  const toggleCountry = async (dateStr: string, clientCompany: string, countryName: string) => {
    const compositeKey = `${dateStr}__${clientCompany}__${countryName}`;
    const isCurrentlyExpanded = !!expandedCountries[compositeKey];
    setExpandedCountries((prev) => ({ ...prev, [compositeKey]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !vendorData[compositeKey]) {
      setNodeLoading((prev) => ({ ...prev, [compositeKey]: true }));
      try {
        const reqDate = normalizeDateStr(dateStr);
        const filterParams = getActiveFilterParams();
        const res = await getAnalyticsDataApi({
          start_date: reqDate,
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

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setExpandedDates({});
    setExpandedClients({});
    setExpandedCountries({});
    setClientData({});
    setCountryData({});
    setVendorData({});
    fetchDatesAndOverallData();
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
    setExpandedDates({});
    setExpandedClients({});
    setExpandedCountries({});
    setClientData({});
    setCountryData({});
    setVendorData({});
    fetchDatesAndOverallData();
  };

  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginationLabel = `${
    totalItems === 0 ? 0 : startIndex + 1
  }-${Math.min(startIndex + dateRows.length, totalItems)} of ${totalItems}`;

  const maxAttempts = Math.max(...dateRows.map((d) => d.attempts || 1), 100);
  const maxRevenue = Math.max(...dateRows.map((d) => d.revenue || 1), 10);

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
          <span className="text-text-primary dark:text-white">Report</span>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Analytics</span>
        </div>
      </div>

      {/* Dynamic Filter Card */}
      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          const baseLabel = getBaseLabel(col.label);
          if (col.options) {
            return (
              <Select
                key={col.key}
                label={`Search ${baseLabel}`}
                value={filterValues[col.key] || ""}
                onChange={(val) => handleFilterChange(col.key, val)}
                options={col.options}
                placeholder={`Select ${baseLabel}`}
              />
            );
          }
          if (col.type === "date_range") {
            const [startRange, endRange] = (filterValues[col.key] || "").split(",");
            const startStr = startRange ? startRange.split("T")[0] : "";
            const endStr = endRange ? endRange.split("T")[0] : "";

            return (
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${baseLabel} (From)`}
                  selected={startStr ? new Date(startStr) : null}
                  onChange={(val: Date | null) => {
                    const newStart = val ? formatLocalDate(val) : "";
                    const currentEnd = endStr || "";
                    handleFilterChange(col.key, `${newStart},${currentEnd}`);
                  }}
                />
                <DatePicker
                  label={`Search ${baseLabel} (To)`}
                  selected={endStr ? new Date(endStr) : null}
                  onChange={(val: Date | null) => {
                    const newEnd = val ? formatLocalDate(val) : "";
                    const currentStart = startStr || "";
                    handleFilterChange(col.key, `${currentStart},${newEnd}`);
                  }}
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
      <div className="mt-6 rounded-xl bg-white shadow-card overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col relative z-0 app-data-table">
        
        {/* Exact DataTable Top Bar Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4 gap-4 bg-white dark:bg-gray-800 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary dark:text-gray-400 whitespace-nowrap">
                Rows per page:
              </span>
              <div className="w-24 shrink-0">
                <Select
                  value={String(rowsPerPage)}
                  onChange={(val) => {
                    setRowsPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                  options={rowsOptions}
                  clearable={false}
                />
              </div>
            </div>
            <span className="text-sm text-text-secondary dark:text-gray-400 whitespace-nowrap">
              {paginationLabel}
            </span>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                title="Previous Page"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages || totalItems === 0 || isLoading}
                title="Next Page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Data Table with High Z-Index Opaque Sticky Header */}
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
              ) : dateRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="px-4 py-12 text-center text-text-secondary dark:text-gray-400"
                  >
                    No analytics records found.
                  </td>
                </tr>
              ) : (
                dateRows.map((dateRow) => {
                  const dateStr = dateRow.date;
                  const isDateExpanded = !!expandedDates[dateStr];
                  const isDateLoading = !!nodeLoading[dateStr];
                  const clients = clientData[dateStr] || [];

                  return (
                    <React.Fragment key={dateStr}>
                      {/* LEVEL 0: DATE ROW */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-semibold">
                        <td className="px-4 py-2.5 whitespace-nowrap min-w-[260px]">
                          <button
                            type="button"
                            onClick={() => toggleDate(dateStr)}
                            className="inline-flex items-center space-x-2 text-primary hover:underline focus:outline-none group"
                          >
                            <ExpandButton isExpanded={isDateExpanded} />
                            <span className="font-mono text-xs font-semibold">{dateStr}</span>
                          </button>
                        </td>
                        <td className="px-2 py-2"><DataBarCell value={dateRow.attempts} max={maxAttempts} /></td>
                        <td className="px-2 py-2"><DataBarCell value={dateRow.successful} max={maxAttempts} /></td>
                        <td className="px-2 py-2"><DataBarCell value={dateRow.submitted} max={maxAttempts} /></td>
                        <td className="px-2 py-2"><DlrCell pct={dateRow.dlrPct} /></td>
                        <td className="px-2 py-2"><DataBarCell value={dateRow.delivered} max={maxAttempts} /></td>
                        <td className="px-2 py-2"><DataBarCell value={dateRow.revenue} max={maxRevenue} type="currency" /></td>
                        <td className="px-2 py-2"><DataBarCell value={dateRow.vendorCost} max={maxRevenue} type="currency" /></td>
                        <td className="px-2 py-2"><DataBarCell value={dateRow.marginUsd} max={maxRevenue} type="currency" /></td>
                        <td className="px-2 py-2"><MarginPctCell pct={dateRow.marginPct} /></td>
                      </tr>

                      {/* LEVEL 1: CLIENT COMPANY ROWS */}
                      {isDateExpanded && (
                        isDateLoading ? (
                          <tr>
                            <td colSpan={10} className="py-3 pl-10 text-xs text-gray-500 italic">Loading client companies...</td>
                          </tr>
                        ) : clients.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-3 pl-10 text-xs text-gray-400 italic">No client company traffic found for {dateStr}.</td>
                          </tr>
                        ) : (
                          clients.map((clientRow: any, cIdx: number) => {
                            const clientName = clientRow.client_company || clientRow.client || `Client ${cIdx + 1}`;
                            const clientKey = `${dateStr}__${clientName}`;
                            const isClientExpanded = !!expandedClients[clientKey];
                            const isClientLoading = !!nodeLoading[clientKey];
                            const countries = countryData[clientKey] || [];

                            return (
                              <React.Fragment key={clientKey}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="px-4 py-2 pl-10 whitespace-nowrap min-w-[260px]">
                                    <button
                                      type="button"
                                      onClick={() => toggleClientCompany(dateStr, clientName)}
                                      className="inline-flex items-center space-x-2 text-text-primary dark:text-gray-200 hover:text-primary focus:outline-none group"
                                    >
                                      <ExpandButton isExpanded={isClientExpanded} />
                                      <span className="text-xs font-medium">{clientName}</span>
                                      <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded ml-1">
                                        CLIENT
                                      </span>
                                    </button>
                                  </td>
                                  <td className="px-2 py-1.5"><DataBarCell value={clientRow.attempts} max={maxAttempts} /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={clientRow.successful} max={maxAttempts} /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={clientRow.submitted} max={maxAttempts} /></td>
                                  <td className="px-2 py-1.5"><DlrCell pct={clientRow.dlr_percent} /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={clientRow.delivered} max={maxAttempts} /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={clientRow.revenue} max={maxRevenue} type="currency" /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={clientRow.vendor_cost} max={maxRevenue} type="currency" /></td>
                                  <td className="px-2 py-1.5"><DataBarCell value={clientRow.margin_usd} max={maxRevenue} type="currency" /></td>
                                  <td className="px-2 py-1.5"><MarginPctCell pct={clientRow.margin_percent} /></td>
                                </tr>

                                {/* LEVEL 2: COUNTRY ROWS */}
                                {isClientExpanded && (
                                  isClientLoading ? (
                                    <tr>
                                      <td colSpan={10} className="py-2 pl-16 text-xs text-gray-500 italic">Loading countries...</td>
                                    </tr>
                                  ) : countries.length === 0 ? (
                                    <tr>
                                      <td colSpan={10} className="py-2 pl-16 text-xs text-gray-400 italic">No country data found.</td>
                                    </tr>
                                  ) : (
                                    countries.map((countryRow: any, coIdx: number) => {
                                      const countryName = countryRow.country || countryRow.country_name || `Country ${coIdx + 1}`;
                                      const countryKey = `${dateStr}__${clientName}__${countryName}`;
                                      const isCountryExpanded = !!expandedCountries[countryKey];
                                      const isCountryLoading = !!nodeLoading[countryKey];
                                      const vendors = vendorData[countryKey] || [];

                                      return (
                                        <React.Fragment key={countryKey}>
                                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-2 pl-16 whitespace-nowrap min-w-[260px]">
                                              <button
                                                type="button"
                                                onClick={() => toggleCountry(dateStr, clientName, countryName)}
                                                className="inline-flex items-center space-x-2 text-text-primary dark:text-gray-300 hover:text-amber-600 focus:outline-none group"
                                              >
                                                <ExpandButton isExpanded={isCountryExpanded} />
                                                <span className="text-xs font-medium">{countryName}</span>
                                                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded ml-1">
                                                  COUNTRY
                                                </span>
                                              </button>
                                            </td>
                                            <td className="px-2 py-1.5"><DataBarCell value={countryRow.attempts} max={maxAttempts} /></td>
                                            <td className="px-2 py-1.5"><DataBarCell value={countryRow.successful} max={maxAttempts} /></td>
                                            <td className="px-2 py-1.5"><DataBarCell value={countryRow.submitted} max={maxAttempts} /></td>
                                            <td className="px-2 py-1.5"><DlrCell pct={countryRow.dlr_percent} /></td>
                                            <td className="px-2 py-1.5"><DataBarCell value={countryRow.delivered} max={maxAttempts} /></td>
                                            <td className="px-2 py-1.5"><DataBarCell value={countryRow.revenue} max={maxRevenue} type="currency" /></td>
                                            <td className="px-2 py-1.5"><DataBarCell value={countryRow.vendor_cost} max={maxRevenue} type="currency" /></td>
                                            <td className="px-2 py-1.5"><DataBarCell value={countryRow.margin_usd} max={maxRevenue} type="currency" /></td>
                                            <td className="px-2 py-1.5"><MarginPctCell pct={countryRow.margin_percent} /></td>
                                          </tr>

                                          {/* LEVEL 3: VENDOR COMPANY ROWS */}
                                          {isCountryExpanded && (
                                            isCountryLoading ? (
                                              <tr>
                                                <td colSpan={10} className="py-2 pl-24 text-xs text-gray-500 italic">Loading vendor companies...</td>
                                              </tr>
                                            ) : vendors.length === 0 ? (
                                              <tr>
                                                <td colSpan={10} className="py-2 pl-24 text-xs text-gray-400 italic">No vendor company traffic found.</td>
                                              </tr>
                                            ) : (
                                              vendors.map((vendorRow: any, vIdx: number) => {
                                                const vendorName = vendorRow.vendor_company || vendorRow.vendor || `Vendor ${vIdx + 1}`;

                                                return (
                                                  <tr
                                                    key={`${countryKey}__${vendorName}_${vIdx}`}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-xs text-text-secondary dark:text-gray-400"
                                                  >
                                                    <td className="px-4 py-2 pl-24 flex items-center space-x-2 whitespace-nowrap min-w-[260px]">
                                                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                                        {vendorName}
                                                      </span>
                                                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded ml-1">
                                                        VENDOR
                                                      </span>
                                                    </td>
                                                    <td className="px-2 py-1"><DataBarCell value={vendorRow.attempts} max={maxAttempts} /></td>
                                                    <td className="px-2 py-1"><DataBarCell value={vendorRow.successful} max={maxAttempts} /></td>
                                                    <td className="px-2 py-1"><DataBarCell value={vendorRow.submitted} max={maxAttempts} /></td>
                                                    <td className="px-2 py-1"><DlrCell pct={vendorRow.dlr_percent} /></td>
                                                    <td className="px-2 py-1"><DataBarCell value={vendorRow.delivered} max={maxAttempts} /></td>
                                                    <td className="px-2 py-1"><DataBarCell value={vendorRow.revenue} max={maxRevenue} type="currency" /></td>
                                                    <td className="px-2 py-1"><DataBarCell value={vendorRow.vendor_cost} max={maxRevenue} type="currency" /></td>
                                                    <td className="px-2 py-1"><DataBarCell value={vendorRow.margin_usd} max={maxRevenue} type="currency" /></td>
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
                        )
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport;