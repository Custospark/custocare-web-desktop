import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { 
  Building2,
  CheckCircle,
  PlusCircle,
  Ambulance,
  Bed,
  Clock,
  Activity,
  Globe,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  FileText,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Hospital,
  Stethoscope,
  Shield,
  Award,
  CreditCard,
  Phone,
  Mail,
  Users,
} from 'lucide-react';

import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';
import {
  useFacilityDashboardStats,
  useFacilityTypeDistribution,
  useFacilityTierDistribution,
  useOperationalStatusDistribution,
  useFacilityGeographicDistribution,
  useCapacityMetrics,
  useServiceAvailability,
  useSpecialtyServices,
  useEmergencyCapabilities,
  useAccreditationStats,
  useLicenseExpiryMetrics,
  usePerformanceMetrics,
  useDataResidencyDistribution,
  useFacilityGrowthTrends,
} from '../statistics/api/facility/FacilityStatsQueries';

import { RootState } from '../../../app/store/rootReducer';
// ==================== ICON MAP ====================

const IconMap = {
  Building2,
  CheckCircle,
  PlusCircle,
  Ambulance,
  Bed,
  Clock,
  Activity,
  Globe,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  FileText,
  MapPin,
  BarChart3,
  PieChart: PieChartIcon,
  LineChart: LineChartIcon,
  Hospital,
  Stethoscope,
  Shield,
  Award,
  CreditCard,
  Phone,
  Mail,
  Users,
};

// ==================== MAIN COMPONENT ====================

