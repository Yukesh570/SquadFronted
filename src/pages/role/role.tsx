import { useEffect, useState } from "react";
import {
  getNavByUserType,
  type navUserData,
} from "../../api/navUserRelationApi/navUserRelationApi";

interface PermissionItem {
  id: number;
  userType: string;
  label: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  put: boolean;
}
type PermissionKeys = "read" | "write" | "delete" | "put";

const initialData: PermissionItem[] = [
  {
    id: 1,
    userType: "ADMIN",
    label: "Dashboard",
    read: false,
    write: false,
    delete: false,
    put: false,
  },
  {
    id: 2,
    userType: "ADMIN",
    label: "User",
    read: false,
    write: false,
    delete: false,
    put: false,
  },
];

const PermissionsTable = () => {
  const [permissions, setPermissions] = useState<navUserData[]>([]);

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
        const data = await getNavByUserType({ userType: "ADMIN" });
        console.log("data!!!!!", data);
        setPermissions(data);
      } catch (error) {
        console.log("Error during the sidebarcall api", error);
      }
    };
    fetctSideBar();
  }, []);
  const handleSave = () => {
    console.log("Updated permissions:", permissions);
    // TODO: Send to API
  };

  console.log("permissions", permissions);
    return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        User Permissions
      </h2>

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
            {permissions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                >
                  No permissions found
                </td>
              </tr>
            )}
            {permissions.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-1 font-medium text-gray-900 dark:text-white">
                  {item.navigateId?.label || "No label"}
                </td>
                {(["read", "write", "delete", "put"] as PermissionKeys[]).map(
                  (key) => (
                    <td
                      key={key}
                      className="px-6 py-2 text-center text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={item[key]}
                        onChange={() => handleToggle(item.id!, key)}
                        className="w-6 h-6 mt-1 accent-blue-500 cursor-pointer rounded"
                      />
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow hover:from-blue-600 hover:to-indigo-700 transition-all"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default PermissionsTable;
