// // MedicalRecordsDashboard.tsx
// import React, { useState } from 'react';
// import { useSelector } from 'react-redux';
// import {
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer
// } from 'recharts';
// import { 
//   Users, 
//   FileText, 
//   TrendingUp,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   Activity,
//   Calendar,
//   UserPlus,
//   RefreshCw
// } from 'lucide-react';


// // Assuming your root state type is defined elsewhere
// interface RootState {
//   ui: {
//     theme: 'light' | 'dark';
//   };
// }

// // Type definitions
// interface MetricData {
//   label: string;
//   value: string | number;
//   change?: number;
//   icon: React.ElementType;
//   color: string;
//   bgColor: string;
// }

// interface DailyActivity {
//   day: string;
//   newRecords: number;
//   processed: number;
//   pending: number;
// }

// interface RecordType {
//   name: string;
//   value: number;
//   color: string;
// }

// interface WeeklyTrend {
//   week: string;
//   consultations: number;
//   labReports: number;
//   prescriptions: number;
// }

// // Mock Data
// const MOCK_METRICS: MetricData[] = [
//   {
//     label: 'New Records Today',
//     value: 48,
//     change: 12,
//     icon: UserPlus,
//     color: 'text-blue-500',
//     bgColor: 'bg-blue-50 dark:bg-blue-900/20'
//   },
//   {
//     label: 'Processed Today',
//     value: 156,
//     change: 8,
//     icon: CheckCircle,
//     color: 'text-green-500',
//     bgColor: 'bg-green-50 dark:bg-green-900/20'
//   },
//   {
//     label: 'Pending Review',
//     value: 23,
//     change: -5,
//     icon: Clock,
//     color: 'text-yellow-500',
//     bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
//   }
// ];

// const MOCK_DAILY_ACTIVITY: DailyActivity[] = [
//   { day: 'Mon', newRecords: 45, processed: 152, pending: 18 },
//   { day: 'Tue', newRecords: 52, processed: 168, pending: 22 },
//   { day: 'Wed', newRecords: 48, processed: 175, pending: 15 },
//   { day: 'Thu', newRecords: 55, processed: 182, pending: 24 },
//   { day: 'Fri', newRecords: 50, processed: 170, pending: 19 },
//   { day: 'Sat', newRecords: 32, processed: 145, pending: 12 },
//   { day: 'Sun', newRecords: 28, processed: 98, pending: 8 }
// ];

// const MOCK_RECORD_TYPES: RecordType[] = [
//   { name: 'Consultations', value: 450, color: '#3B82F6' },
//   { name: 'Lab Reports', value: 320, color: '#10B981' },
//   { name: 'Prescriptions', value: 280, color: '#F59E0B' },
//   { name: 'Imaging', value: 150, color: '#8B5CF6' },
//   { name: 'Surgical', value: 90, color: '#EC4899' }
// ];

// const MOCK_WEEKLY_TREND: WeeklyTrend[] = [
//   { week: 'Week 1', consultations: 420, labReports: 290, prescriptions: 380 },
//   { week: 'Week 2', consultations: 450, labReports: 310, prescriptions: 410 },
//   { week: 'Week 3', consultations: 480, labReports: 340, prescriptions: 430 },
//   { week: 'Week 4', consultations: 520, labReports: 370, prescriptions: 470 }
// ];

// export const MedicalRecordsDashboard: React.FC = () => {
//   // Get theme from Redux store
//   const theme = useSelector((state: RootState) => state.ui.theme);
//   const isDark = theme === 'dark';
  
//   const [refreshKey, setRefreshKey] = useState(0);
//   const [lastRefreshed, setLastRefreshed] = useState(new Date());

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

//   // Dynamic class generators
//   const getCardClasses = () => {
//     return `${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 hover:shadow-lg transition-shadow`;
//   };

//   const getButtonClasses = () => {
//     return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//       isDark 
//         ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
//         : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
//     }`;
//   };

//   const getMetricBgColor = (baseColor: string) => {
//     return isDark ? baseColor.replace('bg-', 'bg-').replace('50', '900/20') : baseColor;
//   };

