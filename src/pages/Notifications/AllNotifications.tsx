// import { Home } from "lucide-react";
// import { NavLink } from "react-router-dom";

// const AllNotifications = () => {
//     return (
//         <div className="container mx-auto">
//             {/* 1. BREADCRUMBS AND TITLE */}
//             <div className="mb-8 flex items-center justify-between">
//                 <h1 className="text-2xl font-semibold text-text-primary">
//                     All Notifications
//                 </h1>
//                 <div className="flex items-center space-x-2 text-sm text-text-secondary">
//                     <Home size={16} className="text-gray-400" />
//                     <NavLink
//                         to="/dashboard"
//                         className="text-gray-400 hover:text-primary"
//                     >
//                         Home
//                     </NavLink>
//                     <span>/</span>
//                     <span className="text-text-primary">Notifications</span>
//                 </div>
//             </div>

//             {/* 2. PAGE CONTENT */}
//             <div className="rounded-xl bg-white p-5 shadow-card dark:bg-gray-800">
//                 <p className="text-gray-900 dark:text-white">
//                     This page will show a full list of all your past notifications.
//                 </p>
//                 {/* We would map over a full list of notifications here */}
//             </div>
//         </div>
//     );
// };

// export default AllNotifications;