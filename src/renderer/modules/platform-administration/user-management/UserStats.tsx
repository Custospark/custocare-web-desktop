import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Users, 
  UserPlus, 
  CheckCircle, 
  Clock,
  Activity,
  Shield,
  Globe,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';

import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';
import {
  useDashboardStats,
  useKeyMetrics,
  useVerificationFunnel,
  useDailyActivity,
  useWeeklyTrends,
  useDemographicDistribution,
  useMfaAdoption,
  useGeographicDistribution,
  usePlatformBreakdown,
  useUserRetention,
  useSecurityMetrics,
  useStaffPerformance,
  type DateRange,
} from '../statistics/api/user/UserStatsQueries';
import { RootState } from '../../../app/store/rootReducer';

// ==================== ICON MAP ====================

const IconMap = {
  Users,
  UserPlus,
  CheckCircle,
  Clock,
  Activity,
  Shield,
  Globe,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  PieChart: PieChartIcon,
  LineChart: LineChartIcon,
};

// ==================== MAIN COMPONENT ====================

export const UserStats: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';
  
  const [dateRange, setDateRange] = useState<DateRange>('30_days');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'demographics' | 'security' | 'platform'>('overview');

  // Fetch all dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useDashboardStats({ date_range: dateRange });

  // Individual hooks for targeted loading (optional)
  const { data: keyMetrics, refetch: refetchMetrics } = useKeyMetrics({ date_range: dateRange });
  const { data: verificationFunnel, refetch: refetchFunnel } = useVerificationFunnel();
  const { data: dailyActivity, refetch: refetchDaily } = useDailyActivity({ date_range: dateRange });
  const { data: weeklyTrends, refetch: refetchWeekly } = useWeeklyTrends({ date_range: dateRange });
  const { data: demographics, refetch: refetchDemographics } = useDemographicDistribution();
  const { data: mfaAdoption, refetch: refetchMfa } = useMfaAdoption();
  const { data: geographic, refetch: refetchGeographic } = useGeographicDistribution();
  const { data: platform, refetch: refetchPlatform } = usePlatformBreakdown();
  const { data: retention, refetch: refetchRetention } = useUserRetention();
  const { data: security, refetch: refetchSecurity } = useSecurityMetrics();
  const { data: staffPerformance, refetch: refetchStaff } = useStaffPerformance();

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
    refetchMetrics();
    refetchFunnel();
    refetchDaily();
    refetchWeekly();
    refetchDemographics();
    refetchMfa();
    refetchGeographic();
    refetchPlatform();
    refetchRetention();
    refetchSecurity();
    refetchStaff();
    setLastRefreshed(new Date());
  }, [
    refetchDashboard, refetchMetrics, refetchFunnel, refetchDaily,
    refetchWeekly, refetchDemographics, refetchMfa, refetchGeographic,
    refetchPlatform, refetchRetention, refetchSecurity, refetchStaff
  ]);

  const handleExport = useCallback(() => {
    window.open(`/api/admin/statistics/export?date_range=${dateRange}`, '_blank');
  }, [dateRange]);

  const getCardClasses = useCallback(() => {
    return `${colors.cardBg} ${colors.cardBorder} border rounded-xl p-6 hover:shadow-lg transition-shadow`;
  }, [colors.cardBg, colors.cardBorder]);

  const getMetricBgColor = useCallback((baseColor: string) => {
    return isDark ? baseColor.replace('bg-', 'bg-').replace('50', '900/20') : baseColor;
  }, [isDark]);

  // Loading state
  if (dashboardLoading && !dashboardData) {
    return <LoadingSkeleton variant="dashboard" theme={theme} message="Loading platform statistics..." />;
  }

  // Error state
  if (dashboardError) {
    return (
      <div className={`p-8 text-center ${colors.cardBg} rounded-xl border ${colors.cardBorder}`}>
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h3 className={`text-xl font-medium mb-2 ${colors.text}`}>Failed to Load Statistics</h3>
        <p className={colors.textSecondary}>Please try reloading the app.</p>
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
            Platform User Analytics
          </h1>
          <p className={colors.textSecondary}>
            Comprehensive overview of user activity and platform health
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className={`px-3 py-2 rounded-lg border ${colors.cardBorder} ${colors.cardBg} ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="7_days">Last 7 Days</option>
            <option value="14_days">Last 14 Days</option>
            <option value="30_days">Last 30 Days</option>
            <option value="90_days">Last 90 Days</option>
            <option value="12_weeks">Last 12 Weeks</option>
            <option value="24_weeks">Last 24 Weeks</option>
          </select>

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
          onClick={() => setActiveTab('demographics')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'demographics'
              ? isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 shadow'
              : `${colors.textSecondary} hover:${colors.hover}`
          }`}
        >
          Demographics
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'security'
              ? isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 shadow'
              : `${colors.textSecondary} hover:${colors.hover}`
          }`}
        >
          Security & MFA
        </button>
        <button
          onClick={() => setActiveTab('platform')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'platform'
              ? isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 shadow'
              : `${colors.textSecondary} hover:${colors.hover}`
          }`}
        >
          Platform
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics - 6 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {data?.key_metrics.map((metric, index) => {
              const Icon = IconMap[metric.icon as keyof typeof IconMap] || Activity;
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

          {/* Verification Funnel */}
          {data?.verification_funnel && (
            <div className={getCardClasses()}>
              <div className="flex items-center gap-2 mb-6">
                <FileText className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                <h2 className={`text-lg font-semibold ${colors.text}`}>
                  Identity Verification Funnel
                </h2>
                <span className={`ml-auto text-sm px-2 py-1 rounded ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  Avg time: {data.verification_funnel.avg_verification_time_hours}h
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.verification_funnel.funnel}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                      <XAxis type="number" stroke={colors.textSecondary} />
                      <YAxis dataKey="stage" type="category" stroke={colors.textSecondary} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.tooltipBg,
                          borderColor: colors.tooltipBorder,
                          color: colors.tooltipText,
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                        {data.verification_funnel.funnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 2 ? '#10B981' : index === 3 ? '#EF4444' : '#3B82F6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Methods Pie Chart */}
                <div>
                  <h3 className={`text-sm font-medium ${colors.text} mb-4`}>Verification Methods</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.verification_funnel.methods}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => 
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {data.verification_funnel.methods.map((entry, index) => (
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
              </div>
            </div>
          )}

          {/* Daily Activity Chart */}
          {data?.daily_activity && (
            <div className={getCardClasses()}>
              <div className="flex items-center gap-2 mb-6">
                <Activity className={isDark ? 'text-green-400' : 'text-green-600'} />
                <h2 className={`text-lg font-semibold ${colors.text}`}>
                  Daily User Activity
                </h2>
                <span className={`ml-auto text-sm px-2 py-1 rounded ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {dateRange.replace('_', ' ')}
                </span>
              </div>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.daily_activity}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis 
                      dataKey="day" 
                      stroke={colors.textSecondary}
                      tick={{ fill: colors.textSecondary, fontSize: 12 }}
                    />
                    <YAxis 
                      stroke={colors.textSecondary}
                      tick={{ fill: colors.textSecondary, fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.tooltipBg,
                        borderColor: colors.tooltipBorder,
                        color: colors.tooltipText,
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="newUsers" fill="#3B82F6" name="New Users" />
                    <Bar dataKey="verified" fill="#10B981" name="Verified" />
                    <Line type="monotone" dataKey="active" stroke="#F59E0B" name="Active" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Weekly Trends */}
          {data?.weekly_trends && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={getCardClasses()}>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                  <h2 className={`text-lg font-semibold ${colors.text}`}>
                    Weekly Trends
                  </h2>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.weekly_trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                      <XAxis 
                        dataKey="week" 
                        stroke={colors.textSecondary}
                        tick={{ fill: colors.textSecondary, fontSize: 12 }}
                      />
                      <YAxis 
                        stroke={colors.textSecondary}
                        tick={{ fill: colors.textSecondary, fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.tooltipBg,
                          borderColor: colors.tooltipBorder,
                          color: colors.tooltipText,
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="newUsers" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="verified" stroke="#10B981" strokeWidth={2} />
                      <Line type="monotone" dataKey="activeUsers" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MFA Adoption Card */}
              {data?.mfa_adoption && (
                <div className={getCardClasses()}>
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                    <h2 className={`text-lg font-semibold ${colors.text}`}>
                      MFA Adoption
                    </h2>
                    <span className={`ml-auto text-2xl font-bold ${colors.text}`}>
                      {data.mfa_adoption.overall.adoption_rate}%
                    </span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Enabled', value: data.mfa_adoption.overall.enabled },
                            { name: 'Disabled', value: data.mfa_adoption.overall.disabled },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => 
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
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

                  {/* MFA by Region */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h3 className={`text-sm font-medium ${colors.text} mb-2`}>By Region</h3>
                    <div className="space-y-2">
                      {data.mfa_adoption.by_region.slice(0, 3).map((region, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className={`text-sm ${colors.textSecondary}`}>{region.region}</span>
                          <span className={`text-sm font-medium ${colors.text}`}>
                            {region.adoption_rate}% ({region.mfa_count}/{region.total})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DEMOGRAPHICS TAB */}
      {activeTab === 'demographics' && data?.demographic_distribution && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Distribution */}
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Age Distribution
              </h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.demographic_distribution.age}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis dataKey="group" stroke={colors.textSecondary} />
                    <YAxis stroke={colors.textSecondary} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.tooltipBg,
                        borderColor: colors.tooltipBorder,
                        color: colors.tooltipText,
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                      {data.demographic_distribution.age.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gender Distribution */}
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Gender Distribution
              </h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.demographic_distribution.gender}
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
                      {data.demographic_distribution.gender.map((entry, index) => (
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
          </div>

          {/* Geographic Distribution */}
          {data?.geographic_distribution && (
            <div className={getCardClasses()}>
              <div className="flex items-center gap-2 mb-6">
                <Globe className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                <h2 className={`text-lg font-semibold ${colors.text}`}>
                  Geographic Distribution
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top Countries */}
                <div>
                  <h3 className={`text-sm font-medium ${colors.text} mb-3`}>Top Countries</h3>
                  <div className="space-y-2">
                    {data.geographic_distribution.by_country.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-sm ${colors.textSecondary}`}>
                          {item.country_name || item.country}
                        </span>
                        <span className={`text-sm font-medium ${colors.text}`}>
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top US States */}
                {data.geographic_distribution.by_state.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-medium ${colors.text} mb-3`}>Top US States</h3>
                    <div className="space-y-2">
                      {data.geographic_distribution.by_state.slice(0, 7).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className={`text-sm ${colors.textSecondary}`}>
                            {item.state_name || item.state}
                          </span>
                          <span className={`text-sm font-medium ${colors.text}`}>
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Residency */}
                <div>
                  <h3 className={`text-sm font-medium ${colors.text} mb-3`}>Data Residency</h3>
                  <div className="space-y-2">
                    {data.geographic_distribution.by_residency.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-sm ${colors.textSecondary}`}>
                          {item.region}
                        </span>
                        <span className={`text-sm font-medium ${colors.text}`}>
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Retention */}
          {data?.user_retention && data.user_retention.length > 0 && (
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                User Retention Cohorts
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className={`text-left py-2 px-3 ${colors.textSecondary} text-sm font-medium`}>Cohort</th>
                      <th className={`text-left py-2 px-3 ${colors.textSecondary} text-sm font-medium`}>Size</th>
                      {[1, 2, 3, 4, 5].map(month => (
                        <th key={month} className={`text-center py-2 px-3 ${colors.textSecondary} text-sm font-medium`}>
                          Month {month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.user_retention.slice(0, 6).map((cohort, idx) => (
                      <tr key={idx} className={isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'}>
                        <td className={`py-2 px-3 ${colors.text} text-sm`}>{cohort.cohort_label}</td>
                        <td className={`py-2 px-3 ${colors.text} text-sm font-medium`}>{cohort.size}</td>
                        {cohort.retention.slice(0, 5).map((period, pIdx) => (
                          <td key={pIdx} className={`text-center py-2 px-3 text-sm ${
                            period.retention_rate > 50 ? 'text-green-500' : 
                            period.retention_rate > 20 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {period.retention_rate}%
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && data?.security_metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Locked Accounts */}
            <div className={getCardClasses()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className={`text-sm ${colors.textSecondary}`}>Locked Accounts</p>
                  <p className={`text-3xl font-bold ${colors.text}`}>
                    {data.security_metrics.locked_accounts}
                  </p>
                </div>
              </div>
            </div>

            {/* Password Changes */}
            <div className={getCardClasses()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <RefreshCw className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className={`text-sm ${colors.textSecondary}`}>Password Changes (30d)</p>
                  <p className={`text-3xl font-bold ${colors.text}`}>
                    {data.security_metrics.password_changes_30d}
                  </p>
                </div>
              </div>
            </div>

            {/* Require Password Change */}
            <div className={getCardClasses()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className={`text-sm ${colors.textSecondary}`}>Require Password Change</p>
                  <p className={`text-3xl font-bold ${colors.text}`}>
                    {data.security_metrics.require_password_change}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Failed Attempts Distribution */}
          <div className={getCardClasses()}>
            <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
              Failed Login Attempts Distribution
            </h2>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.security_metrics.failed_attempts_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="attempt_range" stroke={colors.textSecondary} />
                  <YAxis stroke={colors.textSecondary} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className={`text-sm ${colors.textSecondary}`}>
                Average failed attempts per user: {data.security_metrics.avg_failed_attempts}
              </p>
            </div>
          </div>

          {/* Staff Performance */}
          {data?.staff_performance && (
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Top Performing Staff
              </h2>
              
              <div className="space-y-4">
                {data.staff_performance.top_performers.map((staff, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className={`font-medium ${colors.text}`}>{staff.staff_name}</p>
                      <p className={`text-xs ${colors.textSecondary}`}>
                        Last: {new Date(staff.last_verification).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${colors.text}`}>
                        {staff.verification_count}
                      </p>
                      <p className={`text-xs ${colors.textSecondary}`}>
                        verifications
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className={`text-sm ${colors.textSecondary}`}>
                  Total verifications: {data.staff_performance.total_verifications}
                </p>
                <p className={`text-sm ${colors.textSecondary}`}>
                  Avg time: {data.staff_performance.avg_verification_time_overall}h
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PLATFORM TAB */}
      {activeTab === 'platform' && data?.platform_breakdown && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Types */}
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Device Types
              </h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Desktop', value: data.platform_breakdown.device_types.desktop },
                        { name: 'Mobile', value: data.platform_breakdown.device_types.mobile },
                        { name: 'Tablet', value: data.platform_breakdown.device_types.tablet },
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
                      <Cell fill="#3B82F6" />
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
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

            {/* Browsers */}
            <div className={getCardClasses()}>
              <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
                Browser Distribution
              </h2>
              
              <div className="space-y-4">
                {Object.entries(data.platform_breakdown.browsers).map(([browser, count]) => (
                  <div key={browser}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm ${colors.text}`}>{browser}</span>
                      <span className={`text-sm font-medium ${colors.text}`}>
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ 
                          width: `${(count / Object.values(data.platform_breakdown.browsers).reduce((a, b) => a + b, 0)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Theme Preference */}
          <div className={getCardClasses()}>
            <h2 className={`text-lg font-semibold ${colors.text} mb-6`}>
              Theme Preference
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {data.platform_breakdown.theme_preference.map((theme, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${colors.textSecondary}`}>{theme.theme} Mode</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>{theme.count.toLocaleString()}</p>
                  <p className={`text-sm ${colors.textSecondary}`}>{theme.percentage}% of users</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStats;