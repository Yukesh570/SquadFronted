import { useContext, useEffect, useState, Fragment } from "react"; // 1. Moved Fragment
import {
  getNavByUserType,
  type navUserData,
  updateNavUserRelationBulk,
} from "../../api/navUserRelationApi/navUserRelationApi";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { toast } from "react-toastify";
import ToggleSwitch from "../../components/ui/ToggleSwitch";
import { NavItemsContext } from "../../context/navItemsContext";
import { ChevronDown, ChevronRight } from "lucide-react";

const userTypeOptions = [
  { value: "ADMIN", label: "ADMIN" },
  { value: "SALES", label: "SALES" },
  { value: "SUPPORT", label: "SUPPORT" },
  { value: "NOC", label: "NOC" },
  { value: "RATE", label: "RATE" },
  { value: "FINANCE", label: "FINANCE" },
];

type PermissionKeys = "read" | "write" | "delete" | "put";

const PermissionsTable = () => {
  const [permissions, setPermissions] = useState<navUserData[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<navUserData[]>(
    []
  );
  const [selectedUserType, setSelectedUserType] = useState("ADMIN");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const { refreshNavItems } = useContext(NavItemsContext);

  // This is a complex but necessary function for recursive state updates
  const handleToggle = (id: number, key: PermissionKeys) => {
    const updatePermissions = (items: navUserData[]): navUserData[] => {
      return items.map((item) => {
        if (item.permission?.NavRelationid === id) {
          return {
            ...item,
            permission: {
              ...item.permission,
              [key]: !item.permission[key],
            },
          };
        }
        if (item.children) {
          return {
            ...item,
            children: updatePermissions(item.children),
          };
        }
        return item;
      });
    };
    setPermissions((prev) => updatePermissions(prev));
  };

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const fetctSideBar = async () => {
      try {
        const data = await getNavByUserType({ userType: selectedUserType });
        setPermissions(data);
        setOriginalPermissions(data); // Set snapshot for comparison
      } catch (error) {
        toast.error(`Failed to load permissions for ${selectedUserType}.`);
        setPermissions([]);
        setOriginalPermissions([]);
      }
    };
    fetctSideBar();
  }, [selectedUserType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Flattens the nested permission state
      const flattenItems = (items: navUserData[]): navUserData[] =>
        items.flatMap((item) =>
          item.children ? [item, ...flattenItems(item.children)] : [item]
        );

      const flatPermissions = flattenItems(permissions);
      const flatOriginal = flattenItems(originalPermissions);

      // Compares the new state to the original state
      const changedPermissions = flatPermissions.filter((currentItem) => {
        const originalItem = flatOriginal.find((i) => i.id === currentItem.id);
        if (
          !originalItem ||
          !currentItem.permission ||
          !originalItem.permission
        ) {
          return false; // Safety check
        }
        return (
          currentItem.permission.read !== originalItem.permission.read ||
          currentItem.permission.write !== originalItem.permission.write ||
          currentItem.permission.delete !== originalItem.permission.delete ||
          currentItem.permission.put !== originalItem.permission.put
        );
      });

      if (changedPermissions.length === 0) {
        toast.info("No changes to save.");
        setIsSaving(false);
        return;
      }

      // Creates the payload for the backend
      const dataToSave = changedPermissions.map((item) => ({
        id: item.permission!.NavRelationid,
        read: item.permission!.read,
        write: item.permission!.write,
        delete: item.permission!.delete,
        put: item.permission!.put,
      }));

      await updateNavUserRelationBulk(dataToSave);
      toast.success(`Permissions for ${selectedUserType} saved successfully!`);
      setOriginalPermissions(permissions); // Update snapshot
      refreshNavItems(); // Refresh sidebar
    } catch (error) {
      toast.error(`Failed to save permissions for ${selectedUserType}.`);
    } finally {
      setIsSaving(false);
    }
  };

  // This is the new recursive render function
  const renderRows = (items: navUserData[], level = 0) => {
    return items.map((item) => {
      // Safety check for missing permission object
      if (!item.permission) {
        console.warn("Item missing permission object:", item);
        return null;
      }
      return (
        <Fragment key={item.permission.NavRelationid}>
          <tr
            className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
          >
            <td
              className="px-6 py-2 font-medium text-gray-900 dark:text-white flex items-center"
              style={{ paddingLeft: `${level * 20 + 24}px` }}
            >
              {item.children && item.children.length > 0 && (
                <button
                  onClick={() => toggleExpand(item.permission!.NavRelationid!)}
                  className="mr-2 focus:outline-none"
                >
                  {expandedRows.includes(item.permission!.NavRelationid!) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              )}
              {item.label || "No label"}
            </td>

            {(["read", "write", "delete", "put"] as PermissionKeys[]).map(
              (key) => (
                <td key={key} className="px-6 py-2 text-center">
                  <div className="flex justify-center">
                    <ToggleSwitch
                      checked={item.permission![key]}
                      onChange={() =>
                        handleToggle(item.permission!.NavRelationid!, key)
                      }
                    />
                  </div>
                </td>
              )
            )}
          </tr>

          {item.children &&
            item.children.length > 0 &&
            expandedRows.includes(item.permission!.NavRelationid!) &&
            renderRows(item.children, level + 1)}
        </Fragment>
      );
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          User Permissions
        </h2>

        <div className="w-64">
          <Select
            label="Select User Type"
            value={selectedUserType}
            onChange={setSelectedUserType}
            options={userTypeOptions}
            placeholder="Select User Type"
            clearable={false}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300 font-medium uppercase tracking-wider">
                Label
              </th>
              {["Read", "Write", "Delete", "Put"].map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-center text-gray-700 dark:text-gray-300 font-medium uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {permissions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                >
                  No permissions found
                </td>
              </tr>
            ) : (
              renderRows(permissions)
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

// 2. REMOVED the extra Fragment import at the bottom
export default PermissionsTable;
