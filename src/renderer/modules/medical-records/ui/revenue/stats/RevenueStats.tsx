// // // RevenueStats.tsx
// import React, { useState } from 'react';
// import { useSelector } from 'react-redux';
// import {
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   AreaChart,
//   Area
// } from 'recharts';
// import { 
//   DollarSign,
//   TrendingUp,
 
//   Activity,
//   ArrowUpRight,
//   ArrowDownRight,
//   RefreshCw,
//   PieChart as PieChartIcon,
//   BarChart3,
//   LineChart as LineChartIcon
// } from 'lucide-react';

// // RootState interface
// interface RootState {
//   ui: {
//     theme: 'light' | 'dark';
//   };
// }

// // Type definitions
// interface FinancialMetric {
//   label: string;
//   value: string;
//   change: number;
//   icon: React.ElementType;
//   color: string;
//   bgColor: string;
//   prefix?: string;
//   suffix?: string;
// }

// interface RevenueData {
//   month: string;
//   revenue: number;
//   expenses: number;
//   profit: number;
// }

// interface ExpenseCategory {
//   name: string;
//   value: number;
//   color: string;
// }

// interface RevenueSource {
//   name: string;
//   value: number;
//   color: string;
// }

// // Mock Financial Data
// const MOCK_FINANCIAL_METRICS: FinancialMetric[] = [
//   {
//     label: 'Total Revenue',
//     value: '2.45M',
//     change: 12.5,
//     icon: DollarSign,
//     color: 'text-green-500',
//     bgColor: 'bg-green-50 dark:bg-green-900/20',
//     prefix: '$'
//   },
//   {
//     label: 'Net Profit',
//     value: '842K',
//     change: 8.3,
//     icon: TrendingUp,
//     color: 'text-blue-500',
//     bgColor: 'bg-blue-50 dark:bg-blue-900/20',
//     prefix: '$'
//   },
//   {
//     label: 'Operating Margin',
//     value: '34.2',
//     change: 2.1,
//     icon: Activity,
//     color: 'text-purple-500',
//     bgColor: 'bg-purple-50 dark:bg-purple-900/20',
//     suffix: '%'
//   }
// ];

// const MOCK_MONTHLY_REVENUE: RevenueData[] = [
//   { month: 'Jan', revenue: 1850000, expenses: 1250000, profit: 600000 },
//   { month: 'Feb', revenue: 1950000, expenses: 1300000, profit: 650000 },
//   { month: 'Mar', revenue: 2100000, expenses: 1400000, profit: 700000 },
//   { month: 'Apr', revenue: 2250000, expenses: 1480000, profit: 770000 },
//   { month: 'May', revenue: 2400000, expenses: 1550000, profit: 850000 },
//   { month: 'Jun', revenue: 2450000, expenses: 1600000, profit: 850000 },
//   { month: 'Jul', revenue: 2350000, expenses: 1580000, profit: 770000 },
//   { month: 'Aug', revenue: 2500000, expenses: 1650000, profit: 850000 },
//   { month: 'Sep', revenue: 2600000, expenses: 1700000, profit: 900000 },
//   { month: 'Oct', revenue: 2550000, expenses: 1680000, profit: 870000 },
//   { month: 'Nov', revenue: 2700000, expenses: 1750000, profit: 950000 },
//   { month: 'Dec', revenue: 2900000, expenses: 1850000, profit: 1050000 }
// ];

// const MOCK_EXPENSE_CATEGORIES: ExpenseCategory[] = [
//   { name: 'Salaries & Benefits', value: 850000, color: '#3B82F6' },
//   { name: 'Medical Supplies', value: 450000, color: '#10B981' },
//   { name: 'Equipment & Maintenance', value: 320000, color: '#F59E0B' },
//   { name: 'Utilities & Facilities', value: 180000, color: '#8B5CF6' },
//   { name: 'Administrative', value: 150000, color: '#EC4899' },
//   { name: 'Marketing & Outreach', value: 95000, color: '#6B7280' }
// ];

