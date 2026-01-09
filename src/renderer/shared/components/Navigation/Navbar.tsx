/**
 * ============================================================================
 * NAVBAR - COMPLETE REWRITE WITH ENHANCED CAPABILITY SWITCHER
 * ============================================================================
 * 
 * Features:
 * ✅ All capabilities ALWAYS visible and never hidden
 * ✅ Patient Portal & Staff Portal under Personal Space
 * ✅ Professional Workspace shows facilities and Spatie roles
 * ✅ Fully responsive design for all screen sizes
 * ✅ Maintains all original design elements and functionality
 * ✅ Proper keyboard shortcuts and animations
 * ✅ Clean, organized dropdown with no red colors
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, User, ChevronDown, Shield, Settings, LogOut,
  Sparkles, Users, FileText, Calendar, TrendingUp,
  Zap, CheckCircle2, Command,
  Search, Moon, Sun,
  Heart, Activity, Workflow,
  Brain, Rocket, BarChart3, Clock,
  Building2, Briefcase, ChevronRight, Check,
  UserCheck, Layers
} from 'lucide-react';
import { cn } from '../../types/cn';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/routeConstants';
import { logout } from '../../../app/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks/useApp';
import { useToast } from '../../../app/store/contexts/toast/useToast';
import { 
  switchCapability,
  switchFacility,
  selectCurrentCapabilityName,
  selectStaffFacilities,
  getRoleDisplayName,
} from '../../../app/store/slices/activeContextSlice';

export interface NavbarProps {
  theme?: 'light' | 'dark';
  onMenuClick?: () => void;
  onThemeToggle?: () => void;
  className?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'warning' | 'info' | 'error';
  icon: React.ReactNode;
  actionLabel?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  badge?: number;
  color: string;
  description?: string;
}

interface SmartSearch {
  id: string;
  category: string;
  title: string;
  path: string;
  icon: React.ReactNode;
}

interface ContextOption {
  id: string;
  type: 'personal' | 'professional' | 'administrative';
  capability: string;
  facilityId?: number;
  facilityName?: string;
  roleCode?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'rose' | 'amber' | 'emerald' | 'cyan' | 'indigo' | 'teal';
  isActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  theme = 'dark',
  onThemeToggle,
  className
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isContextSwitcherOpen, setIsContextSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs for dropdown management
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const smartSearchRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const contextSwitcherRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // ============================================================================
  // REDUX STATE & SELECTORS
  // ============================================================================
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Core state from activeContextSlice
  const {
    user,
    activeCapability,
    activeFacilityId,
    availableCapabilities,
  } = useAppSelector((state) => state.activeContext);

  // Derived state using selectors
  const currentCapabilityName = useAppSelector(selectCurrentCapabilityName);
  const staffFacilities = useAppSelector(selectStaffFacilities);

  // ============================================================================
  // CONTEXT OPTIONS BUILDER - ALL CAPABILITIES ALWAYS VISIBLE
  // ============================================================================
  
  /**
   * Build ALL available context options - NEVER filter or hide any option
   * Organized into Personal Space and Professional Workspace
   */
  const allContextOptions = useMemo((): ContextOption[] => {
    const options: ContextOption[] = [];

    // Get ALL capabilities the user has (from Redux state)
    const hasPatient = availableCapabilities.includes('patient');
    const hasStaff = availableCapabilities.includes('staff');
    const spatieRoles = availableCapabilities.filter(cap => 
      cap !== 'patient' && cap !== 'staff'
    );

    // ========== PERSONAL SPACE ==========
    // 1. Patient Portal
    if (hasPatient) {
      options.push({
        id: 'patient',
        type: 'personal',
        capability: 'patient',
        title: 'Patient Portal',
        subtitle: 'My Personal Health Dashboard',
        icon: <Heart className="w-4 h-4" />,
        color: 'rose',
        isActive: activeCapability === 'patient',
      });
    }

    // 2. Staff Portal (without facility assignment)
    if (hasStaff && staffFacilities.length === 0) {
      options.push({
        id: 'staff-portal',
        type: 'personal',
        capability: 'staff',
        title: 'Staff Portal',
        subtitle: 'Invitations & Profile Management',
        icon: <UserCheck className="w-4 h-4" />,
        color: 'cyan',
        isActive: activeCapability === 'staff',
      });
    }

    // ========== PROFESSIONAL WORKSPACE ==========
    // Staff with facilities (each facility is a separate option)
    if (hasStaff && staffFacilities.length > 0) {
      staffFacilities.forEach((facility) => {
        options.push({
          id: `staff-facility-${facility.facility_id}`,
          type: 'professional',
          capability: 'staff',
          facilityId: facility.facility_id,
          facilityName: facility.facility_name,
          roleCode: facility.role_code,
          title: getRoleDisplayName(facility.role_code),
          subtitle: facility.facility_name,
          icon: <Briefcase className="w-4 h-4" />,
          color: 'blue',
          isActive: activeCapability === 'staff' && activeFacilityId === facility.facility_id,
        });
      });
    }

    // ========== SYSTEM ADMINISTRATION ==========
    // Spatie Roles (super_admin, regulator, etc.)
    spatieRoles.forEach((roleCapability: string) => {
      options.push({
        id: `admin-${roleCapability}`,
        type: 'administrative',
        capability: roleCapability,
        title: getRoleDisplayName(roleCapability),
        subtitle: 'System Administration',
        icon: <Shield className="w-4 h-4" />,
        color: 'amber',
        isActive: activeCapability === roleCapability,
      });
    });

    return options;
  }, [
    availableCapabilities,
    staffFacilities,
    activeCapability,
    activeFacilityId,
  ]);

  /**
   * Group context options by workspace type for better UI organization
   */
  const groupedContextOptions = useMemo(() => {
    const groups = {
      personal: [] as ContextOption[],
      professional: [] as ContextOption[],
      administrative: [] as ContextOption[],
    };

    allContextOptions.forEach((option) => {
      groups[option.type].push(option);
    });

    return groups;
  }, [allContextOptions]);

  /**
   * Get currently active context option
   */
  const activeContextOption = useMemo(() => {
    return allContextOptions.find(opt => opt.isActive) || allContextOptions[0];
  }, [allContextOptions]);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Detect screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [
        { ref: notificationsRef, setter: setIsNotificationsOpen },
        { ref: userDropdownRef, setter: setIsUserDropdownOpen },
        { ref: quickActionsRef, setter: setIsQuickActionsOpen },
        { ref: smartSearchRef, setter: setIsSmartSearchOpen },
        { ref: workflowRef, setter: setIsWorkflowOpen },
        { ref: contextSwitcherRef, setter: setIsContextSwitcherOpen },
      ];

      refs.forEach(({ ref, setter }) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setter(false);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Smart search: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSmartSearchOpen(true);
      }
      // Context switcher: Cmd/Ctrl + J
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsContextSwitcherOpen(true);
      }
      // Close dropdowns: Escape
      if (e.key === 'Escape') {
        setIsContextSwitcherOpen(false);
        setIsSmartSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsUserDropdownOpen(false);
        setIsQuickActionsOpen(false);
        setIsWorkflowOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleLogout = () => {
    dispatch(logout());
    showToast(
      'info',
      "You've been logged out successfully. Thank you for using Custocare AI — see you again soon!",
      5000
    );
    navigate(ROUTES.LANDING);
  };

  /**
   * Handle context switch with comprehensive error handling
   */
  const handleContextSwitch = (option: ContextOption) => {
    try {
      // Close dropdown immediately for better UX
      setIsContextSwitcherOpen(false);

      // Don't switch if already active
      if (option.isActive) {
        showToast('info', `Already in ${option.title}`, 2000);
        return;
      }

      // Handle different option types
      switch (option.type) {
        case 'personal':
          // Switch to personal capability (patient or staff portal)
          dispatch(switchCapability(option.capability));
          showToast('success', `Switched to ${option.title}`, 3000);
          break;

        case 'professional':
          if (option.facilityId) {
            // Staff with facility - switch capability first if needed, then facility
            if (activeCapability !== 'staff') {
              dispatch(switchCapability('staff'));
            }
            dispatch(switchFacility(option.facilityId));
            showToast(
              'success', 
              `Switched to ${option.title} at ${option.facilityName}`, 
              3000
            );
          }
          break;

        case 'administrative':
          // Switch to Spatie role capability
          dispatch(switchCapability(option.capability));
          showToast('success', `Switched to ${option.title}`, 3000);
          break;

        default:
          console.warn('Unknown context option type:', option);
      }
    } catch (error) {
      console.error('Error switching context:', error);
      showToast('error', 'Failed to switch workspace. Please try again.', 4000);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get color classes for context badges
   */
  const getContextColors = (color: ContextOption['color']) => {
    const colorMap = {
      blue: {
        bg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
        text: isDark ? 'text-blue-400' : 'text-blue-600',
        border: isDark ? 'border-blue-500/30' : 'border-blue-200',
        hover: isDark ? 'hover:bg-blue-500/30' : 'hover:bg-blue-200',
        active: isDark ? 'bg-blue-500/30 border-blue-500' : 'bg-blue-200 border-blue-500',
      },
      purple: {
        bg: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
        text: isDark ? 'text-purple-400' : 'text-purple-600',
        border: isDark ? 'border-purple-500/30' : 'border-purple-200',
        hover: isDark ? 'hover:bg-purple-500/30' : 'hover:bg-purple-200',
        active: isDark ? 'bg-purple-500/30 border-purple-500' : 'bg-purple-200 border-purple-500',
      },
      rose: {
        bg: isDark ? 'bg-rose-500/20' : 'bg-rose-100',
        text: isDark ? 'text-rose-400' : 'text-rose-600',
        border: isDark ? 'border-rose-500/30' : 'border-rose-200',
        hover: isDark ? 'hover:bg-rose-500/30' : 'hover:bg-rose-200',
        active: isDark ? 'bg-rose-500/30 border-rose-500' : 'bg-rose-200 border-rose-500',
      },
      amber: {
        bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
        text: isDark ? 'text-amber-400' : 'text-amber-600',
        border: isDark ? 'border-amber-500/30' : 'border-amber-200',
        hover: isDark ? 'hover:bg-amber-500/30' : 'hover:bg-amber-200',
        active: isDark ? 'bg-amber-500/30 border-amber-500' : 'bg-amber-200 border-amber-500',
      },
      emerald: {
        bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
        text: isDark ? 'text-emerald-400' : 'text-emerald-600',
        border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
        hover: isDark ? 'hover:bg-emerald-500/30' : 'hover:bg-emerald-200',
        active: isDark ? 'bg-emerald-500/30 border-emerald-500' : 'bg-emerald-200 border-emerald-500',
      },
      cyan: {
        bg: isDark ? 'bg-cyan-500/20' : 'bg-cyan-100',
        text: isDark ? 'text-cyan-400' : 'text-cyan-600',
        border: isDark ? 'border-cyan-500/30' : 'border-cyan-200',
        hover: isDark ? 'hover:bg-cyan-500/30' : 'hover:bg-cyan-200',
        active: isDark ? 'bg-cyan-500/30 border-cyan-500' : 'bg-cyan-200 border-cyan-500',
      },
      indigo: {
        bg: isDark ? 'bg-indigo-500/20' : 'bg-indigo-100',
        text: isDark ? 'text-indigo-400' : 'text-indigo-600',
        border: isDark ? 'border-indigo-500/30' : 'border-indigo-200',
        hover: isDark ? 'hover:bg-indigo-500/30' : 'hover:bg-indigo-200',
        active: isDark ? 'bg-indigo-500/30 border-indigo-500' : 'bg-indigo-200 border-indigo-500',
      },
      teal: {
        bg: isDark ? 'bg-teal-500/20' : 'bg-teal-100',
        text: isDark ? 'text-teal-400' : 'text-teal-600',
        border: isDark ? 'border-teal-500/30' : 'border-teal-200',
        hover: isDark ? 'hover:bg-teal-500/30' : 'hover:bg-teal-200',
        active: isDark ? 'bg-teal-500/30 border-teal-500' : 'bg-teal-200 border-teal-500',
      },
    };
    return colorMap[color];
  };

  const getNotificationColor = (type: Notification['type']) => {
    const colors = {
      success: isDark ? 'text-emerald-400' : 'text-emerald-600',
      warning: isDark ? 'text-amber-400' : 'text-amber-600',
      error: isDark ? 'text-orange-400' : 'text-orange-600',
      info: isDark ? 'text-blue-400' : 'text-blue-600',
    };
    return colors[type];
  };

  const getNotificationBg = (type: Notification['type']) => {
    const colors = {
      success: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      warning: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      error: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      info: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
    };
    return colors[type];
  };

  const getDropdownPosition = () => {
    if (isMobile) {
      return 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-md';
    }
    return 'absolute right-0 mt-2 w-96';
  };

  // ============================================================================
  // MOCK DATA
  // ============================================================================

  const notifications: Notification[] = [
    { 
      id: 1, 
      title: 'New Patient Admission', 
      message: 'Sarah Johnson admitted to Ward 3B - Requires immediate attention',
      time: '2 min ago', 
      read: false, 
      type: 'info',
      icon: <Users className="w-4 h-4" />,
      actionLabel: 'View Details'
    },
    { 
      id: 2, 
      title: 'Lab Results Ready', 
      message: 'Complete blood count results available for review',
      time: '15 min ago', 
      read: false, 
      type: 'success',
      icon: <CheckCircle2 className="w-4 h-4" />,
      actionLabel: 'Review Now'
    },
    { 
      id: 3, 
      title: 'Critical: Surgery Scheduled', 
      message: 'Emergency surgery at 2:00 PM - OR 3 prepared',
      time: '1 hour ago', 
      read: false, 
      type: 'warning',
      icon: <Clock className="w-4 h-4" />,
      actionLabel: 'Confirm'
    },
  ];

  const quickActions: QuickAction[] = [
    { 
      id: 'patients', 
      label: 'Patients', 
      icon: <Users className="w-4 h-4" />, 
      badge: 12, 
      color: 'blue',
      description: 'Manage patient records',
      shortcut: '⌘P'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: <FileText className="w-4 h-4" />, 
      badge: 5, 
      color: 'purple',
      description: 'Generate & view reports',
      shortcut: '⌘R'
    },
    { 
      id: 'appointments', 
      label: 'Appointments', 
      icon: <Calendar className="w-4 h-4" />, 
      badge: 8, 
      color: 'emerald',
      description: 'Schedule management',
      shortcut: '⌘A'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: <TrendingUp className="w-4 h-4" />, 
      color: 'amber',
      description: 'View insights & trends',
      shortcut: '⌘L'
    },
  ];

  const smartSearchItems: SmartSearch[] = [
    { id: '1', category: 'Patients', title: 'Sarah Johnson - Ward 3B', path: '/patients/101', icon: <Users className="w-4 h-4" /> },
    { id: '2', category: 'Reports', title: 'Monthly Analytics Report', path: '/reports/monthly', icon: <BarChart3 className="w-4 h-4" /> },
    { id: '3', category: 'Appointments', title: 'Surgery Schedule - Dr. Martinez', path: '/appointments/surgery', icon: <Calendar className="w-4 h-4" /> },
  ];

  const workflows = [
    { id: 'admit', label: 'Admit Patient', icon: <Users className="w-4 h-4" />, color: 'blue' },
    { id: 'discharge', label: 'Discharge Patient', icon: <CheckCircle2 className="w-4 h-4" />, color: 'emerald' },
    { id: 'labs', label: 'Order Lab Tests', icon: <FileText className="w-4 h-4" />, color: 'purple' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredSearchResults = searchQuery 
    ? smartSearchItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : smartSearchItems.slice(0, 5);

  // Always show context switcher (even with single capability)
  const shouldShowContextSwitcher = allContextOptions.length > 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <nav className={cn('flex items-center justify-between gap-2 sm:gap-4 px-4 py-3', className)}>
      {/* ========================================================================
          LEFT: BRAND & MENU (MOBILE)
          ======================================================================== */}
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-base sm:text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent',
                isDark ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'
              )}>
                Custocare AI
              </span>
              <span className={cn(
                'px-2 py-0.5 text-xs font-bold rounded-full border',
                isDark 
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                  : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 border-blue-300'
              )}>
                <Sparkles className="w-3 h-3 inline mr-1" />
                Pro
              </span>
            </div>
            <p className={cn(
              'text-xs mt-0.5',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}>
              AI Powered Health Management System
            </p>
          </div>
        </div>

      {/* ========================================================================
          RIGHT: ACTION BUTTONS
          ======================================================================== */}
      <div className="flex items-center gap-3 sm:gap-">
        
        {/* ====================================================================
            🎯 ENHANCED CONTEXT/WORKSPACE SWITCHER
            ==================================================================== */}
        {shouldShowContextSwitcher && activeContextOption && (
          <div ref={contextSwitcherRef} className="relative">
            <button
              onClick={() => setIsContextSwitcherOpen(!isContextSwitcherOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105',
                'border shadow-sm',
                isDark 
                  ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              )}
              title="Switch workspace (⌘J)"
              aria-label="Switch workspace"
              aria-expanded={isContextSwitcherOpen}
            >
              <div className={cn(
                'p-1.5 rounded-md transition-colors',
                getContextColors(activeContextOption.color).bg
              )}>
                <div className={getContextColors(activeContextOption.color).text}>
                  {activeContextOption.icon}
                </div>
              </div>
              <div className="hidden lg:block text-left">
                <p className={cn(
                  'text-xs font-semibold leading-tight',
                  isDark ? 'text-gray-200' : 'text-gray-900'
                )}>
                  {activeContextOption.title}
                </p>
                <p className={cn(
                  'text-xs leading-tight',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  {activeContextOption.subtitle}
                </p>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform',
                isContextSwitcherOpen && 'rotate-180',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )} />
            </button>

            {isContextSwitcherOpen && (
              <div className={cn(
                'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
                getDropdownPosition(),
                isDark 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              )}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                  <h3 className={cn(
                    'font-semibold flex items-center gap-2',
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  )}>
                    <Layers className="w-4 h-4 text-blue-500" />
                    Switch Workspace
                  </h3>
                  <p className={cn(
                    'text-xs mt-1',
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  )}>
                    {user?.full_name || 'User'} • All workspaces
                  </p>
                  <div className={cn(
                    'mt-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md',
                    isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                  )}>
                    <Command className="w-3 h-3" />
                    <kbd className="font-mono">⌘J</kbd>
                    <span>to open</span>
                  </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-3 space-y-2">
                  
                  {/* ====== PERSONAL SPACE ====== */}
                  {groupedContextOptions.personal.length > 0 && (
                    <>
                      <p className={cn(
                        'text-xs font-bold uppercase tracking-wide px-2 mb-2 mt-2',
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        <Heart className="w-3 h-3 inline mr-1" />
                        Personal Space
                      </p>
                      {groupedContextOptions.personal.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleContextSwitch(option)}
                          disabled={option.isActive}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                            'border',
                            option.isActive
                              ? getContextColors(option.color).active
                              : cn(
                                  getContextColors(option.color).hover,
                                  'border-transparent',
                                  isDark ? 'text-gray-300' : 'text-gray-700'
                                ),
                            !option.isActive && 'hover:scale-[1.02] cursor-pointer',
                            option.isActive && 'cursor-default'
                          )}
                          aria-label={`Switch to ${option.title}`}
                          aria-current={option.isActive ? 'true' : 'false'}
                        >
                          <div className={cn(
                            'p-2 rounded-lg',
                            option.isActive
                              ? getContextColors(option.color).bg
                              : (isDark ? 'bg-gray-800' : 'bg-gray-100')
                          )}>
                            <div className={option.isActive ? getContextColors(option.color).text : ''}>
                              {option.icon}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{option.title}</p>
                            <p className={cn(
                              'text-xs',
                              isDark ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              {option.subtitle}
                            </p>
                          </div>
                          {option.isActive && (
                            <Check className={cn('w-4 h-4', getContextColors(option.color).text)} />
                          )}
                        </button>
                      ))}
                    </>
                  )}

                  {/* ====== PROFESSIONAL WORKSPACE ====== */}
                  {groupedContextOptions.professional.length > 0 && (
                    <>
                      <p className={cn(
                        'text-xs font-bold uppercase tracking-wide px-2 mb-2 mt-4',
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        <Briefcase className="w-3 h-3 inline mr-1" />
                        Professional Workspace
                      </p>
                      {groupedContextOptions.professional.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleContextSwitch(option)}
                          disabled={option.isActive}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                            'border',
                            option.isActive
                              ? getContextColors(option.color).active
                              : cn(
                                  getContextColors(option.color).hover,
                                  'border-transparent',
                                  isDark ? 'text-gray-300' : 'text-gray-700'
                                ),
                            !option.isActive && 'hover:scale-[1.02] cursor-pointer',
                            option.isActive && 'cursor-default'
                          )}
                          aria-label={`Switch to ${option.title}`}
                          aria-current={option.isActive ? 'true' : 'false'}
                        >
                          <div className={cn(
                            'p-2 rounded-lg',
                            option.isActive
                              ? getContextColors(option.color).bg
                              : (isDark ? 'bg-gray-800' : 'bg-gray-100')
                          )}>
                            <div className={option.isActive ? getContextColors(option.color).text : ''}>
                              {option.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {option.title}
                            </p>
                            <p className={cn(
                              'text-xs truncate',
                              isDark ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              {option.subtitle}
                            </p>
                          </div>
                          {option.isActive && (
                            <Check className={cn('w-4 h-4', getContextColors(option.color).text)} />
                          )}
                        </button>
                      ))}
                    </>
                  )}

                  {/* ====== SYSTEM ADMINISTRATION ====== */}
                  {groupedContextOptions.administrative.length > 0 && (
                    <>
                      <p className={cn(
                        'text-xs font-bold uppercase tracking-wide px-2 mb-2 mt-4',
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        <Shield className="w-3 h-3 inline mr-1" />
                        System Administration
                      </p>
                      {groupedContextOptions.administrative.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleContextSwitch(option)}
                          disabled={option.isActive}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                            'border',
                            option.isActive
                              ? getContextColors(option.color).active
                              : cn(
                                  getContextColors(option.color).hover,
                                  'border-transparent',
                                  isDark ? 'text-gray-300' : 'text-gray-700'
                                ),
                            !option.isActive && 'hover:scale-[1.02] cursor-pointer',
                            option.isActive && 'cursor-default'
                          )}
                          aria-label={`Switch to ${option.title}`}
                          aria-current={option.isActive ? 'true' : 'false'}
                        >
                          <div className={cn(
                            'p-2 rounded-lg',
                            option.isActive
                              ? getContextColors(option.color).bg
                              : (isDark ? 'bg-gray-800' : 'bg-gray-100')
                          )}>
                            <div className={option.isActive ? getContextColors(option.color).text : ''}>
                              {option.icon}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              {option.title}
                            </p>
                            <p className={cn(
                              'text-xs',
                              isDark ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              {option.subtitle}
                            </p>
                          </div>
                          {option.isActive && (
                            <Check className={cn('w-4 h-4', getContextColors(option.color).text)} />
                          )}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Helper text */}
                  <div className={cn(
                    'mt-4 p-3 rounded-lg border',
                    isDark 
                      ? 'bg-blue-500/5 border-blue-500/20' 
                      : 'bg-blue-50 border-blue-200'
                  )}>
                    <p className={cn(
                      'text-xs flex items-center gap-1',
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    )}>
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span>
                        All {allContextOptions.length} workspace{allContextOptions.length !== 1 ? 's' : ''} available. 
                        Switch anytime!
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            SMART SEARCH
            ==================================================================== */}
        <div ref={smartSearchRef} className="relative">
          <button
            onClick={() => setIsSmartSearchOpen(!isSmartSearchOpen)}
            className={cn(
              'p-2 rounded-lg transition-all duration-300 hover:scale-105 relative',
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}
            title="Smart search (⌘K)"
          >
            <Search className={cn(
              'w-5 h-5 transition-colors',
              isSmartSearchOpen 
                ? (isDark ? 'text-cyan-400' : 'text-blue-500') 
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            )} />
          </button>

          {isSmartSearchOpen && (
            <div className={cn(
              'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
              getDropdownPosition(),
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            )}>
              <div className="p-3 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="relative">
                  <Search className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  )} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients, reports, settings..."
                    className={cn(
                      'w-full pl-10 pr-4 py-2 rounded-lg text-sm border transition-all',
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    )}
                    autoFocus
                  />
                  <div className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border',
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-500' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  )}>
                    <Command className="w-3 h-3" />K
                  </div>
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto p-2">
                {filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:scale-[1.02]',
                        isDark 
                          ? 'hover:bg-gray-800 text-gray-300' 
                          : 'hover:bg-gray-50 text-gray-700'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg',
                        isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                      )}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-xs font-medium mb-0.5',
                          isDark ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          {item.category}
                        </p>
                        <p className={cn(
                          'text-sm font-medium truncate',
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        )}>
                          {item.title}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Brain className={cn(
                      'w-12 h-12 mx-auto mb-3',
                      isDark ? 'text-gray-700' : 'text-gray-300'
                    )} />
                    <p className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      No results found
                    </p>
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-gray-200/50 dark:border-gray-800/50">
                <div className={cn(
                  'text-xs px-3 py-2 rounded-lg flex items-center gap-2',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  <Sparkles className="w-3 h-3" />
                  <span>AI-powered search suggestions</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            WORKFLOW AUTOMATION
            ==================================================================== */}
        <div ref={workflowRef} className="relative hidden lg:block">
          <button
            onClick={() => setIsWorkflowOpen(!isWorkflowOpen)}
            className={cn(
              'p-2 rounded-lg transition-all duration-300 hover:scale-105',
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}
            title="Workflow automation"
          >
            <Workflow className={cn(
              'w-5 h-5 transition-colors',
              isWorkflowOpen 
                ? (isDark ? 'text-cyan-400' : 'text-blue-500') 
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            )} />
          </button>

          {isWorkflowOpen && (
            <div className={cn(
              'w-72 rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
              getDropdownPosition(),
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            )}>
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <h3 className={cn(
                  'font-semibold flex items-center gap-2',
                  isDark ? 'text-gray-200' : 'text-gray-900'
                )}>
                  <Workflow className="w-4 h-4 text-purple-500" />
                  Quick Workflows
                </h3>
                <p className={cn(
                  'text-xs mt-1',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  Automate common tasks
                </p>
              </div>
              
              <div className="p-3 space-y-2">
                {workflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:scale-[1.02]',
                      isDark 
                        ? 'hover:bg-gray-800 border border-gray-800' 
                        : 'hover:bg-gray-50 border border-gray-200'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      `bg-${workflow.color}-500/10`
                    )}>
                      {workflow.icon}
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {workflow.label}
                    </span>
                    <Rocket className="w-4 h-4 ml-auto text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            QUICK ACTIONS
            ==================================================================== */}
        <div ref={quickActionsRef} className="relative hidden lg:block">
          <button
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className={cn(
              'p-2 rounded-lg transition-all duration-300 hover:scale-105 relative',
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}
            title="Quick actions"
          >
            <Zap className={cn(
              'w-5 h-5 transition-colors',
              isQuickActionsOpen 
                ? (isDark ? 'text-cyan-400' : 'text-blue-500') 
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            )} />
          </button>

          {isQuickActionsOpen && (
            <div className={cn(
              'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
              getDropdownPosition(),
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            )}>
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <h3 className={cn(
                  'font-semibold flex items-center gap-2',
                  isDark ? 'text-gray-200' : 'text-gray-900'
                )}>
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Actions
                </h3>
                <p className={cn(
                  'text-xs mt-1',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  Access your most used features
                </p>
              </div>
              
              <div className="p-3 grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    className={cn(
                      'relative p-3 rounded-lg text-left transition-all duration-200 hover:scale-105 active:scale-95 group',
                      isDark 
                        ? 'hover:bg-gray-800 border border-gray-800' 
                        : 'hover:bg-gray-50 border border-gray-200'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        'p-1.5 rounded-lg',
                        `bg-${action.color}-500/10`
                      )}>
                        {action.icon}
                      </div>
                      {action.badge && (
                        <span className={cn(
                          'text-xs font-bold px-1.5 py-0.5 rounded-full',
                          isDark 
                            ? 'bg-cyan-500/20 text-cyan-300' 
                            : 'bg-blue-100 text-blue-700'
                        )}>
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      'text-sm font-medium mb-1',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {action.label}
                    </p>
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-gray-600' : 'text-gray-500'
                    )}>
                      {action.description}
                    </p>
                    {action.shortcut && (
                      <div className={cn(
                        'mt-2 text-xs px-1.5 py-0.5 rounded border inline-block',
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-500' 
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      )}>
                        {action.shortcut}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            ACTIVITY INDICATOR
            ==================================================================== */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className={cn(
            'text-xs font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Active
          </span>
        </div>

        {/* ====================================================================
            THEME TOGGLE
            ==================================================================== */}
        <button
          onClick={onThemeToggle}
          className={cn(
            'p-2 rounded-lg transition-all duration-300 hover:scale-105 hidden sm:block',
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          )}
          title="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
        </button>

        {/* ====================================================================
            NOTIFICATIONS
            ==================================================================== */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              'p-2 rounded-lg transition-all duration-300 hover:scale-105 relative',
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}
            title="Notifications"
          >
            <Bell className={cn(
              'w-5 h-5 transition-colors',
              isNotificationsOpen 
                ? (isDark ? 'text-cyan-400' : 'text-blue-500') 
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            )} />
            
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold items-center justify-center shadow-lg">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className={cn(
              'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
              isMobile 
                ? 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-sm' 
                : 'absolute right-0 mt-2 w-96',
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            )}>
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    'font-semibold flex items-center gap-2',
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  )}>
                    <Bell className="w-4 h-4" />
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2.5 py-1 text-xs font-bold rounded-full',
                        isDark 
                          ? 'bg-cyan-500/20 text-cyan-300' 
                          : 'bg-blue-100 text-blue-700'
                      )}>
                        {unreadCount} new
                      </span>
                      <button className={cn(
                        'text-xs font-medium transition-colors',
                        isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                      )}>
                        Mark all read
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 border-b last:border-0 transition-all duration-200 cursor-pointer',
                      isDark 
                        ? 'hover:bg-gray-800 border-gray-800' 
                        : 'hover:bg-gray-50 border-gray-100',
                      !notification.read && (isDark ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : 'bg-blue-50/50 border-l-2 border-l-blue-500')
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg flex-shrink-0',
                        getNotificationBg(notification.type)
                      )}>
                        <div className={getNotificationColor(notification.type)}>
                          {notification.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={cn(
                            'font-medium text-sm',
                            isDark ? 'text-gray-200' : 'text-gray-900'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0 mt-1',
                              isDark ? 'bg-cyan-500' : 'bg-blue-500'
                            )} />
                          )}
                        </div>
                        <p className={cn(
                          'text-xs mb-2 line-clamp-2',
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className={cn(
                              'text-xs',
                              isDark ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              {notification.time}
                            </span>
                          </div>
                          {notification.actionLabel && (
                            <button className={cn(
                              'text-xs font-medium px-2.5 py-1 rounded-md transition-colors',
                              isDark 
                                ? 'text-cyan-400 hover:bg-cyan-500/10' 
                                : 'text-blue-600 hover:bg-blue-50'
                            )}>
                              {notification.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-gray-200/50 dark:border-gray-800/50">
                <button className={cn(
                  'w-full py-2 text-sm font-medium rounded-lg transition-colors',
                  isDark 
                    ? 'text-cyan-400 hover:bg-gray-800' 
                    : 'text-blue-600 hover:bg-gray-50'
                )}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            USER PROFILE
            ==================================================================== */}
        <div ref={userDropdownRef} className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className={cn(
              'flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 pr-1 sm:pr-1.5 py-1 sm:py-1.5 rounded-xl transition-all duration-300 hover:scale-105',
              isDark 
                ? 'hover:bg-gray-800' 
                : 'hover:bg-gray-100'
            )}
          >
            <div className="text-right hidden lg:block">
              <p className={cn(
                'text-sm font-semibold',
                isDark ? 'text-gray-200' : 'text-gray-900'
              )}>
                {user?.full_name || 'User'}
              </p>
              <p className={cn(
                'text-xs',
                isDark ? 'text-gray-500' : 'text-gray-600'
              )}>
                {currentCapabilityName}
              </p>
            </div>
            
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center ring-2 ring-blue-500/20">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform duration-200 hidden sm:block',
              isUserDropdownOpen && 'rotate-180'
            )} />
          </button>

          {isUserDropdownOpen && (
            <div className={cn(
              'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
              isMobile 
                ? 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-xs' 
                : 'absolute right-0 mt-2 w-72',
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            )}>
              {/* Profile Header */}
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center ring-4 ring-blue-500/10">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      'font-bold',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      {user?.full_name || 'User'}
                    </p>
                    <p className={cn(
                      'text-sm',
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      {currentCapabilityName}
                    </p>
                    <p className={cn(
                      'text-xs mt-0.5',
                      isDark ? 'text-gray-600' : 'text-gray-500'
                    )}>
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {[
                  { icon: User, label: 'My Profile', shortcut: '⌘P', route: '/staff/profile' },
                  { icon: Settings, label: 'Settings', shortcut: '⌘,', route: ROUTES.SETTINGS },
                  { icon: Building2, label: 'Workspaces', route: '/workspaces' },
                  { icon: Activity, label: 'Activity Log', route: '/activity' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.route);
                      setIsUserDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group',
                      isDark 
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.shortcut && (
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded border',
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-500' 
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      )}>
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sign Out */}
              <div className="p-2 border-t border-gray-200/50 dark:border-gray-800/50">
                <button 
                  onClick={handleLogout}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isDark 
                      ? 'text-gray-400 hover:bg-orange-500/10 hover:text-orange-400' 
                      : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);