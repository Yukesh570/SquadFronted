import { useState, useEffect, useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { NavItemsContext } from "../../context/navItemsContext";

const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const location = useLocation();
  const { navItems } = useContext(NavItemsContext);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Automatic Dynamic Title Logic
  useEffect(() => {
    // Remove leading slash (e.g., "/dashboard" -> "dashboard")
    const currentPath = location.pathname.replace(/^\//, "");
    let title = "Squad"; // Default Title

    let found = false;

    if (navItems?.results) {
      for (const parent of navItems.results) {
        // 1. Check if URL matches a Parent Menu
        if (parent.url === currentPath) {
          title = `${parent.label} - Squad`;
          found = true;
          break;
        }

        // 2. Check if URL matches a Child Menu
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

    // 3. Fallback for non-sidebar pages
    if (!found) {
      if (currentPath.includes("change-password"))
        title = "Change Password - Squad";
      else if (currentPath.includes("login")) title = "Login - Squad";
    }

    document.title = title;
  }, [location, navItems]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 ">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary dark:bg-gray-900 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