export const FacilityStats: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';
  
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'capacity' | 'services' | 'compliance'>('overview');

  // Fetch all dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useFacilityDashboardStats();

  // Individual hooks for targeted data
  const { data: typeDistribution, refetch: refetchType } = useFacilityTypeDistribution();
  const { data: tierDistribution, refetch: refetchTier } = useFacilityTierDistribution();
  const { data: statusDistribution, refetch: refetchStatus } = useOperationalStatusDistribution();
  const { data: geographic, refetch: refetchGeographic } = useFacilityGeographicDistribution();
  const { data: capacity, refetch: refetchCapacity } = useCapacityMetrics();
  const { data: services, refetch: refetchServices } = useServiceAvailability();
  const { data: specialties, refetch: refetchSpecialties } = useSpecialtyServices();
  const { data: emergency, refetch: refetchEmergency } = useEmergencyCapabilities();
  const { data: accreditations, refetch: refetchAccreditations } = useAccreditationStats();
  const { data: licenses, refetch: refetchLicenses } = useLicenseExpiryMetrics();
  const { data: performance, refetch: refetchPerformance } = usePerformanceMetrics();
  const { data: residency, refetch: refetchResidency } = useDataResidencyDistribution();
  const { data: growthTrends, refetch: refetchGrowth } = useFacilityGrowthTrends();

  // Theme-based colors
  const colors = useMemo(() => ({
    background: isDark ? 'bg-gray-1000' : 'bg-gray-50',
    cardBg: isDark ? 'bg-gray-900' : 'bg-white',
    cardBorder: isDark ? 'border-gray-700' : 'border-gray-200',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
    hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    grid: isDark ? '#374151' : '#E5E7EB',
    tooltipBg: isDark ? '#1F2937' : '#FFFFFF',
    tooltipBorder: isDark ? '#374151' : '#E5E7EB',
    tooltipText: isDark ? '#F9FAFB' : '#111827',
  }), [isDark]);

  const handleRefresh = useCallback(() => {
    refetchDashboard();
    refetchType();
    refetchTier();
    refetchStatus();
    refetchGeographic();
    refetchCapacity();
    refetchServices();
    refetchSpecialties();
    refetchEmergency();
    refetchAccreditations();
    refetchLicenses();
    refetchPerformance();
    refetchResidency();
    refetchGrowth();
    setLastRefreshed(new Date());
  }, [
    refetchDashboard, refetchType, refetchTier, refetchStatus,
    refetchGeographic, refetchCapacity, refetchServices, refetchSpecialties,
    refetchEmergency, refetchAccreditations, refetchLicenses, refetchPerformance,
    refetchResidency, refetchGrowth
  ]);

  const handleExport = useCallback(() => {
    window.open('/api/admin/statistics/facilities/export', '_blank');
  }, []);

  const getCardClasses = useCallback(() => {
    return `${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 hover:shadow-lg transition-shadow`;
  }, [colors.cardBg, colors.cardBorder]);

  const getMetricBgColor = useCallback((baseColor: string) => {
    return isDark ? baseColor.replace('bg-', 'bg-').replace('50', '900/20') : baseColor;
  }, [isDark]);

  // Loading state
  if (dashboardLoading && !dashboardData) {
    return <LoadingSkeleton variant="dashboard" theme={theme} message="Loading facility statistics..." />;
  }

  // Error state
  if (dashboardError) {
    return (
      <div className={`p-8 text-center ${colors.cardBg} rounded-xl border ${colors.cardBorder}`}>
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h3 className={`text-xl font-medium mb-2 ${colors.text}`}>Failed to Load Statistics</h3>
        <p className={colors.textSecondary}>Please try refreshing the page.</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const data = dashboardData?.data;

  return (
    <div className={`p-6 space-y-6 ${colors.background} min-h-screen`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${colors.text}`}>
            Facility Analytics
          </h1>
          <p className={colors.textSecondary}>
            Comprehensive overview of healthcare facilities on the platform
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex justify-end">
        <span className={`text-sm ${colors.textSecondary}`}>
          Last updated: {lastRefreshed.toLocaleTimeString()}
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex gap-2 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} w-fit`}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 shadow'
              : `${colors.textSecondary} hover:${colors.hover}`
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'capacity'
              ? isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 shadow'
              : `${colors.textSecondary} hover:${colors.hover}`
          }`}
        >
          Capacity & Resources
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 shadow'
              : `${colors.textSecondary} hover:${colors.hover}`
          }`}
        >
          Services & Specialties
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'compliance'
              ? isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 shadow'
              : `${colors.textSecondary} hover:${colors.hover}`
          }`}
        >
          Compliance & Licenses
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics - 6 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {data?.key_metrics.map((metric, index) => {
              const Icon = IconMap[metric.icon as keyof typeof IconMap] || Building2;
              const isPositive = metric.change && metric.change > 0;
              
              return (
                <div key={index} className={getCardClasses()}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs ${colors.textSecondary} mb-1`}>
                        {metric.label}
                      </p>
                      <p className={`text-2xl font-bold ${colors.text}`}>
                        {metric.value}
                      </p>
                      {metric.change !== undefined && metric.change !== null && (
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className={`w-3 h-3 ${
                            isPositive ? 'text-green-500' : 'text-red-500'
                          }`} />
                          <span className={`text-xs ${
                            isPositive ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {isPositive ? '+' : ''}{metric.change}%
                          </span>
                        </div>
                      )}
                      {metric.subtext && (
                        <p className={`text-xs ${colors.textMuted} mt-1`}>
                          {metric.subtext}
                        </p>
                      )}
                    </div>
                    <div className={`p-2 rounded-lg ${getMetricBgColor(metric.bgColor)}`}>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Two Column Layout for Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Facility Type Distribution */}
            {data?.facility_type_distribution && (
              <div className={getCardClasses()}>
                <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                  Facilities by Type
                </h2>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.facility_type_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="type_label"
                        label={({ type_label, percent }) => 
                          `${type_label} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {data.facility_type_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.tooltipBg,
                          borderColor: colors.tooltipBorder,
                          color: colors.tooltipText,
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-700">
                  {data.facility_type_distribution.slice(0, 6).map((type, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                      <span className={`text-xs ${colors.textSecondary}`}>
                        {type.type_label}: {type.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facility Tier Distribution */}
            {data?.facility_tier_distribution && (
              <div className={getCardClasses()}>
                <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                  Facilities by Tier
                </h2>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.facility_tier_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                      <XAxis dataKey="tier_label" stroke={colors.textSecondary} />
                      <YAxis stroke={colors.textSecondary} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.tooltipBg,
                          borderColor: colors.tooltipBorder,
                          color: colors.tooltipText,
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {data.facility_tier_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Status Distribution */}
          {data?.operational_status_distribution && (
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Operational Status
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {data.operational_status_distribution.map((status, idx) => (
                  <div key={idx} className="text-center">
                    <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: status.color }} />
                    <p className={`text-sm font-medium ${colors.text}`}>{status.status_label}</p>
                    <p className={`text-lg font-bold ${colors.text}`}>{status.count}</p>
                    <p className={`text-xs ${colors.textSecondary}`}>
                      {((status.count / data.key_metrics[0].value as number) * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Trends */}
          {data?.facility_growth_trends && (
            <div className={getCardClasses()}>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className={isDark ? 'text-green-400' : 'text-green-600'} />
                <h2 className={`text-lg font-semibold ${colors.text}`}>
                  Facility Growth Trends
                </h2>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.facility_growth_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis dataKey="month" stroke={colors.textSecondary} />
                    <YAxis yAxisId="left" stroke={colors.textSecondary} />
                    <YAxis yAxisId="right" orientation="right" stroke={colors.textSecondary} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.tooltipBg,
                        borderColor: colors.tooltipBorder,
                        color: colors.tooltipText,
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="new_facilities" fill="#3B82F6" name="New Facilities" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative_total" stroke="#10B981" name="Cumulative Total" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CAPACITY TAB */}
      {activeTab === 'capacity' && data?.capacity_metrics && (
        <div className="space-y-6">
          {/* Bed Capacity Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={getCardClasses()}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Total Bed Capacity</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {data.capacity_metrics.bed_distribution.reduce((sum, item) => {
                  const count = item.count;
                  const range = item.range;
                  let avg = 0;
                  if (range === '0-50') avg = 25;
                  else if (range === '51-100') avg = 75;
                  else if (range === '101-200') avg = 150;
                  else if (range === '201-500') avg = 350;
                  else if (range === '500+') avg = 750;
                  return sum + (count * avg);
                }, 0).toLocaleString()}
              </p>
            </div>
            <div className={getCardClasses()}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Facilities with Beds</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {data.capacity_metrics.facilities_with_beds}
              </p>
            </div>
            <div className={getCardClasses()}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Avg Bed Capacity</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {data.capacity_metrics.avg_bed_capacity}
              </p>
            </div>
          </div>

          {/* Bed Distribution Chart */}
          <div className={getCardClasses()}>
            <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
              Bed Capacity Distribution
            </h2>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.capacity_metrics.bed_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="range" stroke={colors.textSecondary} />
                  <YAxis stroke={colors.textSecondary} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.capacity_metrics.bed_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Emergency Capabilities */}
          {data?.emergency_capabilities && (
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Emergency Capabilities
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 inline-block mb-2">
                    <Ambulance className="w-6 h-6 text-red-500" />
                  </div>
                  <p className={`text-sm font-medium ${colors.text}`}>Emergency Dept</p>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {data.emergency_capabilities.emergency_dept.count}
                  </p>
                  <p className={`text-xs ${colors.textSecondary}`}>
                    {data.emergency_capabilities.emergency_dept.percentage}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 inline-block mb-2">
                    <Shield className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className={`text-sm font-medium ${colors.text}`}>Trauma Center</p>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {data.emergency_capabilities.trauma_center.count}
                  </p>
                  <p className={`text-xs ${colors.textSecondary}`}>
                    {data.emergency_capabilities.trauma_center.percentage}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 inline-block mb-2">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className={`text-sm font-medium ${colors.text}`}>Intensive Care</p>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {data.emergency_capabilities.intensive_care.count}
                  </p>
                  <p className={`text-xs ${colors.textSecondary}`}>
                    {data.emergency_capabilities.intensive_care.percentage}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 inline-block mb-2">
                    <Users className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className={`text-sm font-medium ${colors.text}`}>Neonatal ICU</p>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {data.emergency_capabilities.neonatal_icu.count}
                  </p>
                  <p className={`text-xs ${colors.textSecondary}`}>
                    {data.emergency_capabilities.neonatal_icu.percentage}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 inline-block mb-2">
                    <Activity className="w-6 h-6 text-pink-500" />
                  </div>
                  <p className={`text-sm font-medium ${colors.text}`}>Cardiac Cath Lab</p>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {data.emergency_capabilities.cardiac_cath_lab.count}
                  </p>
                  <p className={`text-xs ${colors.textSecondary}`}>
                    {data.emergency_capabilities.cardiac_cath_lab.percentage}%
                  </p>
                </div>
              </div>

              {/* Trauma Center Levels */}
              {data.emergency_capabilities.trauma_center.by_level.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className={`text-sm font-medium ${colors.text} mb-2`}>Trauma Center Levels</p>
                  <div className="flex gap-4">
                    {data.emergency_capabilities.trauma_center.by_level.map((level, idx) => (
                      <div key={idx}>
                        <span className={`text-sm ${colors.textSecondary}`}>{level.level}:</span>
                        <span className={`ml-1 text-sm font-medium ${colors.text}`}>{level.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'services' && data?.service_availability && (
        <div className="space-y-6">
          {/* Service Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={getCardClasses()}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Unique Services</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {data.service_availability.total_unique_services}
              </p>
            </div>
            <div className={getCardClasses()}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Avg Services/Facility</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {data.service_availability.avg_services_per_facility}
              </p>
            </div>
            <div className={getCardClasses()}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Facilities w/ Specialties</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {data.specialty_services?.facilities_with_specialties || 0}
              </p>
            </div>
          </div>

          {/* Top Services */}
          <div className={getCardClasses()}>
            <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
              Top 10 Services Offered
            </h2>
            
            <div className="space-y-4">
              {data.service_availability.top_services.map((service, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm ${colors.text}`}>{service.service}</span>
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {service.count} ({service.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Specialties */}
          {data?.specialty_services && (
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Top 10 Specialties
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.specialty_services.top_specialties.map((specialty, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <span className={`text-sm ${colors.text}`}>{specialty.specialty}</span>
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {specialty.count} ({specialty.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPLIANCE TAB */}
      {activeTab === 'compliance' && data?.license_expiry_metrics && (
        <div className="space-y-6">
          {/* License Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className={`${getCardClasses()} border-l-4 border-green-500`}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Valid Licenses</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {data.license_expiry_metrics.total_with_license - data.license_expiry_metrics.expired}
              </p>
            </div>
            <div className={`${getCardClasses()} border-l-4 border-yellow-500`}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Expiring Soon</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {data.license_expiry_metrics.expiring_soon}
              </p>
            </div>
            <div className={`${getCardClasses()} border-l-4 border-orange-500`}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Expiring (31-90d)</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {data.license_expiry_metrics.expiring_medium}
              </p>
            </div>
            <div className={`${getCardClasses()} border-l-4 border-red-500`}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>Expired</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {data.license_expiry_metrics.expired}
              </p>
            </div>
            <div className={`${getCardClasses()} border-l-4 border-gray-500`}>
              <p className={`text-sm ${colors.textSecondary} mb-2`}>No License Data</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {data.license_expiry_metrics.no_license_date}
              </p>
            </div>
          </div>

          {/* License Expiry Chart */}
          <div className={getCardClasses()}>
            <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
              License Expiry Distribution
            </h2>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Expiring Soon (≤30d)', value: data.license_expiry_metrics.expiring_soon, color: '#F59E0B' },
                      { name: 'Expiring (31-90d)', value: data.license_expiry_metrics.expiring_medium, color: '#F97316' },
                      { name: 'Expiring Later (>90d)', value: data.license_expiry_metrics.expiring_later, color: '#10B981' },
                      { name: 'Expired', value: data.license_expiry_metrics.expired, color: '#EF4444' },
                      { name: 'No License Date', value: data.license_expiry_metrics.no_license_date, color: '#6B7280' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {[
                      { color: '#F59E0B' },
                      { color: '#F97316' },
                      { color: '#10B981' },
                      { color: '#EF4444' },
                      { color: '#6B7280' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accreditation Stats */}
          {data?.accreditation_stats && (
            <div className={getCardClasses()}>
              <div className="flex items-center gap-2 mb-6">
                <Award className={isDark ? 'text-yellow-400' : 'text-yellow-600'} />
                <h2 className={`text-lg font-semibold ${colors.text}`}>
                  Accreditations
                </h2>
                <span className={`ml-auto text-sm px-2 py-1 rounded ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {data.accreditation_stats.percentage_accredited}% of facilities accredited
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className={`text-sm font-medium ${colors.text} mb-4`}>Top Accreditations</p>
                  <div className="space-y-3">
                    {data.accreditation_stats.top_accreditations.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-sm ${colors.textSecondary}`}>{item.accreditation}</span>
                        <span className={`text-sm font-medium ${colors.text}`}>
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium ${colors.text} mb-4`}>Summary</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${colors.textSecondary}`}>Accredited Facilities</span>
                      <span className={`text-sm font-medium ${colors.text}`}>
                        {data.accreditation_stats.accredited_facilities}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${colors.textSecondary}`}>Total Facilities</span>
                      <span className={`text-sm font-medium ${colors.text}`}>
                        {data.key_metrics[0].value}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                      <span className={`text-sm font-medium ${colors.text}`}>Accreditation Rate</span>
                      <span className={`text-lg font-bold ${colors.text}`}>
                        {data.accreditation_stats.percentage_accredited}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {data?.performance_metrics && (
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Performance Metrics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className={`text-sm ${colors.textSecondary} mb-2`}>Avg Wait Time</p>
                  <p className={`text-3xl font-bold ${colors.text}`}>
                    {data.performance_metrics.avg_wait_time_overall} min
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-sm ${colors.textSecondary} mb-2`}>Patient Satisfaction</p>
                  <p className={`text-3xl font-bold ${colors.text}`}>
                    {data.performance_metrics.avg_satisfaction_overall}/5
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-sm ${colors.textSecondary} mb-2`}>Monthly Volume</p>
                  <p className={`text-3xl font-bold ${colors.text}`}>
                    {data.performance_metrics.total_monthly_volume.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className={`text-sm ${colors.textSecondary}`}>
                  {data.performance_metrics.facilities_with_performance_data} facilities reporting performance data
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacilityStats;