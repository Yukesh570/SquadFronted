import { NavLink } from "react-router-dom";
import * as Icons from "lucide-react";
import { useContext, useEffect, useState } from "react";
import React from "react";
// import tags from "lucide-static/tags.json";
import { NavItemsContext } from "../../context/navItemsContext";

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
  // const [loading, setLoading] = useState(true);

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
   hover:bg-gray-200 hover:text-gray-900
   dark:hover:bg-gray-700 dark:hover:text-white
   ${isActive
      ? "bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
      : ""
    }
   ${isCollapsed ? "justify-center" : ""}`;

  return (
    <aside
      className={`flex flex-col h-screen bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      <div className="h-16 flex-shrink-0 flex items-center justify-center">
        {isCollapsed && (
          <Icons.BarChart size={24} className="text-text-secondary" />
        )}
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
                <span className="ml-3 text-gray-900 dark:text-white ">
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