import { useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { NavItemsContext } from "../context/navItemsContext";
import type { navUserData } from "../api/navUserRelationApi/navUserRelationApi";

export const usePagePermissions = () => {
  const { navItems } = useContext(NavItemsContext);
  const location = useLocation();

  const permissions = useMemo(() => {
    // 1. Get current path without leading slash (e.g., "rate/vendorRate")
    const currentPath = location.pathname.startsWith("/") 
      ? location.pathname.substring(1) 
      : location.pathname;

    // 2. Recursive function to find the MOST SPECIFIC (deepest) matching item
    const findDeepestMatch = (items: navUserData[]): navUserData | null => {
      for (const item of items) {
        // Check if this item is part of the current path
        const isMatch = item.url === currentPath || currentPath.startsWith(`${item.url}/`);

        if (isMatch) {
          // If this item matches, check its children for a MORE specific match
          if (item.children && item.children.length > 0) {
            const childMatch = findDeepestMatch(item.children);
            if (childMatch) {
              return childMatch; // Found a specific child, return it
            }
          }
          // If no children matched, but this parent did, return this item
          return item;
        }
      }
      return null;
    };

    const activeItem = navItems.results ? findDeepestMatch(navItems.results) : null;

    // 3. Return permissions (Default to FALSE if not found)
    return {
      canRead: activeItem?.permission?.read ?? false,
      canCreate: activeItem?.permission?.write ?? false, // Maps to "Add" button
      canUpdate: activeItem?.permission?.put ?? false,   // Maps to "Edit" button
      canDelete: activeItem?.permission?.delete ?? false // Maps to "Delete" button
    };
  }, [navItems, location.pathname]);

  return permissions;
};