import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Trash } from "lucide-react";
import {
  getCustomRoutesApi,
  updateCustomRouteApi,
  type CustomRouteData,
} from "../../api/routeManagerApi/customRouteApi";
import { EditableCell } from "./EditableCell";
import { formatDateTime } from "../../helper/dateFormatter";
import Select from "./Select";
import DatePicker from "./DatePicker";
import Input from "./Input";

type ExtendedCustomRouteData = CustomRouteData & {
  MCC?: string;
  MNC?: string;
};

interface SubRouteEditableTableProps {
  routeGroup: string;
  moduleName: string;
  canUpdate: boolean;
  canDelete: boolean;
  onDelete: (id: number) => void;
  refreshTrigger?: number;
}

const ReadOnlyCell = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 text-text-secondary dark:text-gray-400 border-r border-b dark:border-gray-700 cursor-not-allowed select-none bg-gray-50/50 dark:bg-gray-800/20">
    {children}
  </td>
);

const FilterInput = ({
  fieldKey,
  placeholder,
  value,
  onChange,
  minWidth = "120px",
}: {
  fieldKey: string;
  placeholder: string;
  value: string;
  onChange: (key: string, val: string) => void;
  minWidth?: string;
}) => (
  <div className="w-full filter-control-wrapper" style={{ minWidth }}>
    <Input
      label=""
      name={fieldKey}
      value={value || ""}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(fieldKey, e.target.value)
      }
      placeholder={placeholder}
    />
  </div>
);