//   return (
//     <div className={`p-6 space-y-6 ${colors.background} min-h-screen`}>
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h1 className={`text-2xl font-bold ${colors.text}`}>
//             Medical Records Overview
//           </h1>
//           <p className={colors.textSecondary}>
//             Real-time snapshot of patient records and activities
//           </p>
//         </div>
//         <div className="flex items-center gap-4">
//           <span className={`text-sm ${colors.textSecondary}`}>
//             Last updated: {lastRefreshed.toLocaleTimeString()}
//           </span>
//           <button
//             onClick={handleRefresh}
//             className={getButtonClasses()}
//             aria-label="Refresh dashboard data"
//           >
//             <RefreshCw className="w-4 h-4" />
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Key Metrics - 3 Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {MOCK_METRICS.map((metric, index) => {
//           const Icon = metric.icon;
//           const isPositive = metric.change && metric.change > 0;
//           const metricBgColor = getMetricBgColor(metric.bgColor);
          
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
//                     {metric.value}
//                   </p>
//                   {metric.change !== undefined && (
//                     <div className="flex items-center gap-1 mt-2">
//                       <TrendingUp className={`w-4 h-4 ${
//                         isPositive ? 'text-green-500' : 'text-red-500'
//                       }`} />
//                       <span className={`text-sm ${
//                         isPositive ? 'text-green-500' : 'text-red-500'
//                       }`}>
//                         {isPositive ? '+' : ''}{metric.change}%
//                       </span>
//                       <span className={`text-sm ${colors.textSecondary}`}>
//                         vs yesterday
//                       </span>
//                     </div>
//                   )}
//                 </div>
//                 <div className={`p-3 rounded-lg ${metricBgColor}`}>
//                   <Icon className={`w-6 h-6 ${metric.color}`} />
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Bar Chart - Daily Activity */}
//       <div className={getCardClasses()}>
//         <div className="flex items-center gap-2 mb-6">
//           <Activity className={isDark ? 'text-blue-400' : 'text-blue-600'} />
//           <h2 className={`text-lg font-semibold ${colors.text}`}>
//             Daily Patient Record Activity
//           </h2>
//           <span className={`ml-auto text-xs px-2 py-1 rounded ${
//             isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
//           }`}>
//             Last 7 days
//           </span>
//         </div>
        
//         <div className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={MOCK_DAILY_ACTIVITY}>
//               <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
//               <XAxis 
//                 dataKey="day" 
//                 stroke={colors.textSecondary}
//                 tick={{ fill: colors.textSecondary, fontSize: 12 }}
//               />
//               <YAxis 
//                 stroke={colors.textSecondary}
//                 tick={{ fill: colors.textSecondary, fontSize: 12 }}
//               />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: colors.tooltipBg,
//                   borderColor: colors.tooltipBorder,
//                   color: colors.tooltipText,
//                   borderRadius: '8px',
//                   fontSize: '12px'
//                 }}
//               />
//               <Legend 
//                 wrapperStyle={{ 
//                   fontSize: '12px',
//                   color: colors.text 
//                 }}
//               />
//               <Bar 
//                 dataKey="newRecords" 
//                 fill="#3B82F6" 
//                 name="New Records"
//                 radius={[4, 4, 0, 0]}
//               />
//               <Bar 
//                 dataKey="processed" 
//                 fill="#10B981" 
//                 name="Processed"
//                 radius={[4, 4, 0, 0]}
//               />
//               <Bar 
//                 dataKey="pending" 
//                 fill="#F59E0B" 
//                 name="Pending"
//                 radius={[4, 4, 0, 0]}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Summary Stats */}
//         <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
//           <div>
//             <p className={`text-xs ${colors.textMuted}`}>Avg New/ Day</p>
//             <p className={`text-lg font-semibold mt-1 ${colors.text}`}>44</p>
//           </div>
//           <div>
//             <p className={`text-xs ${colors.textMuted}`}>Avg Processed</p>
//             <p className={`text-lg font-semibold mt-1 ${colors.text}`}>156</p>
//           </div>
//           <div>
//             <p className={`text-xs ${colors.textMuted}`}>Efficiency</p>
//             <p className="text-lg font-semibold mt-1 text-green-500">92%</p>
//           </div>
//         </div>
//       </div>

//       {/* Two Column Layout for Line Chart and Pie Chart */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Line Chart - Weekly Trends */}
//         <div className={getCardClasses()}>
//           <div className="flex items-center gap-2 mb-6">
//             <TrendingUp className={isDark ? 'text-purple-400' : 'text-purple-600'} />
//             <h2 className={`text-lg font-semibold ${colors.text}`}>
//               Weekly Record Trends
//             </h2>
//           </div>
          
//           <div className="h-80">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={MOCK_WEEKLY_TREND}>
//                 <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
//                 <XAxis 
//                   dataKey="week" 
//                   stroke={colors.textSecondary}
//                   tick={{ fill: colors.textSecondary, fontSize: 12 }}
//                 />
//                 <YAxis 
//                   stroke={colors.textSecondary}
//                   tick={{ fill: colors.textSecondary, fontSize: 12 }}
//                 />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: colors.tooltipBg,
//                     borderColor: colors.tooltipBorder,
//                     color: colors.tooltipText,
//                     borderRadius: '8px'
//                   }}
//                 />
//                 <Legend 
//                   wrapperStyle={{ 
//                     fontSize: '12px',
//                     color: colors.text 
//                   }}
//                 />
//                 <Line 
//                   type="monotone" 
//                   dataKey="consultations" 
//                   stroke="#3B82F6" 
//                   strokeWidth={2}
//                   dot={{ fill: '#3B82F6', r: 4 }}
//                   activeDot={{ r: 6 }}
//                   name="Consultations"
//                 />
//                 <Line 
//                   type="monotone" 
//                   dataKey="labReports" 
//                   stroke="#10B981" 
//                   strokeWidth={2}
//                   dot={{ fill: '#10B981', r: 4 }}
//                   activeDot={{ r: 6 }}
//                   name="Lab Reports"
//                 />
//                 <Line 
//                   type="monotone" 
//                   dataKey="prescriptions" 
//                   stroke="#F59E0B" 
//                   strokeWidth={2}
//                   dot={{ fill: '#F59E0B', r: 4 }}
//                   activeDot={{ r: 6 }}
//                   name="Prescriptions"
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Pie Chart - Record Type Distribution */}
//         <div className={getCardClasses()}>
//           <div className="flex items-center gap-2 mb-6">
//             <FileText className={isDark ? 'text-pink-400' : 'text-pink-600'} />
//             <h2 className={`text-lg font-semibold ${colors.text}`}>
//               Records by Type
//             </h2>
//           </div>
          
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={MOCK_RECORD_TYPES}
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
//                   {MOCK_RECORD_TYPES.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip
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

//           {/* Legend */}
//           <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-700">
//             {MOCK_RECORD_TYPES.map((type, index) => (
//               <div key={index} className="flex items-center gap-2">
//                 <div 
//                   className="w-3 h-3 rounded-full" 
//                   style={{ backgroundColor: type.color }}
//                 />
//                 <span className={`text-sm ${colors.textSecondary}`}>
//                   {type.name}: {type.value}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Summary Footer */}
//       <div className={getCardClasses()}>
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <Calendar className={`w-4 h-4 ${colors.textSecondary}`} />
//               <span className={`text-sm ${colors.textSecondary}`}>
//                 {new Date().toLocaleDateString('en-US', { 
//                   weekday: 'long', 
//                   year: 'numeric', 
//                   month: 'long', 
//                   day: 'numeric' 
//                 })}
//               </span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Users className={`w-4 h-4 ${colors.textSecondary}`} />
//               <span className={`text-sm ${colors.textSecondary}`}>
//                 Total Active Records: 1,290
//               </span>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <AlertCircle className="w-4 h-4 text-yellow-500" />
//             <span className={`text-sm ${colors.textSecondary}`}>
//               12 records require attention
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MedicalRecordsDashboard;

// import React from 'react'

function MedicalRecordsDashboard() {
  return (
    <div>MedicalRecordsDashboard</div>
  )
}

export default MedicalRecordsDashboard