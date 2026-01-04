/**
 * ============================================================================
 * NAVBAR - ENHANCED WITH PORTAL SWITCHING & PROFILE MANAGEMENT
 * ============================================================================
 * 
 * Features:
 * ✅ Portal/workspace switcher for all user types
 * ✅ Profile management access
 * ✅ Context-aware display
 * ✅ Clean TypeScript with no 'any' types
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, User, ChevronDown, Shield, Settings, LogOut,
  Sparkles, Users, FileText, Calendar, TrendingUp,
  Zap, CheckCircle2,
  Search, Command, Moon, Sun,
  Heart, Activity, Workflow,
  Brain, Rocket, BarChart3, Clock,
  Building2, Briefcase, ChevronRight, Check
} from 'lucide-react';
import { cn } from '../../types/cn';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/routeConstants';
import { logout } from '../../../app/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks/useApp';
import { useToast } from '../../../app/store/contexts/toast/useToast';
import { 
  switchFacilityRole, 
  switchToPatientMode,
  getRoleDisplayName,
  type FacilityRole 
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

export const Navbar: React.FC<NavbarProps> = ({ 
  theme = 'dark',
  onThemeToggle,
  className
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isPortalSwitcherOpen, setIsPortalSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const smartSearchRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const portalSwitcherRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Redux state
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const activeContext = useAppSelector((state) => state.activeContext);

  const {
    user,
    facilityRoles,
    activeFacilityId,
    activeRoleCode,
    isPatient,
    isStaff,
    isStaffWithFacility,
    isStaffWithoutFacility,
  } = activeContext;

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    showToast(
      'info',
      "You've been logged out successfully. Thank you for using CustoCare AI — see you again soon!",
      5000
    );
    navigate(ROUTES.LANDING);
  };

  // Portal/Role switching handlers
  const handleSwitchToStaffRole = (facilityRole: FacilityRole) => {
    dispatch(
      switchFacilityRole({
        facilityId: facilityRole.facility_id,
        roleCode: facilityRole.role_code,
      })
    );
    setIsPortalSwitcherOpen(false);
    showToast('success', `Switched to ${getRoleDisplayName(facilityRole.role_code)} at ${facilityRole.facility_name}`, 3000);
  };

  const handleSwitchToPatientPortal = () => {
    dispatch(switchToPatientMode());
    setIsPortalSwitcherOpen(false);
    showToast('success', 'Switched to Patient Portal', 3000);
  };

  const handleSwitchToStaffWithoutFacility = () => {
    // Navigate to staff dashboard without facility
    navigate(ROUTES.STAFF_DASHBOARD);
    setIsPortalSwitcherOpen(false);
    showToast('success', 'Switched to Staff Portal', 3000);
  };

  // Get current context display
  const getCurrentContextDisplay = () => {
    if (activeRoleCode && activeFacilityId) {
      const currentRole = facilityRoles.find(
        r => r.facility_id === activeFacilityId && r.role_code === activeRoleCode
      );
      return {
        title: getRoleDisplayName(activeRoleCode),
        subtitle: currentRole?.facility_name || `Facility ${activeFacilityId}`,
        icon: <Briefcase className="w-4 h-4" />,
        type: 'staff' as const,
      };
    } else if (isPatient && !activeRoleCode) {
      return {
        title: 'Patient Portal',
        subtitle: 'Personal Health',
        icon: <Heart className="w-4 h-4" />,
        type: 'patient' as const,
      };
    } else if (isStaffWithoutFacility) {
      return {
        title: 'Staff Portal',
        subtitle: 'No Facility',
        icon: <User className="w-4 h-4" />,
        type: 'staff_no_facility' as const,
      };
    }
    return {
      title: 'No Context',
      subtitle: 'Select workspace',
      icon: <User className="w-4 h-4" />,
      type: 'none' as const,
    };
  };

  const currentContext = getCurrentContextDisplay();

  // Enhanced notifications
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
      color: 'green',
      description: 'Schedule management',
      shortcut: '⌘A'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: <TrendingUp className="w-4 h-4" />, 
      color: 'orange',
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
    { id: 'discharge', label: 'Discharge Patient', icon: <CheckCircle2 className="w-4 h-4" />, color: 'green' },
    { id: 'labs', label: 'Order Lab Tests', icon: <FileText className="w-4 h-4" />, color: 'purple' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredSearchResults = searchQuery 
    ? smartSearchItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : smartSearchItems.slice(0, 5);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setIsQuickActionsOpen(false);
      }
      if (smartSearchRef.current && !smartSearchRef.current.contains(event.target as Node)) {
        setIsSmartSearchOpen(false);
      }
      if (workflowRef.current && !workflowRef.current.contains(event.target as Node)) {
        setIsWorkflowOpen(false);
      }
      if (portalSwitcherRef.current && !portalSwitcherRef.current.contains(event.target as Node)) {
        setIsPortalSwitcherOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSmartSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getNotificationColor = (type: Notification['type']) => {
    const colors = {
      success: isDark ? 'text-emerald-400' : 'text-emerald-600',
      warning: isDark ? 'text-amber-400' : 'text-amber-600',
      error: isDark ? 'text-red-400' : 'text-red-600',
      info: isDark ? 'text-blue-400' : 'text-blue-600',
    };
    return colors[type];
  };

  const getNotificationBg = (type: Notification['type']) => {
    const colors = {
      success: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      warning: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      error: isDark ? 'bg-red-500/10' : 'bg-red-50',
      info: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
    };
    return colors[type];
  };

  const getDropdownPosition = () => {
    if (isMobile) {
      return 'fixed left-1/2 -translate-x-1/2 top-20';
    }
    return 'absolute right-0 mt-2';
  };

  // Show portal switcher for: staff with facility, patient, or staff without facility
  const shouldShowPortalSwitcher = isStaff || isPatient;

  return (
    <nav className={cn('flex items-center justify-between gap-2 sm:gap-4', className)}>
      {/* Left: Brand & Context */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 lg:ms-7">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          
          <div className="hidden xl:block">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-base sm:text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent',
                isDark ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'
              )}>
                CustoCare AI
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
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Portal/Role Switcher */}
        {shouldShowPortalSwitcher && (
          <div ref={portalSwitcherRef} className="relative">
            <button
              onClick={() => setIsPortalSwitcherOpen(!isPortalSwitcherOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105',
                'border',
                isDark 
                  ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              )}
              title="Switch workspace or portal"
            >
              <div className={cn(
                'p-1.5 rounded-md',
                currentContext.type === 'staff' 
                  ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
                  : currentContext.type === 'patient'
                  ? (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                  : (isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600')
              )}>
                {currentContext.icon}
              </div>
              <div className="hidden lg:block text-left">
                <p className={cn(
                  'text-xs font-semibold leading-tight',
                  isDark ? 'text-gray-200' : 'text-gray-900'
                )}>
                  {currentContext.title}
                </p>
                <p className={cn(
                  'text-xs leading-tight',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  {currentContext.subtitle}
                </p>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform',
                isPortalSwitcherOpen && 'rotate-180',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )} />
            </button>

            {isPortalSwitcherOpen && (
              <div className={cn(
                'w-80 rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
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
                    Switch Workspace
                  </h3>
                  <p className={cn(
                    'text-xs mt-1',
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  )}>
                    {user?.full_name || 'User'}
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                  {/* Staff Workspaces */}
                  {isStaffWithFacility && (
                    <>
                      <p className={cn(
                        'text-xs font-bold uppercase tracking-wide px-2 mb-2',
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        Professional Workspaces
                      </p>
                      {facilityRoles.map((role) => {
                        const isActive = activeFacilityId === role.facility_id && activeRoleCode === role.role_code;
                        return (
                          <button
                            key={`${role.facility_id}-${role.role_code}`}
                            onClick={() => handleSwitchToStaffRole(role)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                              'border',
                              isActive
                                ? (isDark 
                                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                                  : 'bg-blue-50 border-blue-200 text-blue-600')
                                : (isDark 
                                  ? 'hover:bg-gray-800 border-transparent text-gray-300' 
                                  : 'hover:bg-gray-50 border-transparent text-gray-700')
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg',
                              isActive
                                ? (isDark ? 'bg-blue-500/20' : 'bg-blue-100')
                                : (isDark ? 'bg-gray-800' : 'bg-gray-100')
                            )}>
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold truncate">
                                  {getRoleDisplayName(role.role_code)}
                                </p>
                                {role.is_primary_facility && (
                                  <span className={cn(
                                    'px-1.5 py-0.5 text-xs font-bold rounded-full',
                                    isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                                  )}>
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className={cn(
                                'text-xs truncate',
                                isDark ? 'text-gray-500' : 'text-gray-600'
                              )}>
                                {role.facility_name || `Facility ${role.facility_id}`}
                              </p>
                            </div>
                            {isActive && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Staff without facility */}
                  {isStaffWithoutFacility && (
                    <>
                      <p className={cn(
                        'text-xs font-bold uppercase tracking-wide px-2 mb-2',
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        Staff Portal
                      </p>
                      <button
                        onClick={handleSwitchToStaffWithoutFacility}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                          'border',
                          currentContext.type === 'staff_no_facility'
                            ? (isDark 
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                              : 'bg-blue-50 border-blue-200 text-blue-600')
                            : (isDark 
                              ? 'hover:bg-gray-800 border-transparent text-gray-300' 
                              : 'hover:bg-gray-50 border-transparent text-gray-700')
                        )}
                      >
                        <div className={cn(
                          'p-2 rounded-lg',
                          currentContext.type === 'staff_no_facility'
                            ? (isDark ? 'bg-blue-500/20' : 'bg-blue-100')
                            : (isDark ? 'bg-gray-800' : 'bg-gray-100')
                        )}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Staff Dashboard</p>
                          <p className={cn(
                            'text-xs',
                            isDark ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            Invitations & Profile
                          </p>
                        </div>
                        {currentContext.type === 'staff_no_facility' && (
                          <Check className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                    </>
                  )}

                  {/* Patient Portal */}
                  {isPatient && (
                    <>
                      {isStaff && (
                        <div className={cn(
                          'my-4 border-t',
                          isDark ? 'border-gray-800' : 'border-gray-200'
                        )} />
                      )}
                      <p className={cn(
                        'text-xs font-bold uppercase tracking-wide px-2 mb-2',
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        Personal Access
                      </p>
                      <button
                        onClick={handleSwitchToPatientPortal}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                          'border',
                          currentContext.type === 'patient'
                            ? (isDark 
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                              : 'bg-purple-50 border-purple-200 text-purple-600')
                            : (isDark 
                              ? 'hover:bg-gray-800 border-transparent text-gray-300' 
                              : 'hover:bg-gray-50 border-transparent text-gray-700')
                        )}
                      >
                        <div className={cn(
                          'p-2 rounded-lg',
                          currentContext.type === 'patient'
                            ? (isDark ? 'bg-purple-500/20' : 'bg-purple-100')
                            : (isDark ? 'bg-gray-800' : 'bg-gray-100')
                        )}>
                          <Heart className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Patient Portal</p>
                          <p className={cn(
                            'text-xs',
                            isDark ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            My Personal Health
                          </p>
                        </div>
                        {currentContext.type === 'patient' && (
                          <Check className="w-4 h-4 text-purple-500" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Smart Search */}
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
              'w-96 rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
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

        {/* Workflow Automation */}
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

        {/* Quick Actions */}
        <div ref={quickActionsRef} className="relative">
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
              'w-80 rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
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

        {/* Activity Indicator */}
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

        {/* Theme Toggle */}
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

        {/* Notifications */}
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold items-center justify-center shadow-lg">
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

        {/* User Profile */}
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
                {currentContext.title}
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
                      {currentContext.title}
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
                      ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-400' 
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
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
