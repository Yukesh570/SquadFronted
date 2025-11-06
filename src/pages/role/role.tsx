import { useEffect, useState } from "react";
import {
  getNavByUserType,
  type navUserData,
  updateNavUserRelationBulk,
} from "../../api/navUserRelationApi/navUserRelationApi";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { toast } from "react-toastify";
import { useSidebarContext } from "../../context/sideBarContext";
import ToggleSwitch from "../../components/ui/ToggleSwitch";

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
  const [originalPermissions, setOriginalPermissions] = useState<navUserData[]>([]);
  const [selectedUserType, setSelectedUserType] = useState("ADMIN");
  const [isSaving, setIsSaving] = useState(false);
  const { triggerRefresh } = useSidebarContext();

  const handleToggle = (id: number, key: PermissionKeys) => {
    setPermissions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [key]: !item[key] } : item
      )
    );
  };

  useEffect(() => {
    const fetctSideBar = async () => {
      try {
        const data = await getNavByUserType({ userType: selectedUserType });
        setPermissions(data);
        setOriginalPermissions(data);
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
      const changedPermissions = permissions.filter((currentItem) => {
        const originalItem = originalPermissions.find(
          (item) => item.id === currentItem.id
        );
        return (
          !originalItem ||
          currentItem.read !== originalItem.read ||
          currentItem.write !== originalItem.write ||
          currentItem.delete !== originalItem.delete ||
          currentItem.put !== originalItem.put
        );
      });

      if (changedPermissions.length === 0) {
        toast.info("No changes to save.");
        setIsSaving(false);
        return;
      }

      const dataToSave = changedPermissions.map((item) => ({
        id: item.id!,
        read: item.read,
        write: item.write,
        delete: item.delete,
        put: item.put,
      }));

      await updateNavUserRelationBulk(dataToSave);
      toast.success(`Permissions for ${selectedUserType} saved successfully!`);
      setOriginalPermissions(permissions);
      triggerRefresh();
    } catch (error) {
      toast.error(`Failed to save permissions for ${selectedUserType}.`);
    } finally {
      setIsSaving(false);
    }
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
              permissions.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-1 font-medium text-gray-900 dark:text-white">
                    {item.navigateId?.label || "No label"}
                  </td>

                  {(["read", "write", "delete", "put"] as PermissionKeys[]).map(
                    (key) => (
                      <td key={key} className="px-6 py-2 text-center">
                        <div className="flex justify-center">
                          <ToggleSwitch
                            checked={item[key]}
                            onChange={() => handleToggle(item.id!, key)}
                          />
                        </div>
                      </td>
                    )
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default PermissionsTable;