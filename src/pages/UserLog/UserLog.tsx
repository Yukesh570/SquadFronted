import React, { useState, useEffect } from "react";
import {
  Home,
  History,
  Smartphone,
  Globe,
  Monitor,
  User,
  Phone,
  Mail,
  Shield,
  Hash,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getUserInformationApi,
  getUserLogApi,
  type UserInformationData,
  type LoginHistoryItem,
} from "../../api/userLogApi/userLogApi";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import Input from "../../components/ui/Input";

interface LogItemWithId extends LoginHistoryItem {
  id: number;
}

const UserLog: React.FC = () => {
  const [userData, setUserData] = useState<UserInformationData | null>(null);
  const [logs, setLogs] = useState<LogItemWithId[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter States
  const [ipFilter, setIpFilter] = useState("");
  const [browserFilter, setBrowserFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");

  // 1. Fetch User Profile
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const data = await getUserInformationApi();
        setUserData(data);
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to fetch user profile.");
      }
    };
    fetchUserInfo();
  }, []);

  // 2. Fetch User Logs
  const fetchUserLogs = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const currentSearchParams = overrideParams || {
        ipAddress: ipFilter,
        browser: browserFilter,
        device: deviceFilter,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );

      const response: any = await getUserLogApi(
        currentPage,
        rowsPerPage,
        cleanParams
      );

      let rawList: LoginHistoryItem[] = [];
      let totalCount = 0;

      if (Array.isArray(response)) {
        rawList = response;
        totalCount = response.length;
      } else if (response && Array.isArray(response.results)) {
        rawList = response.results;
        totalCount = response.count || 0;
      }

      if (rawList.length > 0) {
        const logsWithIds: LogItemWithId[] = rawList.map((item, index) => ({
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
      toast.error("Failed to fetch login history.");
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
    setIpFilter("");
    setBrowserFilter("");
    setDeviceFilter("");
    setCurrentPage(1);
    fetchUserLogs({ ipAddress: "", browser: "", device: "" });
  };

  const getLatestLoginDisplay = () => {
    if (logs.length > 0) {
      return logs[0].loggedAt;
    }
    return userData?.last_login;
  };

  const headers = ["S.N.", "IP Address", "Browser", "Device", "Logged At"];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 pb-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          User Log & Profile
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">User Log</span>
        </div>
      </div>

      {userData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
            User Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-300">
                <Hash size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  User ID
                </p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {userData.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Username
                </p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {userData.username}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Role
                </p>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                  {userData.userType}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Phone
                </p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {userData.phone || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Email
                </p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {userData.email || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <History size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Last Login
                </p>
                <p className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                  {formatDate(getLatestLoginDisplay())}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search IP"
          value={ipFilter}
          onChange={(e) => setIpFilter(e.target.value)}
          placeholder="e.g. 192.168"
        />
        <Input
          label="Search Browser"
          value={browserFilter}
          onChange={(e) => setBrowserFilter(e.target.value)}
          placeholder="e.g. Chrome"
        />
        <Input
          label="Search Device"
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          placeholder="e.g. Mobile"
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
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 font-mono">
              {log.ipAddress}
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-blue-400" />
                {log.browser}
              </div>
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <div className="flex items-center gap-2">
                {log.device === "Desktop" ? (
                  <Monitor size={14} className="text-gray-500" />
                ) : (
                  <Smartphone size={14} className="text-gray-500" />
                )}
                {log.device}
              </div>
            </td>
            <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
              <div className="flex items-center gap-2">
                <History size={14} className="text-orange-400" />
                {formatDate(log.loggedAt)}
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default UserLog;
