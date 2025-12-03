import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import UserActivity from "../pages/Users/UserActivity";
import CreateSidebar from "../pages/module/ModuleList";
import NotFound from "../pages/error/notFound";
import SignUp from "../pages/Auth/signUp";
import PermissionsTable from "../pages/role/role";
import { useAuth } from "../context/AuthContext";
import ChangePassword from "../pages/Auth/ChangePassword";
import { ProtectedRoute } from "./protector";
import TemplatePage from "../pages/template/templateInput";
// import AllNotifications from "../pages/Notifications/AllNotifications";
import CreateCampaignForm from "../pages/Campaign/Campaign";
import SmtpServer from "../pages/settings/Smtp/SmtpServer";
import EmailTemplatePage from "../pages/Email Template/emailTemplate";
import SendMailPage from "../pages/Send Mail/SendMail";
import Country from "../pages/settings/Country/Country";
import State from "../pages/settings/State/state";
import Currency from "../pages/settings/Currency/Currency";
import Entity from "../pages/settings/Entity/Entity";
import CompanyCategory from "../pages/settings/companyCategory/companyCategory";
import CompanyStatus from "../pages/settings/countryStatus/countryStatus";
import Timezone from "../pages/settings/Timezone/Timezone";
import Company from "../pages/Company/Company";
import Vendor from "../pages/Connectivity/Vendor/vendor";
import Smpp from "../pages/Connectivity/Smpp/Smpp";
import Client from "../pages/Client/Client";
import VendorRate from "../pages/Rate/VendorRate";

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
        <Route element={<ProtectedRoute path="emailTemplate" />}>
          <Route path="emailTemplate" element={<EmailTemplatePage />} />
        </Route>
        <Route element={<ProtectedRoute path="sendMail" />}>
          <Route path="sendMail" element={<SendMailPage />} />
        </Route>
        <Route element={<ProtectedRoute path="campaign" />}>
          <Route path="campaign" element={<CreateCampaignForm />} />
        </Route>
        <Route element={<ProtectedRoute path="setting/country" />}>
          <Route path="setting/country" element={<Country />} />
        </Route>
        <Route element={<ProtectedRoute path="setting/smtp" />}>
          <Route path="setting/smtp" element={<SmtpServer />} />
        </Route>
        <Route element={<ProtectedRoute path="setting/state" />}>
          <Route path="setting/state" element={<State />} />
        </Route>
        <Route element={<ProtectedRoute path="setting/currency" />}>
          <Route path="setting/currency" element={<Currency />} />
        </Route>
        <Route element={<ProtectedRoute path="setting/entity" />}>
          <Route path="setting/entity" element={<Entity />} />
        </Route>
        <Route element={<ProtectedRoute path="setting/companyCategory" />}>
          <Route path="setting/companyCategory" element={<CompanyCategory />} />
        </Route>
        <Route element={<ProtectedRoute path="setting/companyStatus" />}>
          <Route path="setting/companyStatus" element={<CompanyStatus />} />
        </Route>
        <Route element={<ProtectedRoute path="setting/timezone" />}>
          <Route path="setting/timezone" element={<Timezone />} />
        </Route>
        <Route element={<ProtectedRoute path="company" />}>
          <Route path="company" element={<Company />} />
        </Route>
        {/* <Route element={<ProtectedRoute path="client" />}> */}
        <Route path="client" element={<Client />} />
        {/* </Route> */}

        {/* Rate */}
        <Route element={<ProtectedRoute path="rate/vendorRate" />}>
          <Route path="rate/vendorRate" element={<VendorRate />} />
        </Route>

        {/* Connectivity */}
        <Route element={<ProtectedRoute path="connectivity/vendor" />}>
          <Route path="connectivity/vendor" element={<Vendor />} />
        </Route>
        <Route element={<ProtectedRoute path="connectivity/smpp" />}>
          <Route path="connectivity/smpp" element={<Smpp />} />
        </Route>

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