// const MOCK_REVENUE_SOURCES: RevenueSource[] = [
//   { name: 'Patient Services', value: 1850000, color: '#3B82F6' },
//   { name: 'Insurance Claims', value: 1200000, color: '#10B981' },
//   { name: 'Pharmacy Sales', value: 650000, color: '#F59E0B' },
//   { name: 'Laboratory Services', value: 420000, color: '#8B5CF6' },
//   { name: 'Government Funding', value: 280000, color: '#EC4899' }
// ];

// // Helper function to format currency
// const formatCurrency = (value: number): string => {
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD',
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0
//   }).format(value);
// };

// export const RevenueStats: React.FC = () => {
//   // Get theme from Redux store
//   const theme = useSelector((state: RootState) => state.ui.theme);
//   const isDark = theme === 'dark';
  
//   const [refreshKey, setRefreshKey] = useState(0);
//   const [lastRefreshed, setLastRefreshed] = useState(new Date());
//   const [timeRange, setTimeRange] = useState<'6M' | '1Y' | '2Y'>('1Y');

//   // Theme-based colors
//   const colors = {
//     background: isDark ? 'bg-gray-1000' : 'bg-gray-30',
//     cardBg: isDark ? 'bg-gray-900' : 'bg-white',
//     cardBorder: isDark ? 'border-gray-700' : 'border-gray-200',
//     text: isDark ? 'text-gray-100' : 'text-gray-900',
//     textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
//     textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
//     hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
//     grid: isDark ? '#374151' : '#E5E7EB',
//     tooltipBg: isDark ? '#1F2937' : '#FFFFFF',
//     tooltipBorder: isDark ? '#374151' : '#E5E7EB',
//     tooltipText: isDark ? '#F9FAFB' : '#111827',
//   };

//   const handleRefresh = () => {
//     setRefreshKey(prev => prev + 1);
//     setLastRefreshed(new Date());
//   };

//   // Filter data based on time range
//   const getFilteredData = () => {
//     if (timeRange === '6M') return MOCK_MONTHLY_REVENUE.slice(-6);
//     if (timeRange === '1Y') return MOCK_MONTHLY_REVENUE.slice(-12);
//     return MOCK_MONTHLY_REVENUE;
//   };

//   const filteredData = getFilteredData();

//   // Calculate totals
//   const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
//   const totalExpenses = filteredData.reduce((sum, item) => sum + item.expenses, 0);
//   const totalProfit = filteredData.reduce((sum, item) => sum + item.profit, 0);
//   const avgMargin = (totalProfit / totalRevenue) * 100;

//   // Dynamic class generators
//   const getCardClasses = () => {
//     return `${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 hover:shadow-lg transition-shadow`;
//   };

//   const getButtonClasses = (active?: boolean) => {
//     return `px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
//       isDark
//         ? active 
//           ? 'bg-blue-600 text-white' 
//           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
//         : active
//           ? 'bg-blue-600 text-white'
//           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//     }`;
//   };

