// import React, { useState, useEffect, useRef, useMemo } from "react";
// import { Home, Plus, Edit, Trash } from "lucide-react";
// import { NavLink, useLocation } from "react-router-dom";
// import { toast } from "react-toastify";

// // --- API ---
// import {
//   getIpWhitelistApi,
//   deleteIpWhitelistApi,
//   type IpWhitelistData,
// } from "../../api/ipWhitelistApi/ipWhitelistApi";
// import { getClientsApi } from "../../api/clientApi/clientApi";

// // --- Components ---
// import Button from "../../components/ui/Button";
// import Input from "../../components/ui/Input";
// import Select from "../../components/ui/Select";
// import DataTable from "../../components/ui/DataTable";
// import FilterCard from "../../components/ui/FilterCard";
// import AdvancedFilter, {
//   type FilterColumn,
// } from "../../components/ui/AdvancedFilter";
// import ViewButton from "../../components/ui/ViewButton";
// import { DeleteModal } from "../../components/modals/DeleteModal";
// import { usePagePermissions } from "../../hooks/usePagePermissions";
// import IpWhitelistModal from "../../components/modals/WhiteListIPModal";

// // --- Interfaces ---
// interface Option {
//   label: string;
//   value: string;
// }

// interface ColumnConfig extends FilterColumn {
//   render?: (data: IpWhitelistData) => React.ReactNode;
//   options?: Option[];
//   filterKey?: string;
// }

// // --- Defaults ---
// const DEFAULT_SEARCH_COLUMNS = ["ip", "client"];
// const DEFAULT_TABLE_COLUMNS = ["ip", "clientName", "createdAt"];

// const WhiteListIP: React.FC = () => {
//   // Permissions
//   const { canCreate, canUpdate, canDelete } = usePagePermissions();

//   // --- State ---
//   const [dataList, setDataList] = useState<IpWhitelistData[]>([]);
//   const [totalItems, setTotalItems] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);

//   // Pagination
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);

//   // Modal States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingData, setEditingData] = useState<IpWhitelistData | null>(null);
//   const [isViewMode, setIsViewMode] = useState(false);
//   const [deleteId, setDeleteId] = useState<number | null>(null);

//   // Dynamic Options
//   const [clientOptions, setClientOptions] = useState<Option[]>([]);

//   // Filter & Column Visibility
//   const [searchColumns, setSearchColumns] = useState<string[]>(() => {
//     const saved = localStorage.getItem("ip_search_columns");
//     return saved ? JSON.parse(saved) : DEFAULT_SEARCH_COLUMNS;
//   });

//   const [tableColumns, setTableColumns] = useState<string[]>(() => {
//     const saved = localStorage.getItem("ip_table_columns");
//     return saved ? JSON.parse(saved) : DEFAULT_TABLE_COLUMNS;
//   });

//   const [filterValues, setFilterValues] = useState<Record<string, string>>({});

//   // Routing
//   const location = useLocation();
//   const moduleName = location.pathname.split("/").pop() || "ipWhitelist";
//   const abortControllerRef = useRef<AbortController | null>(null);

//   // --- Helpers ---
//   const extractOptions = (response: any) => {
//     const list = response.results || (Array.isArray(response) ? response : []);
//     return list.map((item: any) => ({
//       label: item.name,
//       value: String(item.id),
//     }));
//   };

//   // --- Fetch Options ---
//   useEffect(() => {
//     const fetchOptions = async () => {
//       try {
//         const res = await getClientsApi("client", 1, 1000);
//         setClientOptions(extractOptions(res));
//       } catch (error) {
//         console.error("Failed to load options", error);
//       }
//     };
//     fetchOptions();
//   }, []);

//   // --- Configuration ---
//   const filterOptionsConfig: ColumnConfig[] = useMemo(
//     () => [
//       { key: "ip", label: "IP Address", type: "text" },
//       { key: "client", label: "Client", type: "text", options: clientOptions },
//     ],
//     [clientOptions],
//   );

//   const tableColumnsConfig: ColumnConfig[] = useMemo(
//     () => [
//       {
//         key: "ip",
//         label: "IP Address",
//         type: "text",
//         render: (row) => (
//           <span className="font-mono text-sm text-primary">{row.ip}</span>
//         ),
//       },
//       { key: "clientName", label: "Client", type: "text" },
//       {
//         key: "createdAt",
//         label: "Created At",
//         type: "date",
//         render: (row) =>
//           row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
//       },
//     ],
//     [],
//   );

