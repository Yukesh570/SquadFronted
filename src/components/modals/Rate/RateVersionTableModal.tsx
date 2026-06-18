import React, { useState, useEffect } from "react";
import Modal from "../../ui/Modal";
import { Edit, Trash, Info, Eye } from "lucide-react";
import { StatusBadge } from "../../ui/StatusBadge";
import { DeleteModal } from "../DeleteModal";
import { toast } from "react-toastify";

interface RateVersionTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratePlan: string | null;
  moduleName: string;
  fetchApi: any;
  deleteApi: any;
  onEdit: (rate: any) => void;
  onView: (rate: any) => void;
  onRefresh: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  countryMap?: Record<string, string>;
  timezoneMap?: Record<string, string>;
  isVendorMode?: boolean;
}

export const RateVersionTableModal: React.FC<RateVersionTableModalProps> = ({
  isOpen,
  onClose,
  ratePlan,
  moduleName,
  fetchApi,
  deleteApi,
  onEdit,
  onView,
  onRefresh,
  canUpdate,
  canDelete,
  countryMap = {},
  timezoneMap = {},
  isVendorMode = false,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && ratePlan) {
      fetchVersions();
    } else {
      setVersions([]);
    }
  }, [isOpen, ratePlan]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi(moduleName, 1, 1000, { ratePlan });
      let list = res.results || (Array.isArray(res) ? res : []);
      // Sort by version descending (highest version first)
      list.sort((a: any, b: any) => (b.version || 0) - (a.version || 0));
      setVersions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteApi(deleteId, moduleName);
      toast.success("Rate version deleted successfully.");
      fetchVersions(); // Refresh the inner versions table
      onRefresh(); // Refresh the parent main table
    } catch (error) {
      toast.error("Failed to delete rate version.");
    }
    setDeleteId(null);
  };

  const headers = [
    "Version",
    "Currency",
    ...(isVendorMode ? ["Network"] : []),
    "Country",
    "Time Zone",
    "MCC",
    "MNC",
    "Country Code",
    "Rate",
    "Status",
    "Effective From",
    "Effective To",
    "Actions",
  ];

  const renderCountry = (rate: any) => { 
    if (rate.countryName) return rate.countryName; 
    return countryMap[String(rate.country)] || String(rate.country || "-"); 
  };
  
  const renderTimezone = (rate: any) => { 
    if (rate.timeZoneName) return rate.timeZoneName; 
    return timezoneMap[String(rate.timeZone)] || String(rate.timeZone || "-"); 
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Rate Plan Versions: ${ratePlan || ""}`}
        className="max-w-[95vw] w-full" 
      >
        <div className="p-1 flex flex-col space-y-4">
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Info size={16} className="text-blue-500 shrink-0" />
              <span>
                The highlighted row represents the latest active version. Only the
                latest version can be edited to trigger an upgrade.
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                  {headers.map((h, i) => (
                    <th key={i} className={`py-3 px-4 font-medium whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                      Loading versions...
                    </td>
                  </tr>
                ) : versions.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                      No versions found.
                    </td>
                  </tr>
                ) : (
                  versions.map((v, i) => {
                    const isLatest = i === 0;
                    return (
                      <tr
                        key={v.id}
                        className={`border-b border-gray-100 dark:border-gray-700 ${
                          isLatest
                            ? "bg-blue-50/50 dark:bg-blue-900/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-text-primary dark:text-white whitespace-nowrap">
                          {isLatest && (
                            <span className="mr-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                              Latest
                            </span>
                          )}
                          v{v.version || 0}
                        </td>
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                          {v.currencyCode || "-"}
                        </td>
                        {isVendorMode && (
                          <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                            {v.network || "-"}
                          </td>
                        )}
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                          {renderCountry(v)}
                        </td>
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                          {renderTimezone(v)}
                        </td>
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                          {v.MCC || "-"}
                        </td>
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                          {v.MNC || "-"}
                        </td>
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                          {v.countryCode || "-"}
                        </td>
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 font-medium whitespace-nowrap">
                          {v.rate || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                          {v.effectiveFrom
                            ? new Date(v.effectiveFrom).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-text-secondary dark:text-gray-300 whitespace-nowrap">
                          {v.effectiveTo
                            ? new Date(v.effectiveTo).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => onView(v)}
                              className="text-gray-500 hover:text-gray-700 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            {canUpdate && isLatest && (
                              <button
                                onClick={() => onEdit(v)}
                                className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                title="Edit Latest"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteId(v.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete"
                              >
                                <Trash size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Version"
        message="Are you sure you want to delete this specific version? This action cannot be undone."
      />
    </>
  );
};