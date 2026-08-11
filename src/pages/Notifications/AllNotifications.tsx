import React, { useState, useEffect } from "react";
import { Home, Trash } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getNotificationApi,
  deleteNotificationApi,
  type NotificationData,
} from "../../api/userActionApi/notificationApi";
import Input from "../../components/ui/Input";
import DataTable from "../../components/ui/DataTable";
import FilterCard from "../../components/ui/FilterCard";
import { DeleteModal } from "../../components/modals/DeleteModal";
import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";

interface ColumnConfig {
  key: string;
  label: string;
  render: (notification: NotificationData) => React.ReactNode;
}

const DEFAULT_TABLE_COLUMNS = ["title", "description", "createdAt"];

const AllNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- Context Menu States ---
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedRow, setSelectedRow] = useState<NotificationData | null>(null);

  const [titleFilter, setTitleFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Column Order State & Persistence ---
  const [tableColumns, setTableColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("allnotifications_table_columns");
    return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem("allnotifications_table_columns", JSON.stringify(tableColumns));
  }, [tableColumns]);

  // Column definitions for dynamic rendering & dragging
  const allColumns: ColumnConfig[] = [
    {
      key: "title",
      label: "Title",
      render: (n) => (
        <span className="font-medium text-text-primary dark:text-white">
          {n.title || "-"}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (n) => (
        <span className="max-w-xl truncate block">
          {n.description || "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (n) =>
        n.createdAt
          ? new Date(n.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
    },
  ];

  // Map columns according to custom reordered user preference
  const visibleTableFields = tableColumns
    .map((key) => allColumns.find((col) => col.key === key))
    .filter((col): col is ColumnConfig => Boolean(col));

  const headers = ["S.N.", ...visibleTableFields.map((col) => col.label)];

  const fetchNotifications = async (overrideParams?: Record<string, string>) => {
    setIsLoading(true);
    try {
      // ⚡️ Use title__icontains to match backend partial text filtering
      const currentSearchParams = overrideParams || {
        title__icontains: titleFilter,
      };
      const cleanParams = Object.fromEntries(
        Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
      );
      
      const response: any = await getNotificationApi(
        currentPage,
        rowsPerPage,
        cleanParams
      );

      if (response && response.results) {
        setNotifications(response.results);
        setTotalItems(response.count);
      } else {
        setNotifications([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, rowsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchNotifications();
  };

  const handleClearFilters = () => {
    setTitleFilter("");
    setCurrentPage(1);
    fetchNotifications({ title__icontains: "" });
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteNotificationApi(deleteId);
        toast.success("Notification deleted.");
        fetchNotifications();
      } catch (error) {
        toast.error("Failed to delete notification.");
      }
      setDeleteId(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: NotificationData) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedRow(item);
  };

  const menuItems: ContextMenuItem[] = selectedRow ? [
    { label: "Delete Notification", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRow.id!) },
  ] : [];

  return (
    <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
          All Notifications
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary dark:text-white">Notifications</span>
        </div>
      </div>

      <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
        <Input
          label="Search Title"
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          placeholder="Search notifications..."
          className="md:col-span-2"
        />
      </FilterCard>

      <DataTable
        serverSide={true}
        data={notifications}
        totalItems={totalItems}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        density="compact"
        headers={headers}
        isLoading={isLoading}
        onReorderColumns={(fromIdx, toIdx) => {
          setTableColumns((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            return next;
          });
        }}
        renderRow={(notification, index) => (
          <tr
            key={notification.id || index}
            onContextMenu={(e) => handleContextMenu(e, notification)}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
          >
            <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
              {(currentPage - 1) * rowsPerPage + index + 1}
            </td>
            {visibleTableFields.map((col) => (
              <td
                key={col.key}
                className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
              >
                {col.render(notification)}
              </td>
            ))}
          </tr>
        )}
      />

      <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? It will be permanently removed from your history."
      />
    </div>
  );
};

export default AllNotifications;