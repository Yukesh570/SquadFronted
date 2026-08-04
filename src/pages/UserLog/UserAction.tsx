import React, { useState, useEffect, useRef } from "react";
import { Home, History, Eye } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { getUserInformationApi } from "../../api/userLogApi/userLogApi";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import Input from "../../components/ui/Input";
import { UserActionModal } from "../../components/modals/UserActionModal";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
import {
  getUserActionApi,
  type UserActionData,
} from "../../api/userActionApi/LogApi";
import { actionHelper } from "../../helper/action";

const UserAction: React.FC = () => {
  const [logs, setLogs] = useState<UserActionData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [titleFilter, setTitleFilter] = useState("");
  
  const [viewLog, setViewLog] = useState<UserActionData | null>(null);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRowLog, setSelectedRowLog] = useState<UserActionData | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        await getUserInformationApi();
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to fetch user profile.");
      }
    };
    fetchUserInfo();
  }, []);

  const fetchUserLogs = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        title: titleFilter,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== ""),
      );

      const response: any = await getUserActionApi(
        currentPage,
        rowsPerPage,
        cleanParams,
      );

      let rawList: UserActionData[] = [];
      let totalCount = 0;

      if (Array.isArray(response)) {
        rawList = response;
        totalCount = response.length;
      } else if (response && Array.isArray(response.results)) {
        rawList = response.results;
        totalCount = response.count || 0;
      }

      if (rawList.length > 0) {
        const logsWithIds: UserActionData[] = rawList.map((item, index) => ({
          ...item,
          id: (currentPage - 1) * rowsPerPage + index + 1,
        }));
        setLogs(logsWithIds);
        setTotalItems(totalCount);
      } else {
        setLogs([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Log fetch error:", error);
      toast.error("Failed to fetch user actions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLogs();
  }, [currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUserLogs();
  };

  const handleClearFilters = () => {
    setTitleFilter("");
    setCurrentPage(1);
    fetchUserLogs({ title: "" });
  };

  const handleContextMenu = (e: React.MouseEvent, log: UserActionData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRowLog(log);
  };

  const menuItems: ContextMenuItem[] = selectedRowLog ? [
    { 
      label: "View Full Action", 
      icon: <Eye size={16} />, 
      onClick: () => {
        setViewLog(selectedRowLog);
      } 
    },
  ] : [];

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

  const headers = ["S.N.", "UserName", "Module", "Action", "Time"];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 pb-6 sm:px-6 lg:px-8" onClick={() => setContextMenuPos(null)}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          User Action
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">User Action</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Module"
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          placeholder="Client"
          className="md:col-span-3"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={logs}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        headers={headers}
        isLoading={isLoading}
        renderRow={(log, index) => (
          <tr
            key={log.id}
            onContextMenu={(e) => handleContextMenu(e, log)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors cursor-context-menu"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 font-mono">
              {log.username}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">
              {log.title}
            </td>
            {/* FIXED: Removed inline button, simplified to just a truncated container */}
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
              <div className="truncate">
                {log.action}
              </div>
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap">
              <div className="flex items-center gap-2 text-xs">
                <History size={14} className="text-orange-400" />
                {formatDate(log.createdAt)}
              </div>
            </td>
          </tr>
        )}
      />

      <ContextMenu 
        position={contextMenuPos} 
        items={menuItems} 
        onClose={() => setContextMenuPos(null)} 
      />

      <UserActionModal
        isOpen={!!viewLog}
        onClose={() => setViewLog(null)}
        viewLog={viewLog}
      />
    </div>
  );
};

export default UserAction;