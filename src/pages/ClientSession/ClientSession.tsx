import React, { useState, useEffect, useRef } from "react";
import { Home, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getClientSessionsApi,
  type ClientSessionData,
} from "../../api/clientSessionApi/clientSessionApi";
import { ClientSessionModal } from "../../components/modals/ClientSession/ClientSessionModal";
import Input from "../../components/ui/Input";
import DatePicker from "../../components/ui/DatePicker";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import AdvancedFilter, {
  type FilterColumn,
} from "../../components/ui/AdvancedFilter";
import ContextMenu, {
  type ContextMenuItem,
} from "../../components/ui/ContextMenu";
import { actionHelper } from "../../helper/action";

// FIXED: Import the timezone formatter
import { formatDateTime } from "../../helper/dateFormatter";

interface ColumnConfig extends FilterColumn {
  render?: (data: ClientSessionData) => React.ReactNode;
  filterKey?: string;
  isSearchOnly?: boolean;
  tableLabel?: string;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_SEARCH_COLUMNS = ["sessionId", "clientUsername", "systemId"];
const DEFAULT_TABLE_COLUMNS = [
  "sessionId",
  "clientUsername",
  "companyName",
  "systemId",
  "remoteIp",
  "status",
  "connectedAt",
];

const ClientSession: React.FC = () => {
  const [data, setData] = useState<ClientSessionData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<ClientSessionData | null>(null);

  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [searchColumns, setSearchColumns] = useState<string[]>(
    DEFAULT_SEARCH_COLUMNS,
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("clientsession_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem(
      "clientsession_table_columns",
      JSON.stringify(tableColumns),
    );
  }, [tableColumns]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const routeName = location.pathname.split("/").pop() || "clientSession";
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasLoggedOpening = useRef(false);
  useEffect(() => {
    if (!hasLoggedOpening.current) {
      setTimeout(() => {
        const activeLinks = document.querySelectorAll(
          "aside a.active, nav a.active",
        );
        const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
        let moduleLabel =
          activeItem?.innerText?.split("\n")[0].trim() || "Module";
        actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
      }, 100);
      hasLoggedOpening.current = true;
    }
  }, []);

  const renderStatusBadge = (status: string) => {
    const isActive = status?.toUpperCase() === "ONLINE";

    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
        }`}
      >
        {status || "UNKNOWN"}
      </span>
    );
  };

  const allColumns: ColumnConfig[] = [
    {
      key: "sessionId",
      label: "Session ID",
      type: "text",
      filterKey: "sessionId__icontains",
    },
    {
      key: "clientUsername",
      label: "Client Username",
      type: "text",
      filterKey: "client__name__icontains",
    },
    { key: "companyName", label: "Company Name", type: "text" },
    {
      key: "systemId",
      label: "System ID",
      type: "text",
      filterKey: "systemId__icontains",
    },
    {
      key: "bindType",
      label: "Bind Type",
      type: "text",
      filterKey: "bindType__icontains",
    },
    {
      key: "remoteIp",
      label: "Remote IP",
      type: "text",
      filterKey: "remoteIp__icontains",
    },
    {
      key: "remotePort",
      label: "Remote Port",
      type: "number",
      filterKey: "remotePort",
    },
    {
      key: "status",
      label: "Status",
      type: "text",
      filterKey: "status__icontains",
      render: (c) => renderStatusBadge(c.status),
    },

    // Date Fields mapped dynamically
    {
      key: "connectedAt",
      label: "Connected At (Exact)",
      tableLabel: "Connected At",
      type: "date",
      filterKey: "connectedAt",
      // FIXED: Implement new timezone cache formatter
      render: (c) =>
        c.connectedAt ? formatDateTime(c.connectedAt) : "-",
    },
    {
      key: "connectedAt__range",
      label: "Connected At (Range)",
      type: "date_range",
      filterKey: "connectedAt",
      isSearchOnly: true,
    },
    {
      key: "connectedAt__gt_lt",
      label: "Connected At (After/Before)",
      type: "date_gt_lt",
      filterKey: "connectedAt",
      isSearchOnly: true,
    },

    {
      key: "boundAt",
      label: "Bound At (Exact)",
      tableLabel: "Bound At",
      type: "date",
      filterKey: "boundAt",
      // FIXED: Implement new timezone cache formatter
      render: (c) => (c.boundAt ? formatDateTime(c.boundAt) : "-"),
    },
    {
      key: "boundAt__range",
      label: "Bound At (Range)",
      type: "date_range",
      filterKey: "boundAt",
      isSearchOnly: true,
    },
    {
      key: "boundAt__gt_lt",
      label: "Bound At (After/Before)",
      type: "date_gt_lt",
      filterKey: "boundAt",
      isSearchOnly: true,
    },

    {
      key: "last_activityAt",
      label: "Last Activity (Exact)",
      tableLabel: "Last Activity",
      type: "date",
      filterKey: "last_activityAt",
      // FIXED: Implement new timezone cache formatter
      render: (c) =>
        c.last_activityAt ? formatDateTime(c.last_activityAt) : "-",
    },
    {
      key: "last_activityAt__range",
      label: "Last Activity (Range)",
      type: "date_range",
      filterKey: "last_activityAt",
      isSearchOnly: true,
    },
    {
      key: "last_activityAt__gt_lt",
      label: "Last Activity (After/Before)",
      type: "date_gt_lt",
      filterKey: "last_activityAt",
      isSearchOnly: true,
    },
  ];

  const visibleSearchFields = allColumns.filter((col) =>
    searchColumns.includes(col.key),
  );
  const visibleTableFields = allColumns.filter((col) =>
    tableColumns.includes(col.key),
  );
  const tableFilterColumns = allColumns
    .filter((c) => !c.isSearchOnly)
    .map((c) => ({ key: c.key, label: c.tableLabel || c.label, type: c.type }));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const fetchData = async (filters: Record<string, string> | null = null) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const newController = new AbortController();
    abortControllerRef.current = newController;
    setIsLoading(true);

    try {
      const activeFilters = filters || filterValues;
      const currentSearchParams: Record<string, string> = {};

      searchColumns.forEach((key) => {
        const value = activeFilters[key];
        if (value) {
          const columnDef = allColumns.find((c) => c.key === key);
          const baseKey = columnDef?.filterKey
            ? columnDef.filterKey.split("__")[0]
            : key.split("__")[0];

          if (columnDef?.type === "date") {
            currentSearchParams[`${baseKey}__range`] =
              `${value}T00:00:00,${value}T23:59:59`;
          } else if (columnDef?.type === "date_range") {
            const [start, end] = value.split(",");
            if (start && end)
              currentSearchParams[`${baseKey}__range`] =
                `${start}T00:00:00,${end}T23:59:59`;
            else {
              if (start)
                currentSearchParams[`${baseKey}__gt`] = `${start}T00:00:00`;
              if (end)
                currentSearchParams[`${baseKey}__lt`] = `${end}T23:59:59`;
            }
          } else if (columnDef?.type === "date_gt_lt") {
            const [gt, lt] = value.split(",");
            if (gt) currentSearchParams[`${baseKey}__gt`] = `${gt}T23:59:59`;
            if (lt) currentSearchParams[`${baseKey}__lt`] = `${lt}T00:00:00`;
          } else if (columnDef?.type === "text") {
            const filterKey = columnDef.filterKey || `${key}__icontains`;
            currentSearchParams[filterKey] = value;
          } else {
            currentSearchParams[columnDef?.filterKey || key] = value;
          }
        }
      });

      const response: any = await getClientSessionsApi(
        routeName,
        currentPage,
        rowsPerPage,
        currentSearchParams,
      );

      if (newController.signal.aborted) return;
      if (response && response.results) {
        // FIX: Map sessionId to id to satisfy DataTable
        const mappedList = response.results.map((item: any) => ({
          ...item,
          id: item.sessionId,
        }));
        setData(mappedList);
        setTotalItems(response.count);
      } else if (Array.isArray(response)) {
        const mappedList = response.map((item: any) => ({
          ...item,
          id: item.sessionId,
        }));
        setData(mappedList);
        setTotalItems(response.length);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name !== "AbortError")
        toast.error("Failed to fetch client sessions.");
    } finally {
      if (abortControllerRef.current === newController) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [routeName, currentPage, rowsPerPage, searchColumns]);

  //real time websocket connection to listen for session updates
  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    const ws = new WebSocket(`${wsBase}/ws/status/`);

    ws.onopen = () => {
      console.log("Client Session Table linked to live SMPP feed");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("⚡ Real-time status update:", data);

        if (data.action === "session_update") {
          const incomingSession = data.session;

          setData((prevData) => {
            const sessionExists = prevData.some(
              (item: any) =>
                item.id === incomingSession.id ||
                item.sessionId === incomingSession.id,
            );

            if (sessionExists) {
              return prevData.map((item: any) =>
                item.id === incomingSession.id ||
                item.sessionId === incomingSession.id
                  ? {
                      ...item,
                      status: incomingSession.status,
                      last_activityAt: new Date().toISOString(),
                    }
                  : item,
              );
            } else if (incomingSession.status === "ONLINE") {
              fetchData();
              return prevData;
            }

            return prevData;
          });
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };

    ws.onclose = () => {
      console.log("Live SMPP feed disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };
  const handleClearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
    fetchData({});
  };

  const handleView = (session: ClientSessionData) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent, item: ClientSessionData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedSession(item);
  };

  const menuItems: ContextMenuItem[] = selectedSession
    ? [
        {
          label: "View Details",
          icon: <Eye size={16} />,
          onClick: () => handleView(selectedSession),
        },
      ]
    : [];

  const tableHeaders = [
    "S.N.",
    ...visibleTableFields.map((col) => col.tableLabel || col.label),
  ];
  const getBaseLabel = (label: string) => label.split(" (")[0].trim();

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
            Client Sessions
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
          <div className="relative z-20">
            <AdvancedFilter
              columns={tableFilterColumns}
              selectedColumns={tableColumns}
              onFilter={setTableColumns}
              onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
              buttonLabel="Columns"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">
            Client Sessions
          </span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        {visibleSearchFields.map((col) => {
          const baseLabel = getBaseLabel(col.label);
          if (col.type === "date")
            return (
              <DatePicker
                key={col.key}
                label={`Search ${baseLabel}`}
                selected={
                  filterValues[col.key] ? new Date(filterValues[col.key]) : null
                }
                onChange={(val: Date | null) =>
                  handleFilterChange(col.key, val ? formatLocalDate(val) : "")
                }
              />
            );
          if (col.type === "date_range") {
            const [startStr, endStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${baseLabel} (From)`}
                  selected={startStr ? new Date(startStr) : null}
                  onChange={(val: Date | null) => {
                    const newStart = val ? formatLocalDate(val) : "";
                    const currentEnd = endStr || "";
                    handleFilterChange(
                      col.key,
                      newStart || currentEnd ? `${newStart},${currentEnd}` : "",
                    );
                  }}
                />
                <DatePicker
                  label={`Search ${baseLabel} (To)`}
                  selected={endStr ? new Date(endStr) : null}
                  onChange={(val: Date | null) => {
                    const newEnd = val ? formatLocalDate(val) : "";
                    const currentStart = startStr || "";
                    handleFilterChange(
                      col.key,
                      currentStart || newEnd ? `${currentStart},${newEnd}` : "",
                    );
                  }}
                />
              </React.Fragment>
            );
          }
          if (col.type === "date_gt_lt") {
            const [gtStr, ltStr] = (filterValues[col.key] || "").split(",");
            return (
              <React.Fragment key={col.key}>
                <DatePicker
                  label={`Search ${baseLabel} (> After)`}
                  selected={gtStr ? new Date(gtStr) : null}
                  onChange={(val: Date | null) => {
                    const newGt = val ? formatLocalDate(val) : "";
                    const currentLt = ltStr || "";
                    handleFilterChange(
                      col.key,
                      newGt || currentLt ? `${newGt},${currentLt}` : "",
                    );
                  }}
                />
                <DatePicker
                  label={`Search ${baseLabel} (< Before)`}
                  selected={ltStr ? new Date(ltStr) : null}
                  onChange={(val: Date | null) => {
                    const newLt = val ? formatLocalDate(val) : "";
                    const currentGt = gtStr || "";
                    handleFilterChange(
                      col.key,
                      currentGt || newLt ? `${currentGt},${newLt}` : "",
                    );
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

      <DataTable
        serverSide={true}
        data={data}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={tableHeaders}
        isLoading={isLoading}
        renderRow={(item, index) => (
          <tr
            key={item.sessionId || index}
            onContextMenu={(e) => handleContextMenu(e, item)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => {
              let cellData = (item as any)[col.key];
              if (col.render)
                return (
                  <td
                    key={col.key}
                    className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
                  >
                    {col.render(item)}
                  </td>
                );
              return (
                <td
                  key={col.key}
                  className={`px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap ${col.key === "sessionId" ? "font-medium text-text-primary dark:text-white" : ""}`}
                >
                  {cellData || "-"}
                </td>
              );
            })}
          </tr>
        )}
      />

      <ContextMenu
        position={contextMenuPos}
        items={menuItems}
        onClose={() => setContextMenuPos(null)}
      />
      <ClientSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessionData={selectedSession}
      />
    </div>
  );
};

export default ClientSession;