export const SubRouteEditableTable: React.FC<SubRouteEditableTableProps> = ({
  routeGroup,
  moduleName,
  canUpdate,
  canDelete,
  onDelete,
  refreshTrigger,
}) => {
  const [data, setData] = useState<ExtendedCustomRouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCellId, setActiveCellId] = useState<string | null>(null);

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {},
  );

  const fetchSubRoutes = () => {
    setLoading(true);
    getCustomRoutesApi(moduleName, 1, 100, { routeGroup })
      .then((res) => {
        setData(res.results || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load sub-routes");
        setLoading(false);
      });
  };

  useEffect(() => {
    if (routeGroup) fetchSubRoutes();
  }, [routeGroup, moduleName, refreshTrigger]);

  const handleTableClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).tagName === "DIV" &&
      (e.target as HTMLElement).classList.contains("custom-grid-scroll")
    ) {
      setActiveCellId(null);
    }
  };

  const handleInlineSave = async (
    id: number,
    field: string,
    newValue: string,
  ) => {
    setActiveCellId(null);

    const originalRow = data.find((r) => r.id === id);
    if (!originalRow || (originalRow as any)[field] === newValue) return;

    let updatePayload: any = { [field]: newValue };

    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: newValue } : r)),
    );

    try {
      await updateCustomRouteApi(id, updatePayload, moduleName);
      toast.success(`Updated ${field}`);
    } catch (err) {
      toast.error(`Failed to update ${field}`);
      setData((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, [field]: (originalRow as any)[field] } : r,
        ),
      );
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const filteredData = data.filter((row: any) => {
    return Object.keys(columnFilters).every((key) => {
      const filterValue = columnFilters[key]?.toLowerCase();
      if (!filterValue) return true;

      let rowValue = "";
      if (key === "createdAt") {
        rowValue = row[key] ? row[key].split("T")[0] : "";
        return rowValue === filterValue;
      } else {
        rowValue = String(row[key] || "").toLowerCase();
      }

      return rowValue.includes(filterValue);
    });
  });

  if (loading)
    return (
      <div className="p-20 text-center text-gray-500 animate-pulse font-medium">
        Fetching details...
      </div>
    );

  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];
  const priorityOptions = ["1", "2", "3", "4", "5"].map((v) => ({
    label: v,
    value: v,
  }));

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm max-h-[70vh] custom-grid-scroll ${data.length > 3 ? "overflow-auto" : "overflow-visible"}`}
      onClick={handleTableClick}
    >
      <table className="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
        <thead className="bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-gray-300 sticky top-0 z-20">
          <tr>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600">
              Route Name
            </th>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600">
              Country
            </th>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600">
              MCC
            </th>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600">
              MNC
            </th>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600">
              Terminating Company
            </th>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600">
              Terminating Vendor
            </th>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600 w-[140px]">
              Priority
            </th>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600 w-[140px]">
              Status
            </th>
            <th className="px-4 py-2 font-bold border-b border-r dark:border-gray-600 min-w-[150px]">
              Created At
            </th>
            {canDelete && (
              <th className="px-4 py-2 font-bold border-b dark:border-gray-600 text-center sticky right-0 bg-gray-100 dark:bg-gray-800 shadow-l z-30">
                Action
              </th>
            )}
          </tr>

          <tr className="bg-gray-50 dark:bg-gray-800/80">
            <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
              <FilterInput
                fieldKey="name"
                placeholder="Search..."
                value={columnFilters["name"]}
                onChange={handleFilterChange}
                minWidth="120px"
              />
            </th>
            <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
              <FilterInput
                fieldKey="countryName"
                placeholder="Search..."
                value={columnFilters["countryName"]}
                onChange={handleFilterChange}
                minWidth="100px"
              />
            </th>
            <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
              <FilterInput
                fieldKey="MCC"
                placeholder="Search..."
                value={columnFilters["MCC"]}
                onChange={handleFilterChange}
                minWidth="70px"
              />
            </th>
            <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
              <FilterInput
                fieldKey="MNC"
                placeholder="Search..."
                value={columnFilters["MNC"]}
                onChange={handleFilterChange}
                minWidth="70px"
              />
            </th>
            <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
              <FilterInput
                fieldKey="terminatingCompanyName"
                placeholder="Search..."
                value={columnFilters["terminatingCompanyName"]}
                onChange={handleFilterChange}
                minWidth="140px"
              />
            </th>
            <th className="p-1 border-b border-r dark:border-gray-600 font-normal">
              <FilterInput
                fieldKey="terminatingVendorProfileName"
                placeholder="Search..."
                value={columnFilters["terminatingVendorProfileName"]}
                onChange={handleFilterChange}
                minWidth="120px"
              />
            </th>

            <th className="p-1 border-b border-r dark:border-gray-600 font-normal relative z-[60]">
              <div
                className="w-full filter-control-wrapper"
                style={{ minWidth: "90px" }}
              >
                <Select
                  label=""
                  value={columnFilters["priority"] || ""}
                  onChange={(val) => handleFilterChange("priority", val)}
                  options={[{ label: "All", value: "" }, ...priorityOptions]}
                  placeholder="All"
                  placement="bottom"
                />
              </div>
            </th>

            <th className="p-1 border-b border-r dark:border-gray-600 font-normal relative z-[60]">
              <div
                className="w-full filter-control-wrapper"
                style={{ minWidth: "100px" }}
              >
                <Select
                  label=""
                  value={columnFilters["status"] || ""}
                  onChange={(val) => handleFilterChange("status", val)}
                  options={[{ label: "All", value: "" }, ...statusOptions]}
                  placeholder="All"
                  placement="bottom"
                />
              </div>
            </th>

            <th className="p-1 border-b border-r dark:border-gray-600 font-normal relative z-[60]">
              <div
                className="w-full filter-control-wrapper"
                style={{ minWidth: "130px" }}
              >
                <DatePicker
                  label=""
                  selected={
                    columnFilters["createdAt"]
                      ? new Date(columnFilters["createdAt"])
                      : null
                  }
                  onChange={(date: Date | null) =>
                    handleFilterChange(
                      "createdAt",
                      date ? formatLocalDate(date) : "",
                    )
                  }
                />
              </div>
            </th>
            {canDelete && (
              <th className="p-1 border-b dark:border-gray-600 sticky right-0 bg-gray-50 dark:bg-gray-800/80 shadow-l z-30"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((route: ExtendedCustomRouteData) => (
            <tr
              key={route.id}
              className="hover:bg-blue-50/40 dark:hover:bg-primary/5 transition-colors relative z-0 hover:z-10 focus-within:z-50 group"
            >
              <ReadOnlyCell>{route.name || "-"}</ReadOnlyCell>
              <ReadOnlyCell>{route.countryName || "-"}</ReadOnlyCell>
              <ReadOnlyCell>{route.MCC || "-"}</ReadOnlyCell>
              <ReadOnlyCell>{route.MNC || "-"}</ReadOnlyCell>
              <ReadOnlyCell>{route.terminatingCompanyName || "-"}</ReadOnlyCell>
              <ReadOnlyCell>
                {route.terminatingVendorProfileName || "-"}
              </ReadOnlyCell>

              <td className="p-1.5 border-r border-b dark:border-gray-700 overflow-visible bg-white dark:bg-gray-900">
                <EditableCell
                  value={route.priority}
                  type="select"
                  options={priorityOptions}
                  onSave={(val) => handleInlineSave(route.id!, "priority", val)}
                  disabled={!canUpdate}
                  isEditing={activeCellId === `${route.id}-priority`}
                  onEditStart={() => setActiveCellId(`${route.id}-priority`)}
                  onEditEnd={() => setActiveCellId(null)}
                />
              </td>
              <td className="p-1.5 border-r border-b dark:border-gray-700 overflow-visible bg-white dark:bg-gray-900">
                <EditableCell
                  value={route.status}
                  type="select"
                  options={statusOptions}
                  onSave={(val) => handleInlineSave(route.id!, "status", val)}
                  disabled={!canUpdate}
                  isEditing={activeCellId === `${route.id}-status`}
                  onEditStart={() => setActiveCellId(`${route.id}-status`)}
                  onEditEnd={() => setActiveCellId(null)}
                />
              </td>
              <ReadOnlyCell>
                {route.createdAt ? formatDateTime(route.createdAt) : "-"}
              </ReadOnlyCell>

              {canDelete && (
                <td className="px-4 py-2 text-center sticky right-0 bg-white dark:bg-gray-900 border-l border-b dark:border-gray-700 z-10">
                  <button
                    onClick={() => onDelete(route.id!)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                    title="Delete Route"
                  >
                    <Trash size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {filteredData.length === 0 && (
            <tr>
              <td
                colSpan={12}
                className="px-4 py-8 text-center text-gray-500 bg-white dark:bg-gray-900 border-b dark:border-gray-700"
              >
                {data.length > 0
                  ? "No routes match your search filters."
                  : "No sub-routes configured for this group."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-grid-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-grid-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .dark .custom-grid-scroll::-webkit-scrollbar-track { background: #1f2937; }
        .custom-grid-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-grid-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .filter-control-wrapper label {
           display: none !important;
        }
        .filter-control-wrapper > div {
           margin-bottom: 0 !important;
        }
        
        /* Base styles for standard inputs and selects */
        .filter-control-wrapper input:not(.react-datepicker-ignore-class),
        .filter-control-wrapper select,
        .filter-control-wrapper button {
           min-height: 28px !important;
           height: 28px !important;
           padding-top: 2px !important;
           padding-bottom: 2px !important;
           padding-left: 6px !important;
           padding-right: 6px !important;
           font-size: 12px !important;
           border-radius: 4px !important;
        }
        
        /* FIX: Specifically target the DatePicker input to add padding for the calendar icon */
        .filter-control-wrapper .react-datepicker__input-container input {
           min-height: 28px !important;
           height: 28px !important;
           padding-top: 2px !important;
           padding-bottom: 2px !important;
           padding-left: 34px !important; /* Forces the text away from the left-aligned calendar icon */
           padding-right: 6px !important;
           font-size: 12px !important;
           border-radius: 4px !important;
        }
      `,
        }}
      />
    </div>
  );
};
