import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import UserActivity from "../pages/Users/UserActivity";
import CreateSidebar from "../pages/module/module";
import NotFound from "../pages/error/notFound";
import SignUp from "../pages/Auth/signUp";
import PermissionsTable from "../pages/role/role";

const AppRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

   useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("token"));
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);


 if (isAuthenticated === null) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );
}


  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route path="/signUp" element={<SignUp />} />

      <Route
        path="/"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" />} //parentRoute
      >
        <Route index element={<Navigate to="/dashboard" />} /> //childRoute
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserActivity />} />
        <Route path="createSidebar" element={<CreateSidebar />} />
        <Route path="role" element={<PermissionsTable />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
