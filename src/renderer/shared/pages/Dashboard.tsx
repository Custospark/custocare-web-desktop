import React, { useMemo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store/store';
import Breadcrumb from '../components/Navigation/Breadcrumbs';
import ContentSection from '../components/Navigation/ContentSection';
import {
  Plus, FileText, Sparkles, Users, Clock, Calendar, Download,
  Filter, Search, Bell, MessageSquare, Video, Heart, Brain, Eye,
} from 'lucide-react';
import { cn } from '../types/cn';

/**
 * ============================================================================
 * CONSTANTS & CONFIGURATION
 * ============================================================================
 */

/**
 * Dashboard breadcrumb navigation structure
 * Defines the navigation hierarchy for the dashboard view
 */
const BREADCRUMB_ITEMS = [
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: <Sparkles className="w-4 h-4" /> 
  },
  { 
    label: 'Healthcare Analytics', 
    href: '/dashboard/analytics' 
  },
  { 
    label: 'Live Overview' 
  },
];

/**
 * Time range filter options for analytics
 */
const TIME_RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last quarter' },
] as const;

/**
 * Department filter options
 */
const DEPARTMENT_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'pediatrics', label: 'Pediatrics' },
] as const;

/**
 * Patient status types with their visual styling
 */
const PATIENT_STATUS_CONFIG = {
  critical: {
    label: 'Critical',
    darkClasses: 'bg-red-500/20 text-red-300',
    lightClasses: 'bg-red-100 text-red-700',
  },
  monitoring: {
    label: 'Monitoring',
    darkClasses: 'bg-amber-500/20 text-amber-300',
    lightClasses: 'bg-amber-100 text-amber-700',
  },
  stable: {
    label: 'Stable',
    darkClasses: 'bg-emerald-500/20 text-emerald-300',
    lightClasses: 'bg-emerald-100 text-emerald-700',
  },
} as const;

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

/**
 * Statistics card data structure
 */
interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
  detail: string;
}

/**
 * Patient record structure
 */
interface Patient {
  id: string;
  name: string;
  age: string;
  gender: 'M' | 'F';
  status: keyof typeof PATIENT_STATUS_CONFIG;
  lastVisit: string;
  doctor: string;
  condition: string;
}

/**
 * Quick action button configuration
 */
interface QuickAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  action: () => void;
}

/**
 * Local dashboard state interface
 */
interface DashboardState {
  searchQuery: string;
  timeRange: string;
  department: string;
  viewMode: 'list' | 'grid' | 'kanban';
}

/**
 * ============================================================================
 * MAIN COMPONENT
 * ============================================================================
 */

/**
 * Dashboard Component - Healthcare Analytics Overview
 * 
 * Architecture Overview:
 * =====================
 * Enterprise-grade healthcare dashboard providing real-time analytics,
 * patient management, and operational insights. Implements responsive
 * design with comprehensive filtering and search capabilities.
 * 
 * Key Responsibilities:
 * - Display real-time healthcare metrics and KPIs
 * - Patient activity monitoring and management
 * - Quick action access for common workflows
 * - Advanced filtering and search functionality
 * - Data export capabilities
 * - Responsive layout for all device sizes
 * 
 * State Management Strategy:
 * - Global UI state (theme, sidebar) → Redux store
 * - Local dashboard filters and search → Component state
 * - Patient data → Should integrate with patient Redux slice
 * - Computed statistics → useMemo for performance
 * 
 * Data Flow:
 * 1. Redux provides theme and global UI state
 * 2. Local state manages dashboard-specific filters
 * 3. Mock data demonstrates structure (replace with API calls)
 * 4. Computed values optimize rendering performance
 * 
 * Performance Optimizations:
 * - Memoized callbacks prevent unnecessary re-renders
 * - useMemo for expensive computations (stats, tables)
 * - Lazy loading for chart components (when implemented)
 * - Virtualized tables for large datasets (future enhancement)
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - ARIA labels for interactive elements
 * - Keyboard navigation support
 * - Screen reader compatible
 * 
 * @returns {JSX.Element} Healthcare dashboard interface
 */
