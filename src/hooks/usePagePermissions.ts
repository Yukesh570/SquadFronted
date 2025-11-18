import { useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { NavItemsContext } from "../context/navItemsContext";
import type { navUserData } from "../api/navUserRelationApi/navUserRelationApi";

export const usePagePermissions = () => {
  const { navItems } = useContext(NavItemsContext);
  const location = useLocation();

  const currentPath = location.pathname.split('/')[1] || '';

  const findItem = (items: navUserData[], path: string): navUserData | undefined => {
    for (const item of items) {
      if (item.url === path) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = findItem(item.children, path);
        if (found) return found;
      }
    }
    return undefined;
  };

  const permissions = useMemo(() => {
    const activeItem = findItem(navItems, currentPath);
    return {
      read: activeItem?.permission?.read || false,
      write: activeItem?.permission?.write || false, // For "Add/Create"
      put: activeItem?.permission?.put || false,     // For "Edit"
      delete: activeItem?.permission?.delete || false // For "Delete"
    };
  }, [navItems, currentPath]);

  return permissions;
};