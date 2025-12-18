// import React, { useState } from 'react';
// import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

// export interface Column<T> {
//   key: string;
//   header: string;
//   sortable?: boolean;
//   width?: string;
//   render?: (item: T) => React.ReactNode;
//   align?: 'left' | 'center' | 'right';
// }

// interface DataTableProps<T> {
//   columns: Column<T>[];
//   data: T[];
//   keyExtractor: (item: T, index: number) => string;
//   onRowClick?: (item: T) => void;
//   striped?: boolean;
//   className?: string;
// }

// type SortDirection = 'asc' | 'desc' | null;

// /**
//  * Modern DataTable Component
//  * 
//  * Sortable, responsive, and styled table.
//  */
// function DataTable<T extends Record<string, any>>({
//   columns,
//   data,
//   keyExtractor,
//   onRowClick,
//   striped = false,
//   className = ''
// }: DataTableProps<T>) {
//   const [sortKey, setSortKey] = useState<string | null>(null);
//   const [sortDirection, setSortDirection] = useState<SortDirection>(null);

//   const handleSort = (columnKey: string) => {
//     if (sortKey === columnKey) {
//       setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
//       if (sortDirection === 'desc') setSortKey(null);
//     } else {
//       setSortKey(columnKey);
//       setSortDirection('asc');
//     }
//   };

//   const sortedData = React.useMemo(() => {
//     if (!sortKey || !sortDirection) return data;
//     return [...data].sort((a, b) => {
//       const aValue = a[sortKey];
//       const bValue = b[sortKey];
//       if (aValue === bValue) return 0;
//       const comparison = aValue > bValue ? 1 : -1;
//       return sortDirection === 'asc' ? comparison : -comparison;
//     });
//   }, [data, sortKey, sortDirection]);

//   const getSortIcon = (columnKey: string) => {
//     if (sortKey !== columnKey) return <FaSort className="w-12 h-12 opacity-30" />;
//     return sortDirection === 'asc' ? <FaSortUp className="w-12 h-12" /> : <FaSortDown className="w-12 h-12" />;
//   };

//   const alignmentClasses = {
//     left: 'text-left',
//     center: 'text-center',
//     right: 'text-right',
//   };

//   return (
//     <div className={`w-full overflow-x-auto rounded-lg border border-neutral-gray-light ${className}`}>
//       <table className="w-full border-collapse">
//         <thead className="bg-neutral-gray-lightest">
//           <tr>
//             {columns.map((col) => (
//               <th
//                 key={col.key}
//                 className={`px-16 py-12 text-body-sm font-semibold text-neutral-gray-dark ${alignmentClasses[col.align || 'left']}`}
//                 style={{ width: col.width }}
//               >
//                 {col.sortable ? (
//                   <button
//                     onClick={() => handleSort(col.key)}
//                     className="inline-flex items-center gap-4 hover:text-neutral-black transition-colors"
//                   >
//                     <span>{col.header}</span>
//                     {getSortIcon(col.key)}
//                   </button>
//                 ) : col.header}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {sortedData.map((item, idx) => {
//             const rowBg = striped && idx % 2 === 1 ? 'bg-neutral-gray-bg' : 'bg-neutral-white';
//             const hoverBg = onRowClick ? 'hover:bg-neutral-gray-lightest cursor-pointer' : '';
//             return (
//               <tr
//                 key={keyExtractor(item, idx)}
//                 onClick={() => onRowClick?.(item)}
//                 className={`transition-colors ${rowBg} ${hoverBg}`}
//               >
//                 {columns.map((col) => (
//                   <td
//                     key={col.key}
//                     className={`px-16 py-16 text-body text-neutral-black ${alignmentClasses[col.align || 'left']}`}
//                   >
//                     {col.render ? col.render(item) : item[col.key]}
//                   </td>
//                 ))}
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>

//       {sortedData.length === 0 && (
//         <div className="text-center py-24 text-body text-neutral-gray-medium">
//           No data available
//         </div>
//       )}
//     </div>
//   );
// }

// export default DataTable;
