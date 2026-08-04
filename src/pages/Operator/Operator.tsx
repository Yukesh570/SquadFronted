// import React, { useState, useEffect, useRef } from "react";
// import { Home, Plus, Edit, Trash, Upload, Eye } from "lucide-react";
// import { NavLink, useLocation } from "react-router-dom";
// import { toast } from "react-toastify";
// import {
//   getOperatorsApi,
//   deleteOperatorApi,
//   importOperatorApi,
//   getImportStatusApi,
//   type OperatorData,
// } from "../../api/operatorApi/operatorApi";
// import { getCountriesApi } from "../../api/settingApi/countryApi/countryApi";
// import { OperatorModal } from "../../components/modals/OperatorModal";
// import { ImportModal } from "../../components/modals/ImportModal";
// import Button from "../../components/ui/Button";
// import Input from "../../components/ui/Input";
// import DataTable from "../../components/ui/DataTable";
// import FilterCard from "../../components/ui/FilterCard";
// import { DeleteModal } from "../../components/modals/DeleteModal";
// import { usePagePermissions } from "../../hooks/usePagePermissions";
// import ContextMenu, { type ContextMenuItem } from "../../components/ui/ContextMenu";
// import { actionHelper } from "../../helper/action";

// // ⚡️ FIX: Import the StatusBadge component
// import { StatusBadge } from "../../components/ui/StatusBadge";

// const Operators: React.FC = () => {
//   const { canCreate, canUpdate, canDelete } = usePagePermissions();
//   const [data, setData] = useState<OperatorData[]>([]);
//   const [totalItems, setTotalItems] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);

//   const [countryMap, setCountryMap] = useState<Record<number, string>>({});

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
//   const [editingOperator, setEditingOperator] = useState<OperatorData | null>(null);
//   const [deleteId, setDeleteId] = useState<number | null>(null);
//   const [isViewMode, setIsViewMode] = useState(false);

//   // --- Context Menu States ---
//   const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
//   const [selectedRowOperator, setSelectedRowOperator] = useState<OperatorData | null>(null);

//   // Filters
//   const [searchName, setSearchName] = useState("");

//   const [rowsPerPage, setRowsPerPage] = useState(50);
//   const [currentPage, setCurrentPage] = useState(1);

//   const location = useLocation();
//   const routeName = location.pathname.split("/")[1] || "operator";

//   useEffect(() => {
//     const fetchCountries = async () => {
//       try {
//         const response: any = await getCountriesApi("country", 1, 1000);
//         let countryList = [];

//         if (response && response.results) {
//           countryList = response.results;
//         } else if (Array.isArray(response)) {
//           countryList = response;
//         } else if (response && Array.isArray(response.data)) {
//           countryList = response.data;
//         }

//         const mapping: Record<number, string> = {};
//         countryList.forEach((c: any) => {
//           mapping[c.id] = c.name;
//         });
//         setCountryMap(mapping);
//       } catch (error) {
//         console.error("Failed to load countries for mapping", error);
//       }
//     };

//     fetchCountries();
//   }, []);

//   const fetchOperators = async (overrideParams?: Record<string, string>) => {
//     setIsLoading(true);
//     try {
//       const currentSearchParams = overrideParams || {
//         name: searchName,
//       };

//       const cleanParams = Object.fromEntries(
//         Object.entries(currentSearchParams).filter(([_, v]) => v !== "")
//       );

//       const response = await getOperatorsApi(
//         routeName,
//         currentPage,
//         rowsPerPage,
//         cleanParams
//       );

//       if (response && response.results) {
//         setData(response.results);
//         setTotalItems(response.count);
//       } else {
//         setData([]);
//         setTotalItems(0);
//       }
//     } catch (error) {
//       console.error("Fetch error:", error);
//       toast.error("Failed to fetch operators.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOperators();
//   }, [routeName, currentPage, rowsPerPage]);

//   const handleSearch = () => {
//     setCurrentPage(1);
//     fetchOperators();
//   };

//   const handleClearFilters = () => {
//     setSearchName("");
//     setCurrentPage(1);
//     fetchOperators({ name: "" });
//   };

//   const handleDelete = async () => {
//     if (deleteId && canDelete) {
//       try {
//         await deleteOperatorApi(deleteId, routeName);
//         toast.success("Operator deleted.");
//         fetchOperators();
//       } catch (error) {
//         toast.error("Failed to delete operator.");
//       }
//       setDeleteId(null);
//     }
//   };

//   const handleEdit = (item: OperatorData) => {
//     if (!canUpdate) return;
//     setEditingOperator(item);
//     setIsViewMode(false);
//     setIsModalOpen(true);
//   };

//   const handleAdd = () => {
//     if (!canCreate) return;
//     setEditingOperator(null);
//     setIsViewMode(false);
//     setIsModalOpen(true);
//   };

//   const handleView = (item: OperatorData) => {
//     setEditingOperator(item);
//     setIsViewMode(true);
//     setIsModalOpen(true);
//   };