//   // --- Persistence ---
//   useEffect(() => {
//     localStorage.setItem("ip_table_columns", JSON.stringify(tableColumns));
//   }, [tableColumns]);

//   useEffect(() => {
//     localStorage.setItem("ip_search_columns", JSON.stringify(searchColumns));
//   }, [searchColumns]);

//   const visibleSearchFields = filterOptionsConfig.filter((col) =>
//     searchColumns.includes(col.key),
//   );
//   const visibleTableFields = tableColumnsConfig.filter((col) =>
//     tableColumns.includes(col.key),
//   );

//   // --- Fetch Data ---
//   const fetchData = async (overrideParams?: Record<string, any>) => {
//     if (abortControllerRef.current) abortControllerRef.current.abort();
//     const newController = new AbortController();
//     abortControllerRef.current = newController;

//     setIsLoading(true);
//     try {
//       const currentSearchParams: Record<string, any> = {};
//       const sourceFilters = overrideParams || filterValues;

//       Object.entries(sourceFilters).forEach(([key, val]) => {
//         if (val) currentSearchParams[key] = val;
//       });

//       const response = await getIpWhitelistApi(
//         moduleName,
//         currentPage,
//         rowsPerPage,
//         currentSearchParams,
//       );

//       if (newController.signal.aborted) return;

//       if (response && response.results) {
//         setDataList(response.results);
//         setTotalItems(response.count);
//       } else {
//         setDataList([]);
//         setTotalItems(0);
//       }
//     } catch (error: any) {
//       if (error.name !== "AbortError") {
//         toast.error("Failed to fetch IP whitelist.");
//       }
//     } finally {
//       if (abortControllerRef.current === newController) setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     return () => {
//       if (abortControllerRef.current) abortControllerRef.current.abort();
//     };
//   }, [moduleName, currentPage, rowsPerPage]);

//   // --- Handlers ---
//   const handleFilterChange = (key: string, value: string) => {
//     setFilterValues((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSearch = () => {
//     setCurrentPage(1);
//     fetchData();
//   };

//   const handleClearFilters = () => {
//     setFilterValues({});
//     setCurrentPage(1);
//     setTimeout(() => fetchData({}), 0);
//   };

//   // CRUD
//   const handleAdd = () => {
//     if (!canCreate) return;
//     setEditingData(null);
//     setIsViewMode(false);
//     setIsModalOpen(true);
//   };

//   const handleEdit = (item: IpWhitelistData) => {
//     if (!canUpdate) return;
//     setEditingData(item);
//     setIsViewMode(false);
//     setIsModalOpen(true);
//   };

//   const handleView = (item: IpWhitelistData) => {
//     setEditingData(item);
//     setIsViewMode(true);
//     setIsModalOpen(true);
//   };

//   const handleDelete = async () => {
//     if (deleteId && canDelete) {
//       try {
//         await deleteIpWhitelistApi(deleteId, moduleName);
//         toast.success("Deleted successfully.");
//         fetchData();
//       } catch (error) {
//         toast.error("Failed to delete.");
//       }
//       setDeleteId(null);
//     }
//   };

//   const tableHeaders = [
//     "S.N.",
//     ...visibleTableFields.map((col) => col.label),
//     "Actions",
//   ];

//   return (
//     <div className="container mx-auto">
//       {/* Header */}
//       <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
//           <h1 className="text-2xl font-semibold text-text-primary dark:text-white mr-2">
//             IP Whitelist
//           </h1>

//           <div className="relative z-20">
//             <AdvancedFilter
//               columns={filterOptionsConfig}
//               selectedColumns={searchColumns}
//               onFilter={(newCols) => {
//                 setSearchColumns(newCols);
//                 setFilterValues((prev) => {
//                   const next = { ...prev };
//                   Object.keys(next).forEach((k) => {
//                     if (!newCols.includes(k)) delete next[k];
//                   });
//                   return next;
//                 });
//               }}
//               onClear={() => setSearchColumns(DEFAULT_SEARCH_COLUMNS)}
//               isLoading={isLoading}
//               buttonLabel="Search Fields"
//             />
//           </div>

