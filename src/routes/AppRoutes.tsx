import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import CreateSidebar from "../pages/module/ModuleList";
import PermissionsTable from "../pages/role/role";
import { useAuth } from "../context/AuthContext";
import ChangePassword from "../pages/Auth/ChangePassword";
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
import NotFound from "../pages/error/notFound";
import LiveTraffic from "../pages/Report/LiveTraffic";
import MessageReport from "../pages/Report/MessageReport";
import UserAction from "../pages/UserLog/UserAction";
import AddCredit from "../pages/Credit/AddCredit";
import DetailedReport from "../pages/Report/DetailedReport";
import ClientTransaction from "../pages/Transaction/ClientTransaction";
import VendorTransaction from "../pages/Transaction/VendorTransaction";
import InvoiceSetup from "../pages/Finance/InvoiceSetup/InvoiceSetup";
import ClientInvoice from "../pages/Finance/Invoice/ClientInvoice";
import GenerateClientInvoice from "../pages/Finance/Invoice/GenerateClientInvoice";
import VendorInvoice from "../pages/Finance/Invoice/VendorInvoice";
import GenerateVendorInvoice from "../pages/Finance/Invoice/GenerateVendorInvoice";
import AllNotifications from "../pages/Notifications/AllNotifications";
import DLREvent from "../pages/Report/DLREvent";
import MessageAttempt from "../pages/Report/MessageAttempt";
import SmsMessagePart from "../pages/Report/SmsMessagePart";
import ClientPolicy from "../pages/Policy/ClientPolicy";
import VendorPolicy from "../pages/Policy/VendorPolicy";
import OperatorNetworkCode from "../pages/OperatorNetworkCode/OperatorNetworkCode";
// import WhiteListIP from "../pages/WhiteListIP/WhiteListIP";

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
  userAction: <UserAction />,
  customRoute: <CustomRoute />,
  liveTraffic: <LiveTraffic />,
  messageReport: <MessageReport />,
  addCredit: <AddCredit />,
  detailedReport: <DetailedReport/>,
  clientTransaction: <ClientTransaction />,
  vendorTransaction: <VendorTransaction />,
  // whiteListIP: <WhiteListIP />,
  invoiceSetup: <InvoiceSetup />,
  clientInvoice: <ClientInvoice />,
  generateClientInvoice: <GenerateClientInvoice />,
  vendorInvoice: <VendorInvoice/>,
  generateVendorInvoice: <GenerateVendorInvoice/>,
  messageAttempt: <MessageAttempt/>,
  dlrEvent: <DLREvent/>,
  smsMessagePart: <SmsMessagePart/>,
  clientPolicy: <ClientPolicy/>,
  vendorPolicy: <VendorPolicy/>,
  operatorNetworkCode: <OperatorNetworkCode/>
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

  // 1. Initial Auth Check (Is token valid?)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. NOT Authenticated? -> Show Login Routes immediately.
  // (Do NOT wait for navItems, because they won't load for unauth users)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Any other path redirects to Login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // 3. Authenticated? -> NOW we wait for NavItems.
  // If we are logged in but navItems haven't arrived yet, THEN show spinner.
  if (!navItems || !navItems.results || navItems.results.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 4. Authenticated AND NavItems Loaded -> Show Protected App
  const urls = extractUrlsWithLabels(navItems.results);

  return (
    <Routes>
      {/* If logged in user tries to go to login, send to dashboard */}
      <Route path="/login" element={<Navigate to="/dashboard" />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="change-password" element={<ChangePassword />} />
        <Route path="notifications" element={<AllNotifications />} />


        {urls.map((item) => {
          const lastSegment = item.url.split("/").pop();
          const Component = lastSegment ? componentMap[lastSegment] : null;
          return Component ? (
            <Route key={item.url} path={item.url} element={Component} />
          ) : null;
        })}

        {/* NotFound is now safe to uncomment because we waited for navItems above */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
