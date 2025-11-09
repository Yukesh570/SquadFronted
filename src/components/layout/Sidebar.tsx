import { NavLink } from "react-router-dom";
import * as Icons from "lucide-react";
import { useContext, useEffect, useState } from "react";
import React from "react";
import { NavItemsContext } from "../../context/navItemsContext";
import FullLogo from "../../../src/assets/logos/logo.svg";
import IconLogo from "../../../src/assets/logos/S-logo.svg";
import type { navUserData } from "../../api/navUserRelationApi/navUserRelationApi";

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const { navItems, refreshNavItems } = useContext(NavItemsContext);
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({}); // track open states

  useEffect(() => {
    refreshNavItems();
  }, []);

  const toggleItem = (id?: number) => {
    console.log("id", id);

    if (!id) return;
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  console.log("optitems", openItems);
  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) return <Icons.HelpCircle className="mr-0" size={20} />;
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return React.createElement(IconComponent, { className: "mr-0", size: 20 });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between p-3 my-1 rounded-lg text-text-secondary
     hover:bg-sidebar-active-bg hover:text-sidebar-active-text
     dark:hover:bg-gray-700 dark:hover:text-white
     ${
       isActive
         ? "bg-sidebar-active-bg dark:bg-gray-800 text-sidebar-active-text font-medium"
         : ""
     }
     ${isCollapsed ? "justify-center" : ""}`;

  const renderNavItems = (items: navUserData[], level = 0) => {
    return items.map((item) => {
      if (!item.permission?.read) return null;

      const hasChildren = item.children && item.children.length > 0;
      const isOpen = item.id ? openItems[item.id] : false;

      return (
        <div key={item.id}>
          <div
            className={navLinkClass({ isActive: false })}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            <NavLink
              to={`/${item.url}`}
              className="flex-1 flex items-center"
              onClick={(e) => {
                if (hasChildren) e.preventDefault(); // prevent navigation if expandable
                toggleItem(item.id);
              }}
            >
              {renderIcon(item.icon)}
              {!isCollapsed && (
                <span className="ml-3 text-gray-900 dark:text-white">
                  {item.label}
                </span>
              )}
            </NavLink>

            {hasChildren && !isCollapsed && (
              <button
                onClick={() => toggleItem(item.id)}
                className="ml-2 focus:outline-none"
              >
                {isOpen ? (
                  <Icons.ChevronDown size={16} />
                ) : (
                  <Icons.ChevronRight size={16} />
                )}
              </button>
            )}
          </div>

          {/* Children */}
          {hasChildren && isOpen && (
            <div className="ml-3 border-l border-gray-200 dark:border-gray-700">
              {renderNavItems(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
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
        {renderNavItems(navItems)}
      </nav>

      <div className="p-1 flex-shrink-0"></div>
    </aside>
  );
};

export default Sidebar;
