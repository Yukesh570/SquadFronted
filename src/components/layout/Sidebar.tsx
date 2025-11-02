import { NavLink } from "react-router-dom";
import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import React from "react";
import tags from "lucide-static/tags.json";
import { useSidebarContext } from "../../context/sideBarContext";
import { getUserSideBarApi, type navUserData } from "../../api/navUserRelationApi/navUserRelationApi";


interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const [loading, setLoading] = useState(true);
  const [navItems, setNavItems] = useState<navUserData[]>([]);
  const { refreshSidebar } = useSidebarContext(); 

  useEffect(() => {
    const fetctSideBar = async () => {
      try {
        const data = await getUserSideBarApi();
        console.log("data!!!!!", data);
        setNavItems(data);
        setLoading(false);
        console.log("===========", tags);
      } catch (error) {
        console.log("Error during the sidebarcall api", error);
      }
    };
    fetctSideBar();
  }, [refreshSidebar]);
  const renderIcon = (iconName: string | undefined) => {
    console.log("iconName", iconName);
    if (!iconName) return <Icons.HelpCircle className="mr-0" size={20} />;
    // TypeScript-safe dynamic icon
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return React.createElement(IconComponent, { className: "mr-0", size: 20 });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 my-1 rounded-lg text-text-secondary
   hover:bg-gray-200 hover:text-gray-900
   dark:hover:bg-gray-700 dark:hover:text-white
   ${
     isActive
       ? "bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
       : ""
   }
   ${isCollapsed ? "justify-center" : ""}`;

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-white  dark:bg-gray-800">
  //       <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
  //     </div>
  //   );
  // }

  return (
    <aside
      className={`h-screen bg-white  dark:bg-gray-800 shadow-md transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="h-16 flex items-center justify-center">
        {isCollapsed && (
          <Icons.BarChart size={24} className="text-text-secondary" />
        )}
      </div>

      <nav className="flex-1 px-3 py-2">
        {/* <NavLink to="/dashboard" className={navLinkClass}>
          <Home className="mr-0" size={20} />
          {!isCollapsed && <span className="ml-3">Home</span>}
        </NavLink>
        <NavLink to="/users" className={navLinkClass}>
          <Users className="mr-0" size={20} />
          {!isCollapsed && <span className="ml-3">User </span>}
        </NavLink> */}
        {navItems.map(
          (item) => item.read &&(
            console.log("ite====m", item),
            (
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
            )
          )
        )}
      </nav>
      <div className="p-3"></div>
    </aside>
  );
};

export default Sidebar;
