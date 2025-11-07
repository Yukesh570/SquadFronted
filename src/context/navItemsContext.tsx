import { createContext, useEffect, useState } from "react";
import type { navUserData } from "../api/navUserRelationApi/navUserRelationApi";
import { getUserSideBarApi } from "../api/navUserRelationApi/navUserRelationApi";

interface NavItemsContextType {
  navItems: navUserData[];
  refreshNavItems: () => Promise<void>;
  loading: boolean;
}

export const NavItemsContext = createContext<NavItemsContextType>({
  navItems: [],
  refreshNavItems: async () => {},
  loading: true,
});

export const NavItemProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [navItems, setNavItems] = useState<navUserData[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshNavItems = async () => {
    try {
      const data = await getUserSideBarApi();
      setNavItems(data);
    } catch (error) {
      console.error("Error fetching nav items:", error);
    }
    finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshNavItems();
  }, []);

  return (
    <NavItemsContext.Provider value={{ navItems, refreshNavItems, loading }}>
      {children}
    </NavItemsContext.Provider>
  );
};