//   return (
//     <div className={`p-6 space-y-6 ${colors.background} min-h-screen`}>
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h1 className={`text-2xl font-bold ${colors.text}`}>
//             Financial Health Dashboard
//           </h1>
//           <p className={colors.textSecondary}>
//             Real-time financial overview and revenue analytics
//           </p>
//         </div>
//         <div className="flex items-center gap-4">
//           <span className={`text-sm ${colors.textSecondary}`}>
//             Last updated: {lastRefreshed.toLocaleTimeString()}
//           </span>
//           <button
//             onClick={handleRefresh}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//               isDark 
//                 ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
//                 : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
//             }`}
//             aria-label="Refresh dashboard data"
//           >
//             <RefreshCw className="w-4 h-4" />
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Key Metrics - 3 Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {MOCK_FINANCIAL_METRICS.map((metric, index) => {
//           const Icon = metric.icon;
//           const isPositive = metric.change > 0;
          
//           return (
//             <div
//               key={`${metric.label}-${index}-${refreshKey}`}
//               className={getCardClasses()}
//             >
//               <div className="flex items-start justify-between">
//                 <div>
//                   <p className={`text-sm ${colors.textSecondary} mb-1`}>
//                     {metric.label}
//                   </p>
//                   <p className={`text-3xl font-bold ${colors.text}`}>
//                     {metric.prefix}{metric.value}{metric.suffix}
//                   </p>
//                   <div className="flex items-center gap-1 mt-2">
//                     {isPositive ? (
//                       <ArrowUpRight className="w-4 h-4 text-green-500" />
//                     ) : (
//                       <ArrowDownRight className="w-4 h-4 text-red-500" />
//                     )}
//                     <span className={`text-sm ${
//                       isPositive ? 'text-green-500' : 'text-red-500'
//                     }`}>
//                       {isPositive ? '+' : ''}{metric.change}%
//                     </span>
//                     <span className={`text-sm ${colors.textSecondary}`}>
//                       vs last month
//                     </span>
//                   </div>
//                 </div>
//                 <div className={`p-3 rounded-lg ${metric.bgColor}`}>
//                   <Icon className={`w-6 h-6 ${metric.color}`} />
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Time Range Selector */}
//       <div className="flex justify-end gap-2">
//         <button
//           className={getButtonClasses(timeRange === '6M')}
//           onClick={() => setTimeRange('6M')}
//         >
//           6 Months
//         </button>
//         <button
//           className={getButtonClasses(timeRange === '1Y')}
//           onClick={() => setTimeRange('1Y')}
//         >
//           1 Year
//         </button>
//         <button
//           className={getButtonClasses(timeRange === '2Y')}
//           onClick={() => setTimeRange('2Y')}
//         >
//           2 Years
//         </button>
//       </div>

//       {/* Bar Chart - Revenue vs Expenses */}
//       <div className={getCardClasses()}>
//         <div className="flex items-center gap-2 mb-6">
//           <BarChart3 className={isDark ? 'text-blue-400' : 'text-blue-600'} />
//           <h2 className={`text-lg font-semibold ${colors.text}`}>
//             Revenue vs Expenses
//           </h2>
//         </div>
        
//         <div className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={filteredData}>
//               <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
//               <XAxis 
//                 dataKey="month" 
//                 stroke={colors.textSecondary}
//                 tick={{ fill: colors.textSecondary, fontSize: 12 }}
//               />
//               <YAxis 
//                 stroke={colors.textSecondary}
//                 tick={{ fill: colors.textSecondary, fontSize: 12 }}
//                 tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
//               />
//               <Tooltip
//                 formatter={(value: number) => [formatCurrency(value), '']}
//                 contentStyle={{
//                   backgroundColor: colors.tooltipBg,
//                   borderColor: colors.tooltipBorder,
//                   color: colors.tooltipText,
//                   borderRadius: '8px',
//                   fontSize: '12px'
//                 }}
//               />
//               <Legend />
//               <Bar 
//                 dataKey="revenue" 
//                 fill="#3B82F6" 
//                 name="Revenue"
//                 radius={[4, 4, 0, 0]}
//               />
//               <Bar 
//                 dataKey="expenses" 
//                 fill="#F59E0B" 
//                 name="Expenses"
//                 radius={[4, 4, 0, 0]}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Two Column Layout for Area Chart and Pie Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Area Chart - Profit Trend */}
//         <div className={getCardClasses()}>
//           <div className="flex items-center gap-2 mb-6">
//             <LineChartIcon className={isDark ? 'text-green-400' : 'text-green-600'} />
//             <h2 className={`text-lg font-semibold ${colors.text}`}>
//               Profit Trend
//             </h2>
//           </div>
          
//           <div className="h-80">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={filteredData}>
//                 <defs>
//                   <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
//                     <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
//                 <XAxis 
//                   dataKey="month" 
//                   stroke={colors.textSecondary}
//                   tick={{ fill: colors.textSecondary, fontSize: 12 }}
//                 />
//                 <YAxis 
//                   stroke={colors.textSecondary}
//                   tick={{ fill: colors.textSecondary, fontSize: 12 }}
//                   tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
//                 />
//                 <Tooltip
//                   formatter={(value: number) => [formatCurrency(value), 'Profit']}
//                   contentStyle={{
//                     backgroundColor: colors.tooltipBg,
//                     borderColor: colors.tooltipBorder,
//                     color: colors.tooltipText,
//                     borderRadius: '8px'
//                   }}
//                 />
//                 <Area 
//                   type="monotone" 
//                   dataKey="profit" 
//                   stroke="#10B981" 
//                   strokeWidth={2}
//                   fill="url(#profitGradient)"
//                   name="Profit"
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Pie Chart - Expense Breakdown */}
//         <div className={getCardClasses()}>
//           <div className="flex items-center gap-2 mb-6">
//             <PieChartIcon className={isDark ? 'text-purple-400' : 'text-purple-600'} />
//             <h2 className={`text-lg font-semibold ${colors.text}`}>
//               Expense Breakdown
//             </h2>
//           </div>
          
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={MOCK_EXPENSE_CATEGORIES}
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={60}
//                   outerRadius={90}
//                   paddingAngle={2}
//                   dataKey="value"
//                   label={({ name, percent }) => 
//                     `${name} ${(percent * 100).toFixed(0)}%`
//                   }
//                   labelLine={false}
//                 >
//                   {MOCK_EXPENSE_CATEGORIES.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip
//                   formatter={(value: number) => [formatCurrency(value), 'Amount']}
//                   contentStyle={{
//                     backgroundColor: colors.tooltipBg,
//                     borderColor: colors.tooltipBorder,
//                     color: colors.tooltipText,
//                     borderRadius: '8px'
//                   }}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Revenue Sources Summary */}
//           <div className="mt-4 pt-4 border-t border-gray-700">
//             <h3 className={`text-sm font-medium ${colors.textSecondary} mb-3`}>
//               Top Revenue Sources
//             </h3>
//             <div className="space-y-2">
//               {MOCK_REVENUE_SOURCES.slice(0, 3).map((source, index) => (
//                 <div key={index} className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <div 
//                       className="w-2 h-2 rounded-full" 
//                       style={{ backgroundColor: source.color }}
//                     />
//                     <span className={`text-sm ${colors.textSecondary}`}>
//                       {source.name}
//                     </span>
//                   </div>
//                   <span className={`text-sm font-medium ${colors.text}`}>
//                     {formatCurrency(source.value)}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Summary Footer */}
//       <div className={getCardClasses()}>
//         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
//           <div>
//             <p className={`text-xs ${colors.textMuted}`}>Total Revenue</p>
//             <p className={`text-lg font-semibold ${colors.text}`}>
//               {formatCurrency(totalRevenue)}
//             </p>
//           </div>
//           <div>
//             <p className={`text-xs ${colors.textMuted}`}>Total Expenses</p>
//             <p className={`text-lg font-semibold ${colors.text}`}>
//               {formatCurrency(totalExpenses)}
//             </p>
//           </div>
//           <div>
//             <p className={`text-xs ${colors.textMuted}`}>Net Profit</p>
//             <p className={`text-lg font-semibold text-green-500`}>
//               {formatCurrency(totalProfit)}
//             </p>
//           </div>
//           <div>
//             <p className={`text-xs ${colors.textMuted}`}>Avg. Margin</p>
//             <p className={`text-lg font-semibold ${colors.text}`}>
//               {avgMargin.toFixed(1)}%
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };



// export default RevenueStats

// import React from 'react'

function RevenueStats() {
  return (
    <div>RevenueStats</div>
  )
}

export default RevenueStats