//   // --- Context Menu Handler ---
//   const handleContextMenu = (e: React.MouseEvent, item: OperatorData) => {
//     e.preventDefault();
//     setContextMenuPos({ x: e.clientX, y: e.clientY });
//     setSelectedRowOperator(item);
//   };

//   const menuItems: ContextMenuItem[] = selectedRowOperator ? [
//     { label: "View Details", icon: <Eye size={16} />, onClick: () => handleView(selectedRowOperator) },
//     ...(canUpdate ? [{ label: "Edit Operator", icon: <Edit size={16} />, onClick: () => handleEdit(selectedRowOperator) }] : []),
//     ...(canDelete ? [{ label: "Delete Operator", icon: <Trash size={16} />, variant: "danger" as const, onClick: () => setDeleteId(selectedRowOperator.id!) }] : []),
//   ] : [];

//   const headers = ["S.N.", "Operator Name", "Country", "Operator Code", "Status"];

//   const hasLoggedOpening = useRef(false);

//   useEffect(() => {
//     if (!hasLoggedOpening.current) {
//       setTimeout(() => {
//         const activeLinks = document.querySelectorAll('aside a.active, nav a.active');
//         const activeItem = activeLinks[activeLinks.length - 1] as HTMLElement;
//         let moduleLabel = activeItem?.innerText?.split('\n')[0].trim() || "Module";
        
//         actionHelper(moduleLabel, `Opened ${moduleLabel} Module`, false);
//       }, 100); 
      
//       hasLoggedOpening.current = true;
//     }
//   }, []);

//   return (
//     <div className="container mx-auto" onClick={() => setContextMenuPos(null)}>
//       <div className="mb-8 flex items-center justify-between">
//         <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
//           Operators
//         </h1>
//         <div className="flex items-center space-x-2 text-sm text-text-secondary">
//           <Home size={16} className="text-gray-400" />
//           <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
//             Home
//           </NavLink>
//           <span>/</span>
//           <span className="text-text-primary dark:text-white">Operators</span>
//         </div>
//       </div>

//       <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
//         <Input
//           label="Search by Name"
//           value={searchName}
//           onChange={(e) => setSearchName(e.target.value)}
//           placeholder="Operator Name"
//           className="md:col-span-2"
//         />
//       </FilterCard>

//       <DataTable
//         serverSide={true}
//         data={data}
//         totalItems={totalItems}
//         currentPage={currentPage}
//         rowsPerPage={rowsPerPage}
//         onPageChange={setCurrentPage}
//         onRowsPerPageChange={setRowsPerPage}
//         headers={headers}
//         isLoading={isLoading}
//         headerActions={
//           <div className="flex gap-2">
//             {canCreate && (
//               <Button
//                 variant="secondary"
//                 onClick={() => setIsImportModalOpen(true)}
//                 leftIcon={<Upload size={18} />}
//               >
//                 Import
//               </Button>
//             )}
//             {canCreate && (
//               <Button
//                 variant="primary"
//                 onClick={handleAdd}
//                 leftIcon={<Plus size={18} />}
//               >
//                 Add Operator
//               </Button>
//             )}
//           </div>
//         }
//         renderRow={(item: OperatorData, index: number) => (
//           <tr
//             key={item.id || index}
//             onContextMenu={(e) => handleContextMenu(e, item)} 
//             className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 cursor-context-menu transition-colors"
//           >
//             <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
//               {(currentPage - 1) * rowsPerPage + index + 1}
//             </td>
//             <td className="px-4 py-4 text-sm text-text-primary dark:text-white font-medium">
//               {item.name}
//             </td>

//             <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
//               {countryMap[item.country] || item.country}
//             </td>

//             <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
//               {item.operatorCode || "-"}
//             </td>
            
//             <td className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300">
//               {/* ⚡️ FIX: Implemented StatusBadge */}
//               <StatusBadge status={item.status} />
//             </td>
//           </tr>
//         )}
//       />

//       <ContextMenu position={contextMenuPos} items={menuItems} onClose={() => setContextMenuPos(null)} />

//       <OperatorModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSuccess={fetchOperators}
//         moduleName={routeName}
//         editingOperator={editingOperator}
//         isViewMode={isViewMode}
//       />
//       <ImportModal
//         isOpen={isImportModalOpen}
//         onClose={() => setIsImportModalOpen(false)}
//         onSuccess={fetchOperators}
//         importApi={importOperatorApi}
//         checkStatusApi={getImportStatusApi}
//         title="Import Operators"
//         sampleFileLink="/operator_sample.csv"
//         sampleFileName="operator_sample.csv"
//         fileKey="file"
//       />

//       <DeleteModal
//         isOpen={!!deleteId}
//         onClose={() => setDeleteId(null)}
//         onConfirm={handleDelete}
//         title="Delete Operator"
//         message="Are you sure you want to delete this operator? This action cannot be undone."
//       />
//     </div>
//   );
// };

// export default Operators;