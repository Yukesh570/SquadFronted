import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { NavItemsContext } from "../context/navItemsContext";

interface ProtectedRouteProps {
  path: string;
}

export const ProtectedRoute = ({ path }: ProtectedRouteProps) => {
  const { navItems,loading } = useContext(NavItemsContext);
 if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  const navItem = navItems.find(
    (item) => item.url === path.replace(/^\//, "")
  );
  if (navItem && navItem.permission!.read) {
    return <Outlet />;
  }
  return <Navigate to="/dashboard" replace />;
};
