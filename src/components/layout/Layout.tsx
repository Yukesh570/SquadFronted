import { useState, useEffect, useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { NavItemsContext } from "../../context/navItemsContext";
import { getGeneralSettingsApi } from "../../api/settingApi/generalSettingsApi/generalSettingsApi";

const Layout = () => {
  // If no saved state found, default to 'false' (Expanded)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem("sidebar_collapsed");
    return savedState ? JSON.parse(savedState) : false;
  });

  // Mobile: Open/Closed (Drawer) state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const location = useLocation();
  const { navItems } = useContext(NavItemsContext);

  useEffect(() => {
    localStorage.setItem(
      "sidebar_collapsed",
      JSON.stringify(isSidebarCollapsed)
    );
  }, [isSidebarCollapsed]);

  // Auto-fetch and cache the global timezone when the app loads
  useEffect(() => {
    const initializeTimezone = async () => {
      try {
        const response = await getGeneralSettingsApi("generalSettings");
        if (response && response.defaultTimezone) {
          localStorage.setItem("app_timezone", response.defaultTimezone);
        }
      } catch (error) {
        console.error("Failed to fetch initial timezone settings:", error);
      }
    };
    
    initializeTimezone();
  }, []);

  // Intelligent Toggle: Works for both Mobile and Desktop
  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Automatic Dynamic Title Logic
  useEffect(() => {
    const currentPath = location.pathname.replace(/^\//, "");
    let title = "Xenon SMS";

    let found = false;
    if (navItems?.results) {
      for (const parent of navItems.results) {
        if (parent.url === currentPath) {
          title = `${parent.label} - Xenon SMS`;
          found = true;
          break;
        }
        if (parent.children) {
          const child = parent.children.find((c) => c.url === currentPath);
          if (child) {
            title = `${child.label} - ${parent.label} - Xenon SMS`;
            found = true;
            break;
          }
        }
      }
    }
    if (!found) {
      if (currentPath.includes("change-password"))
        title = "Change Password - Xenon SMS";
      else if (currentPath.includes("login")) title = "Login - Xenon SMS";
    }
    document.title = title;
  }, [location, navItems]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Navbar onToggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary dark:bg-gray-900 p-4 md:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;