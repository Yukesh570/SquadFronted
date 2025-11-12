import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import UserActivity from "../pages/Users/UserActivity";
import CreateSidebar from "../pages/module/module";
import NotFound from "../pages/error/notFound";
import SignUp from "../pages/Auth/signUp";
import PermissionsTable from "../pages/role/role";
import { useAuth } from "../context/AuthContext";
import ChangePassword from "../pages/Auth/ChangePassword";
import { ProtectedRoute } from "./protector";
import TemplatePage from "../pages/template/templateInput";
// import AllNotifications from "../pages/Notifications/AllNotifications";
import CreateCampaignForm from "../pages/Campaign/Campaign";
import SmtpServer from "../pages/Smtp/SmtpServer";

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route element={<ProtectedRoute path="users" />}>
          <Route path="users" element={<UserActivity />} />
        </Route>
        <Route element={<ProtectedRoute path="createSidebar" />}>
          <Route path="createSidebar" element={<CreateSidebar />} />
        </Route>
        <Route element={<ProtectedRoute path="role" />}>
          <Route path="role" element={<PermissionsTable />} />
        </Route>
        <Route path="template" element={<TemplatePage />} />
        <Route element={<ProtectedRoute path="campaign" />}>
          <Route path="campaign" element={<CreateCampaignForm />} />
        </Route>
        {/* <Route element={<ProtectedRoute path="smtp" />}> */}
        <Route path="smtp" element={<SmtpServer />} />
        {/* </Route> */}

        {/* <Route element={<ProtectedRoute path="change-password" />}> */}
        <Route path="change-password" element={<ChangePassword />} />
        {/* </Route> */}
        {/* <Route path="notifications" element={<AllNotifications />} /> */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