export const Dashboard: React.FC = () => {
  /**
   * =========================================================================
   * REDUX STATE & DISPATCH
   * =========================================================================
   */
  
  // const dispatch = useDispatch<AppDispatch>();
  
  // Select global UI state from Redux store
  const theme = useSelector((state: RootState) => state.ui.theme);

  /**
   * =========================================================================
   * LOCAL COMPONENT STATE
   * =========================================================================
   */

  /**
   * Dashboard-specific state
   * Manages filters, search, and view preferences
   * Intentionally local as these settings are page-specific
   */
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    searchQuery: '',
    timeRange: '24h',
    department: 'all',
    viewMode: 'list',
  });

  /**
   * =========================================================================
   * MOCK DATA (Replace with Redux selectors or API calls)
   * =========================================================================
   */

  /**
   * Statistics cards configuration
   * Memoized to prevent recreation on every render
   * 
   * TODO: Replace with data from Redux patient slice or API
   * Production implementation should:
   * - Fetch from analytics API endpoint
   * - Update in real-time via WebSocket
   * - Cache results with appropriate TTL
   */
  const statsCards = useMemo<StatCard[]>(() => [
    {
      title: 'Active Patients',
      value: '2,427',
      change: '+12.5%',
      trend: 'up',
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
      detail: '24 in critical condition',
    },
    {
      title: 'Avg. Wait Time',
      value: '8.4m',
      change: '-2.3m',
      trend: 'down',
      icon: <Clock className="w-5 h-5" />,
      color: 'from-emerald-500 to-green-500',
      detail: 'Below target of 15m',
    },
    {
      title: 'Satisfaction',
      value: '94.2%',
      change: '+3.1%',
      trend: 'up',
      icon: <Heart className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500',
      detail: '487 reviews this month',
    },
    {
      title: 'AI Accuracy',
      value: '98.7%',
      change: '+0.4%',
      trend: 'up',
      icon: <Brain className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-500',
      detail: 'Based on 12.4K diagnoses',
    },
  ], []);

  /**
   * Recent patients data
   * Memoized to prevent recreation on every render
   * 
   * TODO: Replace with Redux patient selector or API call
   * Production implementation should:
   * - Paginate results for large datasets
   * - Implement real-time updates
   * - Add sorting and advanced filtering
   */
  const recentPatients = useMemo<Patient[]>(() => [
    {
      id: 'PT-2023-8492',
      name: 'John Doe',
      age: '42',
      gender: 'M',
      status: 'critical',
      lastVisit: '2 hours ago',
      doctor: 'Dr. Smith',
      condition: 'Hypertension',
    },
    {
      id: 'PT-2023-8493',
      name: 'Jane Smith',
      age: '34',
      gender: 'F',
      status: 'stable',
      lastVisit: '1 day ago',
      doctor: 'Dr. Johnson',
      condition: 'Diabetes Type 2',
    },
    {
      id: 'PT-2023-8494',
      name: 'Robert Chen',
      age: '58',
      gender: 'M',
      status: 'monitoring',
      lastVisit: '3 hours ago',
      doctor: 'Dr. Williams',
      condition: 'Cardiac Arrhythmia',
    },
    {
      id: 'PT-2023-8495',
      name: 'Maria Garcia',
      age: '29',
      gender: 'F',
      status: 'stable',
      lastVisit: '2 days ago',
      doctor: 'Dr. Brown',
      condition: 'Asthma',
    },
  ], []);

  /**
   * =========================================================================
   * EVENT HANDLERS (MEMOIZED CALLBACKS)
   * =========================================================================
   */

  /**
   * Handle search input changes
   * Debouncing should be implemented for production use
   * 
   * @param e - Change event from search input
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDashboardState(prev => ({ ...prev, searchQuery: e.target.value }));
    // TODO: Implement debounced API search call
    // Example: debouncedSearch(e.target.value);
  }, []);

  /**
   * Handle time range filter change
   * Triggers data refresh with new time parameters
   * 
   * @param e - Change event from time range select
   */
  const handleTimeRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDashboardState(prev => ({ ...prev, timeRange: e.target.value }));
    // TODO: Fetch updated analytics data
    // Example: dispatch(fetchAnalytics({ timeRange: e.target.value }));
  }, []);

  /**
   * Handle department filter change
   * Filters data by selected department
   * 
   * @param e - Change event from department select
   */
  const handleDepartmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDashboardState(prev => ({ ...prev, department: e.target.value }));
    // TODO: Filter patient data by department
    // Example: dispatch(filterPatientsByDepartment(e.target.value));
  }, []);

  /**
   * Handle view mode changes (list, grid, kanban)
   * Updates the layout presentation of patient data
   * 
   * @param mode - New view mode to apply
   */
  // const handleViewModeChange = useCallback((mode: 'list' | 'grid' | 'kanban') => {
  //   setDashboardState(prev => ({ ...prev, viewMode: mode }));
  // }, []);

  /**
   * Handle breadcrumb navigation
   * Logs navigation for debugging (replace with router navigation)
   * 
   * @param item - Clicked breadcrumb item
   * @param index - Position in breadcrumb trail
   */
    type BreadcrumbItem = {
    label: string;
    href?: string;
  };
  const handleBreadcrumbClick = useCallback((item: BreadcrumbItem, index: number) => {
    console.log('Breadcrumb clicked:', item, index);
    // TODO: Implement navigation with React Router
    // Example: navigate(item.href);
  }, []);

  /**
   * Export patient data to CSV
   * Generates CSV file from filtered patient data
   */
  const handleExportCSV = useCallback(() => {
    console.log('Exporting CSV...');
    // TODO: Implement CSV export functionality
    // Example: exportToCSV(filteredPatients, 'patients-export.csv');
  }, []);

  /**
   * Quick action handlers
   * Each quick action button triggers specific workflows
   */
  const quickActionHandlers = useMemo(() => ({
    newPatient: () => {
      console.log('Navigate to new patient form');
      // TODO: Navigate to patient creation form
      // Example: navigate('/patients/new');
    },
    quickReport: () => {
      console.log('Generate quick report');
      // TODO: Open report generation modal
      // Example: dispatch(openModal('quickReport'));
    },
    schedule: () => {
      console.log('Open scheduling interface');
      // TODO: Navigate to calendar/scheduling view
      // Example: navigate('/schedule');
    },
    messages: () => {
      console.log('Open messages');
      // TODO: Navigate to messaging interface
      // Example: navigate('/messages');
    },
    telehealth: () => {
      console.log('Start telehealth session');
      // TODO: Open telehealth modal or navigate to video call
      // Example: dispatch(openModal('telehealth'));
    },
    alerts: () => {
      console.log('View alerts');
      // TODO: Open alerts panel
      // Example: dispatch(toggleSidebar('alerts'));
    },
  }), []);

  /**
   * Quick actions configuration
   * Memoized to prevent recreation on every render
   */
  const quickActions = useMemo<QuickAction[]>(() => [
    { 
      icon: <Plus className="w-5 h-5" />, 
      label: 'New Patient', 
      color: 'bg-blue-500',
      action: quickActionHandlers.newPatient,
    },
    { 
      icon: <FileText className="w-5 h-5" />, 
      label: 'Quick Report', 
      color: 'bg-emerald-500',
      action: quickActionHandlers.quickReport,
    },
    { 
      icon: <Calendar className="w-5 h-5" />, 
      label: 'Schedule', 
      color: 'bg-purple-500',
      action: quickActionHandlers.schedule,
    },
    { 
      icon: <MessageSquare className="w-5 h-5" />, 
      label: 'Messages', 
      color: 'bg-amber-500',
      action: quickActionHandlers.messages,
    },
    { 
      icon: <Video className="w-5 h-5" />, 
      label: 'Telehealth', 
      color: 'bg-rose-500',
      action: quickActionHandlers.telehealth,
    },
    { 
      icon: <Bell className="w-5 h-5" />, 
      label: 'Alerts', 
      color: 'bg-red-500',
      action: quickActionHandlers.alerts,
    },
  ], [quickActionHandlers]);

  /**
   * =========================================================================
   * COMPUTED VALUES (MEMOIZED)
   * =========================================================================
   */

  /**
   * Filtered patients based on search query
   * Implements client-side filtering for demonstration
   * 
   * TODO: Move filtering to backend API for production
   */
  const filteredPatients = useMemo(() => {
    if (!dashboardState.searchQuery) return recentPatients;
    
    const query = dashboardState.searchQuery.toLowerCase();
    return recentPatients.filter(patient =>
      patient.name.toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query) ||
      patient.condition.toLowerCase().includes(query) ||
      patient.doctor.toLowerCase().includes(query)
    );
  }, [recentPatients, dashboardState.searchQuery]);

  /**
   * =========================================================================
   * RENDER HELPER FUNCTIONS
   * =========================================================================
   */

  /**
   * Render statistics cards grid
   * Displays key performance indicators with trend visualization
   * Memoized to prevent unnecessary recalculation
   */
  const renderStatsGrid = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => (
        <div
          key={index}
          className={cn(
            'relative p-5 rounded-2xl border backdrop-blur-sm',
            'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
            'cursor-pointer',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50 hover:border-gray-700/50'
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60 hover:border-gray-300'
          )}
          role="button"
          tabIndex={0}
          aria-label={`${stat.title}: ${stat.value}`}
        >
          {/* Background gradient overlay */}
          <div 
            className={cn(
              'absolute inset-0 rounded-2xl opacity-10',
              `bg-gradient-to-br ${stat.color}`
            )} 
            aria-hidden="true"
          />

          <div className="relative z-10">
            {/* Header: Icon and trend badge */}
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                'p-2.5 rounded-xl',
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
              )}>
                <div className={cn(
                  'text-white',
                  stat.color.includes('blue') ? 'text-blue-400' :
                  stat.color.includes('emerald') ? 'text-emerald-400' :
                  stat.color.includes('purple') ? 'text-purple-400' : 'text-amber-400'
                )}>
                  {stat.icon}
                </div>
              </div>
              
              {/* Trend indicator badge */}
              <span className={cn(
                'px-2.5 py-1 text-xs font-bold rounded-full',
                stat.trend === 'up'
                  ? theme === 'dark'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-700'
                  : theme === 'dark'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-red-100 text-red-700'
              )}>
                {stat.change}
              </span>
            </div>

            {/* Content: Title, value, detail */}
            <div className="space-y-1">
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {stat.title}
              </p>
              <h3 className={cn(
                'text-2xl lg:text-3xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {stat.value}
              </h3>
              <p className={cn(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              )}>
                {stat.detail}
              </p>
            </div>

            {/* Visual trend line indicator */}
            <div className="mt-4">
              <div className={cn(
                'h-1 rounded-full overflow-hidden',
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              )}>
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    stat.trend === 'up'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                  )}
                  style={{ width: stat.trend === 'up' ? '85%' : '65%' }}
                  role="progressbar"
                  aria-valuenow={stat.trend === 'up' ? 85 : 65}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ), [statsCards, theme]);

  /**
   * Render patient table with action buttons
   * Displays filterable list of recent patient activity
   * Memoized to prevent unnecessary recalculation
   */
  const renderPatientTable = useMemo(() => (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
    )}>
      {/* Table header with filter button */}
      <div className={cn(
        'px-4 py-3 border-b',
        theme === 'dark' ? 'bg-gray-900/50 border-gray-800/50' : 'bg-gray-50/50 border-gray-200'
      )}>
        <div className="flex items-center justify-between">
          <h4 className={cn(
            'text-sm font-semibold',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Recent Patients
            {dashboardState.searchQuery && (
              <span className={cn(
                'ml-2 text-xs font-normal',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              )}>
                ({filteredPatients.length} results)
              </span>
            )}
          </h4>
          <button 
            className={cn(
              'text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
            aria-label="Open filter options"
          >
            <Filter className="w-3 h-3" />
            Filter
          </button>
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn(
              'border-b text-xs font-semibold',
              theme === 'dark' ? 'border-gray-800/50 text-gray-400' : 'border-gray-200 text-gray-600'
            )}>
              <th className="py-3 px-4 text-left">Patient</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Condition</th>
              <th className="py-3 px-4 text-left">Last Visit</th>
              <th className="py-3 px-4 text-left">Doctor</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => {
                const statusConfig = PATIENT_STATUS_CONFIG[patient.status];
                
                return (
                  <tr
                    key={patient.id}
                    className={cn(
                      'border-b transition-colors hover:bg-opacity-50',
                      theme === 'dark'
                        ? 'border-gray-800/30 hover:bg-gray-800/30'
                        : 'border-gray-100 hover:bg-gray-50/50'
                    )}
                  >
                    {/* Patient info cell */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                          theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                        )}>
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          )}>
                            {patient.name}
                          </p>
                          <p className={cn(
                            'text-xs',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            {patient.id} • {patient.age}yo {patient.gender}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status badge cell */}
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2.5 py-1 text-xs font-bold rounded-full',
                        theme === 'dark' 
                          ? statusConfig.darkClasses 
                          : statusConfig.lightClasses
                      )}>
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Condition cell */}
                    <td className="py-3 px-4">
                      <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {patient.condition}
                      </p>
                    </td>

                    {/* Last visit cell */}
                    <td className="py-3 px-4">
                      <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {patient.lastVisit}
                      </p>
                    </td>

                    {/* Doctor cell */}
                    <td className="py-3 px-4">
                      <p className={cn(
                        'text-sm font-medium',
                        theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
                      )}>
                        {patient.doctor}
                      </p>
                    </td>

                    {/* Action buttons cell */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          )}
                          aria-label={`View ${patient.name}'s details`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          )}
                          aria-label={`Message ${patient.name}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button 
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          )}
                          aria-label={`Schedule appointment for ${patient.name}`}
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              // Empty state when no patients match filter
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                  )}>
                    No patients found matching "{dashboardState.searchQuery}"
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  ), [filteredPatients, theme, dashboardState.searchQuery]);

  /**
   * Render quick actions grid
   * Provides one-click access to common workflows
   * Memoized to prevent unnecessary recalculation
   */
  const renderQuickActions = useMemo(() => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {quickActions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={cn(
            'flex flex-col items-center justify-center p-4 rounded-2xl border',
            'transition-all duration-300 hover:scale-105 hover:shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50 hover:border-gray-700/50 focus:ring-cyan-500'
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60 hover:border-gray-300 focus:ring-blue-500'
          )}
          aria-label={action.label}
        >
          <div className={cn(
            'w-12 h-12 rounded-xl mb-3',
            'flex items-center justify-center',
            action.color
          )}>
            <div className="text-white">
              {action.icon}
            </div>
          </div>
          <span className={cn(
            'text-xs font-medium text-center',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            {action.label}
          </span>
        </button>
      ))}
    </div>
  ), [quickActions, theme]);

  /**
   * =========================================================================
   * MAIN RENDER
   * =========================================================================
   */

  return (
    <div className="space-y-6">
      {/* 
        Breadcrumb Navigation
        Provides hierarchical navigation context
      */}
      <Breadcrumb
        items={BREADCRUMB_ITEMS}
        theme={theme}
        onItemClick={handleBreadcrumbClick}
        maxItems={3}
      />

      {/* 
        Main Content Section
        Wraps dashboard content with filtering and view controls
      */}
      <ContentSection
        title="Healthcare Dashboard-Overview."
        subtitle="Live Overview"
        description="Real-time analytics and insights for your healthcare practice. Monitor patient flow, satisfaction scores, and AI-powered diagnostics."
        theme={theme}
        showViewToggle={true}
        showFilters={true}
        // viewMode={dashboardState.viewMode}
        // onViewModeChange={handleViewModeChange}
        filters={
          // Filter controls section
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Range Filter */}
            <div>
              <label 
                htmlFor="time-range-filter"
                className={cn(
                  'block text-xs font-medium mb-2',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                Time Range
              </label>
              <select 
                id="time-range-filter"
                value={dashboardState.timeRange}
                onChange={handleTimeRangeChange}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'border transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                    : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                )}
              >
                {TIME_RANGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label 
                htmlFor="department-filter"
                className={cn(
                  'block text-xs font-medium mb-2',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                Department
              </label>
              <select 
                id="department-filter"
                value={dashboardState.department}
                onChange={handleDepartmentChange}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'border transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                    : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                )}
              >
                {DEPARTMENT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label 
                htmlFor="patient-search"
                className={cn(
                  'block text-xs font-medium mb-2',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                Search
              </label>
              <div className="relative">
                <Search className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                  theme === 'dark' ? "text-gray-500" : "text-gray-400"
                )} />
                <input
                  id="patient-search"
                  type="text"
                  value={dashboardState.searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search patients, conditions..."
                  className={cn(
                    "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
                    "border transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-offset-0",
                    theme === 'dark'
                      ? "bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500"
                      : "bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500"
                  )}
                />
              </div>
            </div>
          </div>
        }
      >
        {/* 
          Dashboard Content Sections
          Organized in hierarchical order of importance
        */}

        {/* Statistics Grid Section */}
        <div className="mb-8">
          {renderStatsGrid}
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <div className={cn(
            'flex items-center justify-between mb-4',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <span className="text-xs">Click to navigate</span>
          </div>
          {renderQuickActions}
        </div>

        {/* Patient Activity Table Section */}
        <div className="mb-8">
          <div className={cn(
            'flex items-center justify-between mb-4',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            <h3 className="text-lg font-semibold">Patient Activity</h3>
            <button 
              onClick={handleExportCSV}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                theme === 'dark'
                  ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 focus:ring-cyan-500'
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-500'
              )}
              aria-label="Export patient data to CSV"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          {renderPatientTable}
        </div>

        {/* 
          Charts Section
          Placeholder for future chart implementations
          TODO: Integrate charting library (e.g., Recharts, Chart.js, D3.js)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Visits Trend Chart */}
          <div className={cn(
            'p-6 rounded-2xl border',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
          )}>
            <h4 className={cn(
              'text-sm font-semibold mb-4',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Patient Visits Trend
            </h4>
            <div className={cn(
              'h-48 rounded-lg flex items-center justify-center',
              theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100/50'
            )}>
              <span className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Chart visualization placeholder
              </span>
            </div>
          </div>

          {/* Condition Distribution Chart */}
          <div className={cn(
            'p-6 rounded-2xl border',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
          )}>
            <h4 className={cn(
              'text-sm font-semibold mb-4',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Condition Distribution
            </h4>
            <div className={cn(
              'h-48 rounded-lg flex items-center justify-center',
              theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100/50'
            )}>
              <span className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Pie chart visualization placeholder
              </span>
            </div>
          </div>
        </div>
      </ContentSection>
    </div>
  );
};

// Display name for React DevTools
Dashboard.displayName = 'Dashboard';

export default Dashboard;