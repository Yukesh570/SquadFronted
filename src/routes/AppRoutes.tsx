import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import CreateSidebar from "../pages/module/ModuleList";
import NotFound from "../pages/error/notFound";
import PermissionsTable from "../pages/role/role";
import { useAuth } from "../context/AuthContext";
import ChangePassword from "../pages/Auth/ChangePassword";
// import { ProtectedRoute } from "./protector";
import TemplatePage from "../pages/template/templateInput";
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
import Company from "../pages/Company/Company";
import Vendor from "../pages/Connectivity/Vendor/vendor";
import Smpp from "../pages/Connectivity/Smpp/Smpp";
import Client from "../pages/Client/Client";
import VendorRate from "../pages/Rate/VendorRate";
import CustomerRate from "../pages/Rate/CustomerRate";
import MappingSetup from "../pages/MappingSetup/MappingSetup";
import Operators from "../pages/Operator/Operator";
import UserLog from "../pages/UserLog/UserLog";
import CustomRoute from "../pages/RouteManager/CustomRoute";
import { NavItemsContext } from "../context/navItemsContext";
import { useContext, type JSX } from "react";
import TimeZone from "../pages/settings/Timezone/Timezone";
const componentMap: Record<string, JSX.Element> = {
  dashboard: <Dashboard />,
  createSidebar: <CreateSidebar />,
  role: <PermissionsTable />,
  changePassword: <ChangePassword />,
  template: <TemplatePage />,
  campaign: <CreateCampaignForm />,
  smtp: <SmtpServer />,
  emailTemplate: <EmailTemplatePage />,
  sendMail: <SendMailPage />,
  country: <Country />,
  state: <State />,
  currency: <Currency />,
  entity: <Entity />,
  companyCategory: <CompanyCategory />,
  companyStatus: <CompanyStatus />,
  timeZone: <TimeZone />,
  company: <Company />,
  vendor: <Vendor />,
  smpp: <Smpp />,
  client: <Client />,
  vendorRate: <VendorRate />,
  customerRate: <CustomerRate />,
  mappingSetup: <MappingSetup />,
  operators: <Operators />,
  userLog: <UserLog />,
  customRoute: <CustomRoute />,
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { navItems } = useContext(NavItemsContext);

  type NavUrl = {
    url: string;
    label: string;
  };

  const extractUrlsWithLabels = (items: any[]): NavUrl[] => {
    const result: NavUrl[] = [];
    const walk = (list: any[]) => {
      list.forEach((item) => {
        if (item.url && item.label) {
          result.push({ url: item.url, label: item.label });
        }
        if (item.children && item.children.length > 0) {
          walk(item.children);
        }
      });
    };
    walk(items);
    return result;
  };

  const urls = navItems?.results ? extractUrlsWithLabels(navItems.results) : [];

  if (
    isLoading ||
    !navItems ||
    !navItems.results
    // ||
    // navItems.results.length === 0
  ) {
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

      <Route
        path="/"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        {urls.map((item) => {
          const Component = componentMap[item.url.split("/").pop()!]; // Get last segment of url  as key like setting/role become role
          return <Route key={item.url} path={item.url} element={Component} />;
        })}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;