//           <div className="relative z-20">
//             <AdvancedFilter
//               columns={tableColumnsConfig}
//               selectedColumns={tableColumns}
//               onFilter={setTableColumns}
//               onClear={() => setTableColumns(DEFAULT_TABLE_COLUMNS)}
//               buttonLabel="Columns"
//             />
//           </div>
//         </div>

//         <div className="flex items-center space-x-2 text-sm text-text-secondary">
//           <Home size={16} className="text-gray-400" />
//           <NavLink to="/dashboard" className="text-gray-400 hover:text-primary">
//             Home
//           </NavLink>
//           <span>/</span>
//           <span className="text-text-primary dark:text-white">
//             IP Whitelist
//           </span>
//         </div>
//       </div>

//       <FilterCard onSearch={handleSearch} onClear={handleClearFilters}>
//         {visibleSearchFields.map((col) => {
//           if (col.options) {
//             return (
//               <Select
//                 key={col.key}
//                 label={col.label}
//                 value={filterValues[col.key] || ""}
//                 onChange={(val) => handleFilterChange(col.key, val)}
//                 options={col.options}
//                 placeholder={`Select ${col.label}`}
//               />
//             );
//           }
//           return (
//             <Input
//               key={col.key}
//               label={col.label}
//               value={filterValues[col.key] || ""}
//               onChange={(e) => handleFilterChange(col.key, e.target.value)}
//               placeholder={`Search ${col.label}`}
//             />
//           );
//         })}
//       </FilterCard>

//       <DataTable
//         serverSide={true}
//         data={dataList}
//         totalItems={totalItems}
//         currentPage={currentPage}
//         rowsPerPage={rowsPerPage}
//         onPageChange={setCurrentPage}
//         onRowsPerPageChange={setRowsPerPage}
//         headers={tableHeaders}
//         isLoading={isLoading}
//         headerActions={
//           canCreate ? (
//             <Button
//               variant="primary"
//               onClick={handleAdd}
//               leftIcon={<Plus size={18} />}
//             >
//               Add IP
//             </Button>
//           ) : undefined
//         }
//         renderRow={(row, index) => (
//           <tr
//             key={row.id || index}
//             className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors"
//           >
//             <td className="px-4 py-4 text-sm text-text-primary dark:text-white">
//               {(currentPage - 1) * rowsPerPage + index + 1}
//             </td>
//             {visibleTableFields.map((col) => {
//               const cellData = (row as any)[col.key];
//               if (col.render) {
//                 return (
//                   <td
//                     key={col.key}
//                     className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
//                   >
//                     {col.render(row)}
//                   </td>
//                 );
//               }
//               return (
//                 <td
//                   key={col.key}
//                   className="px-4 py-4 text-sm text-text-secondary dark:text-gray-300 whitespace-nowrap"
//                 >
//                   {cellData || "-"}
//                 </td>
//               );
//             })}
//             <td className="px-4 py-4 text-sm">
//               <div className="flex items-center space-x-2">
//                 <ViewButton onClick={() => handleView(row)} />
//                 {canUpdate && (
//                   <Button
//                     variant="secondary"
//                     size="xs"
//                     onClick={() => handleEdit(row)}
//                     title="Edit"
//                   >
//                     <Edit size={14} />
//                   </Button>
//                 )}
//                 {canDelete && (
//                   <Button
//                     variant="danger"
//                     size="xs"
//                     onClick={() => setDeleteId(row.id!)}
//                     title="Delete"
//                   >
//                     <Trash size={14} />
//                   </Button>
//                 )}
//               </div>
//             </td>
//           </tr>
//         )}
//       />

//       <IpWhitelistModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSuccess={fetchData}
//         moduleName={moduleName}
//         editingData={editingData}
//         isViewMode={isViewMode}
//       />

//       <DeleteModal
//         isOpen={!!deleteId}
//         onClose={() => setDeleteId(null)}
//         onConfirm={handleDelete}
//         title="Delete IP Whitelist"
//         message="Are you sure you want to delete this IP? This action cannot be undone."
//       />
//     </div>
//   );
// };

// export default WhiteListIP;
