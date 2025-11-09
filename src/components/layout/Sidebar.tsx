import { NavLink } from "react-router-dom";
import * as Icons from "lucide-react";
import { useContext, useEffect } from "react";
import React from "react";
import { NavItemsContext } from "../../context/navItemsContext";
import FullLogo from "../../../src/assets/logos/logo.svg";
import IconLogo from "../../../src/assets/logos/S-logo.svg";

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const { navItems, refreshNavItems } = useContext(NavItemsContext);

  useEffect(() => {
    refreshNavItems();
  }, []);

  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) return <Icons.HelpCircle className="mr-0" size={20} />;
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return React.createElement(IconComponent, { className: "mr-0", size: 20 });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 my-1 rounded-lg text-text-secondary
   hover:bg-sidebar-active-bg hover:text-sidebar-active-text
   dark:hover:bg-gray-700 dark:hover:text-white
   ${isActive
      ? "bg-sidebar-active-bg dark:bg-gray-800 text-sidebar-active-text font-medium"
      : ""
    }
   ${isCollapsed ? "justify-center" : ""}`;

  return (
    <aside
      className={`flex flex-col h-screen bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      <div className="h-16 flex-shrink-0 flex items-center justify-center">
        <NavLink to="/dashboard" className="flex items-center justify-center">
          {isCollapsed ? (
            <img
              src={IconLogo}
              alt="Logo Icon"
              className="h-8 w-auto cursor-pointer"
            />
          ) : (
            <img
              src={FullLogo}
              alt="Full Logo"
              className="h-[100px] w-auto cursor-pointer"
            />
          )}
        </NavLink>
      </div>


      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navItems.map((item) => {
          if (!item.read) {
            return null;
          }

          return (
            <NavLink
              key={item.id}
              to={`/${item.navigateId.url}`}
              className={navLinkClass}
            >
              {renderIcon(item.navigateId.icon)}

              {!isCollapsed && (
                <span className="ml-3 text-gray-900 dark:text-white">
                  {item.navigateId.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-1 flex-shrink-0"></div>
    </aside>
  );
};

export default Sidebar;
