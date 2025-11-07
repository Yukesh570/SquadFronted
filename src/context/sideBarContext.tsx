// import React, { createContext, useContext, useState } from "react";

// interface SidebarContextType {
//   refreshSidebar: boolean;
//   triggerRefresh: () => void;
// }
// //create/use Context is like a global variable
// const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [refreshSidebar, setRefreshSidebar] = useState(false);

//   const triggerRefresh = () => setRefreshSidebar((prev) => !prev);

//   return (
//     <SidebarContext.Provider value={{ refreshSidebar, triggerRefresh }}>
//       {children}
//     </SidebarContext.Provider>
//   );
// };

// export const useSidebarContext = () => {
//   const context = useContext(SidebarContext);
//   if (!context) throw new Error("useSidebarContext must be used within SidebarProvider");
//   return context;
// };
