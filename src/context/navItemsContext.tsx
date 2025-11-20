import { createContext, useEffect, useState } from "react";
import type { navUserData } from "../api/navUserRelationApi/navUserRelationApi";
import { getUserSideBarApi } from "../api/navUserRelationApi/navUserRelationApi";
import type { PaginatedResponse } from "../api/emailTemplateApi/emailTemplateApi";

interface NavItemsContextType {
  navItems: PaginatedResponse<navUserData>;
  refreshNavItems: () => Promise<void>;
  loading: boolean;
}

export const NavItemsContext = createContext<NavItemsContextType>({
  navItems: { count: 0, next: null, previous: null, results: [] },
  refreshNavItems: async () => {},
  loading: true,
});

export const NavItemProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [navItems, setNavItems] = useState<PaginatedResponse<navUserData>>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  console.log("NavItemsContext:", navItems);
  const [loading, setLoading] = useState(true);

  const refreshNavItems = async () => {
    try {
      const data = await getUserSideBarApi();
      console.log("Fetched nav items:", data);
      setNavItems(data);
    } catch (error) {
      console.error("Error fetching nav items:", error);
    } finally {
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
