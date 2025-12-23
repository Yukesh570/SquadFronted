import { useState, useEffect, useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { NavItemsContext } from "../../context/navItemsContext";

const Layout = () => {
  // Desktop: Collapsed/Expanded state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  // Mobile: Open/Closed (Drawer) state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const location = useLocation();
  const { navItems } = useContext(NavItemsContext);

  // Intelligent Toggle: Works for both Mobile and Desktop
  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      // Mobile: Toggle Drawer
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      // Desktop: Toggle Collapse
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Close mobile sidebar when route changes (UX best practice)
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Automatic Dynamic Title Logic
  useEffect(() => {
    const currentPath = location.pathname.replace(/^\//, "");
    let title = "Squad";

    let found = false;
    if (navItems?.results) {
      for (const parent of navItems.results) {
        if (parent.url === currentPath) {
          title = `${parent.label} - Squad`;
          found = true;
          break;
        }
        if (parent.children) {
          const child = parent.children.find((c) => c.url === currentPath);
          if (child) {
            title = `${child.label} - ${parent.label} - Squad`;
            found = true;
            break;
          }
        }
      }
    }
    if (!found) {
      if (currentPath.includes("change-password"))
        title = "Change Password - Squad";
      else if (currentPath.includes("login")) title = "Login - Squad";
    }
    document.title = title;
  }, [location, navItems]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar handles its own mobile/desktop rendering logic now */}
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
