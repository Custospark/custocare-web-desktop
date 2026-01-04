import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  HelpCircle,
  X,
  Shield,
  Activity,
  Lock,
  Bell,
  MessageSquare,
  Stethoscope,
  FlaskConical,
  CreditCard,
  Settings2,
  Hospital,
  HeartIcon,
  ClipboardCheck,
  HeartPulse,
  UserPlus,
  Ambulance,
  PillIcon,
  Calendar,
  FileText,
  Pill,
  FileSearch,
  CreditCard as BillIcon,
} from 'lucide-react';
import { type SidebarProps, type MenuItem } from '../../types/index';
import { cn } from '../../types/cn';
import { ROUTES } from '../../../app/routes/routeConstants';
import { useAppSelector } from '../../../app/store/hooks/useApp';
import { selectIsPatientMode, selectAccessibleModules } from '../../../app/store/slices/activeContextSlice';

interface EnhancedMenuItem extends MenuItem {
  premiumIcon?: React.ReactNode;
  glowColor?: string;
  stats?: string;
  shortcut?: string;
  route?: string;
  requiredModules?: string[];
}

/**
 * Context-Aware Sidebar Component
 * 
 * Features:
 * ✅ Dynamic modules based on active context (patient/staff)
 * ✅ Role-based access control
 * ✅ Patient portal specific items
 * ✅ Staff portal specific items
 * ✅ Smooth transitions and animations
 */

export const Sidebar: React.FC<SidebarProps & {
  collapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ 
  isOpen, 
  onClose, 
  collapsed,
  className,
  theme = 'dark'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Get active context from Redux
  const activeContext = useAppSelector((state) => state.activeContext);
  const isPatientMode = useAppSelector(selectIsPatientMode);
  const accessibleModules = useAppSelector(selectAccessibleModules);
  const { user } = activeContext;

  const isDark = theme === 'dark';

  // Check if user can access specific module
  const canAccess = useCallback((requiredModules?: string[]) => {
    if (!requiredModules || requiredModules.length === 0) return true;
    return requiredModules.some(module => accessibleModules.includes(module));
  }, [accessibleModules]);

  // Check if route is active
  const isRouteActive = useCallback((route: string) => {
    if (route === ROUTES.DASHBOARD) {
      return location.pathname === ROUTES.DASHBOARD;
    }
    return location.pathname.startsWith(route);
  }, [location.pathname]);

  // Patient-specific menu items
  const patientMenuItems: EnhancedMenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: ROUTES.PATIENT_DASHBOARD,
      route: ROUTES.PATIENT_DASHBOARD,
      active: isRouteActive(ROUTES.PATIENT_DASHBOARD),
      description: 'Personal health overview',
      stats: 'Health',
      shortcut: '⌘1',
      glowColor: 'from-blue-500 to-cyan-400',
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <Calendar className="w-5 h-5" />,
      href: '/patient/appointments',
      route: '/patient/appointments',
      active: isRouteActive('/patient/appointments'),
      description: 'Schedule and view appointments',
      stats: 'Scheduling',
      shortcut: '⌘2',
      glowColor: 'from-emerald-500 to-teal-400',
    },
    {
      id: 'medical-records',
      label: 'Medical Records',
      icon: <FileText className="w-5 h-5" />,
      href: '/patient/records',
      route: '/patient/records',
      active: isRouteActive('/patient/records'),
      description: 'View your health records',
      stats: 'Records',
      shortcut: '⌘3',
      glowColor: 'from-purple-500 to-pink-400',
    },
    {
      id: 'medications',
      label: 'Medications',
      icon: <Pill className="w-5 h-5" />,
      href: '/patient/medications',
      route: '/patient/medications',
      active: isRouteActive('/patient/medications'),
      description: 'Manage your prescriptions',
      stats: 'Pharmacy',
      shortcut: '⌘4',
      glowColor: 'from-orange-500 to-amber-400',
    },
    {
      id: 'test-results',
      label: 'Test Results',
      icon: <FileSearch className="w-5 h-5" />,
      href: '/patient/results',
      route: '/patient/results',
      active: isRouteActive('/patient/results'),
      description: 'View lab and test results',
      stats: 'Lab',
      shortcut: '⌘5',
      glowColor: 'from-rose-500 to-red-400',
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <BillIcon className="w-5 h-5" />,
      href: '/patient/billing',
      route: '/patient/billing',
      active: isRouteActive('/patient/billing'),
      description: 'View bills and make payments',
      stats: 'Finance',
      shortcut: '⌘6',
      glowColor: 'from-yellow-500 to-orange-400',
    },
  ], [isRouteActive]);

  // Staff-specific menu items (based on role permissions)
  const staffMenuItems: EnhancedMenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      premiumIcon: <Hospital className="w-5 h-5" />,
      href: ROUTES.DASHBOARD,
      route: ROUTES.DASHBOARD,
      active: isRouteActive(ROUTES.DASHBOARD),
      description: 'Facility-wide overview',
      stats: 'Live',
      shortcut: '⌘1',
      glowColor: 'from-blue-500 to-cyan-400',
      requiredModules: ['clinical', 'admin'],
    },
    {
      id: 'registration',
      label: 'Registration',
      icon: <UserPlus className="w-5 h-5" />,
      href: ROUTES.FRONT_DESK,
      route: ROUTES.FRONT_DESK,
      active: isRouteActive(ROUTES.FRONT_DESK),
      description: 'Patient registration & records',
      stats: 'Reception',
      glowColor: 'from-sky-500 to-blue-400',
      requiredModules: ['front_desk', 'registration'],
    },
    {
      id: 'nursing-care',
      label: 'Nursing Care',
      icon: <HeartPulse className="w-5 h-5" />,
      href: ROUTES.NURSING,
      route: ROUTES.NURSING,
      active: isRouteActive(ROUTES.NURSING),
      description: 'Vitals, triage & ward care',
      stats: 'Nursing',
      glowColor: 'from-green-500 to-emerald-400',
      requiredModules: ['clinical', 'vitals'],
    },
    {
      id: 'physician-workspace',
      label: 'Physician Workspace',
      icon: <Stethoscope className="w-5 h-5" />,
      href: ROUTES.CLINICAL_WORKSPACE,
      route: ROUTES.CLINICAL_WORKSPACE,
      active: isRouteActive(ROUTES.CLINICAL_WORKSPACE),
      description: 'Consultation, diagnosis & orders',
      stats: 'Doctors',
      glowColor: 'from-indigo-500 to-purple-400',
      requiredModules: ['clinical', 'prescriptions'],
    },
    {
      id: 'laboratory-services',
      label: 'Laboratory Services',
      icon: <FlaskConical className="w-5 h-5" />,
      href: ROUTES.LABORATORY,
      route: ROUTES.LABORATORY,
      active: isRouteActive(ROUTES.LABORATORY),
      description: 'Diagnostics & test results',
      stats: 'Lab',
      glowColor: 'from-rose-500 to-pink-400',
      requiredModules: ['lab'],
    },
    {
      id: 'pharmacy-services',
      label: 'Pharmacy Services',
      icon: <PillIcon className="w-5 h-5" />,
      href: ROUTES.PHARMACY,
      route: ROUTES.PHARMACY,
      active: isRouteActive(ROUTES.PHARMACY),
      description: 'Medication dispensing',
      stats: 'Pharmacy',
      glowColor: 'from-orange-500 to-amber-400',
      requiredModules: ['pharmacy'],
    },
    {
      id: 'billing-finance',
      label: 'Billing & Payments',
      icon: <CreditCard className="w-5 h-5" />,
      href: ROUTES.BILLING,
      route: ROUTES.BILLING,
      active: isRouteActive(ROUTES.BILLING),
      description: 'Invoices, payments & claims',
      stats: 'Finance',
      glowColor: 'from-yellow-500 to-orange-400',
      requiredModules: ['billing'],
    },
    {
      id: 'care-coordination',
      label: 'Care Coordination',
      icon: <Ambulance className="w-5 h-5" />,
      href: ROUTES.CLINICAL_SERVICES,
      route: ROUTES.CLINICAL_SERVICES,
      active: isRouteActive(ROUTES.CLINICAL_SERVICES),
      description: 'Referrals, transfers & emergency transport',
      stats: 'Referrals',
      glowColor: 'from-cyan-500 to-teal-400',
      requiredModules: ['case_management'],
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: <Settings2 className="w-5 h-5" />,
      href: ROUTES.ADMINISTRATION,
      route: ROUTES.ADMINISTRATION,
      active: isRouteActive(ROUTES.ADMINISTRATION),
      description: 'Users, roles & configuration',
      stats: 'Admin',
      glowColor: 'from-gray-600 to-gray-500',
      requiredModules: ['staff_management'],
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: <Users className="w-5 h-5" />,
      premiumIcon: <HeartIcon className="w-5 h-5" />,
      href: ROUTES.PATIENTS,
      route: ROUTES.PATIENTS,
      active: isRouteActive(ROUTES.PATIENTS),
      badge: 12,
      description: 'Patient records & care history',
      stats: 'Active',
      shortcut: '⌘2',
      glowColor: 'from-emerald-500 to-teal-400',
      requiredModules: ['clinical','admin'],
    },
    {
      id: 'encounters',
      label: 'Encounters',
      icon: <ClipboardCheck className="w-5 h-5" />,
      premiumIcon: <Activity className="w-5 h-5" />,
      href: ROUTES.ENCOUNTERS,
      route: ROUTES.ENCOUNTERS,
      active: isRouteActive(ROUTES.ENCOUNTERS),
      badge: 3,
      badgeVariant: 'urgent' as const,
      description: 'Ongoing visits & consultations',
      stats: 'In progress',
      shortcut: '⌘4',
      glowColor: 'from-amber-500 to-orange-400',
      requiredModules: ['clinical', 'encounters'],
    },
  ], [isRouteActive]);

  // System menu items (common for both)
  const systemMenuItems: EnhancedMenuItem[] = useMemo(() => [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      premiumIcon: <Settings className="w-5 h-5" />,
      href: ROUTES.SETTINGS,
      route: ROUTES.SETTINGS,
      active: isRouteActive(ROUTES.SETTINGS),
      description: 'Master configuration',
      shortcut: '⌘,',
      glowColor: 'from-gray-600 to-gray-500'
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="w-5 h-5" />,
      premiumIcon: <Lock className="w-5 h-5" />,
      href: '/security',
      route: '/security',
      active: isRouteActive('/security'),
      description: 'Advanced protection',
      badge: 'PRO',
      badgeVariant: 'pro' as const,
      shortcut: '⌘;',
      glowColor: 'from-green-600 to-emerald-500'
    },
    {
      id: 'help',
      label: 'Academy',
      icon: <HelpCircle className="w-5 h-5" />,
      premiumIcon: <MessageSquare className="w-5 h-5" />,
      href: '/help',
      route: '/help',
      active: isRouteActive('/help'),
      description: 'Expert training',
      shortcut: '⌘?',
      glowColor: 'from-violet-600 to-purple-500'
    },
  ], [isRouteActive]);

  // Get current menu items based on context
  const currentMenuItems = useMemo(() => {
    if (isPatientMode) {
      return patientMenuItems;
    }
    // Filter staff items based on accessible modules
    return staffMenuItems.filter(item => canAccess(item.requiredModules));
  }, [isPatientMode, patientMenuItems, staffMenuItems, canAccess]);

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !isOpen) return;
    
    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (diff > 50) {
      onClose?.();
    }
  }, [touchStart, isOpen, onClose]);

  // Navigation handler
  const handleNavigation = useCallback((e: React.MouseEvent, route: string) => {
    e.preventDefault();
    navigate(route);
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  }, [navigate, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const shortcuts: Record<string, string> = {
          '1': isPatientMode ? ROUTES.PATIENT_DASHBOARD : ROUTES.DASHBOARD,
          '2': isPatientMode ? '/patient/appointments' : ROUTES.PATIENTS,
          '3': isPatientMode ? '/patient/records' : ROUTES.ENCOUNTERS,
          '4': isPatientMode ? '/patient/medications' : '/reports',
          '5': isPatientMode ? '/patient/results' : '/analytics',
          '6': isPatientMode ? '/patient/billing' : '/system',
        };

        const route = shortcuts[e.key];
        if (route) {
          e.preventDefault();
          navigate(route);
        }

        if (e.key === ',') {
          e.preventDefault();
          navigate(ROUTES.SETTINGS);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, navigate, isPatientMode]);

  const renderMenuItem = (item: EnhancedMenuItem) => {
    const isActive = item.active;
    const isHovered = activeHover === item.id;
    const hasAccess = canAccess(item.requiredModules);

    if (!hasAccess) return null;

    return (
      <a
        key={item.id}
        href={item.href}
        onClick={(e) => item.route && handleNavigation(e, item.route)}
        className={cn(
          'group relative flex items-center',
          'rounded-xl transition-all duration-300 ease-out',
          'border',
          isActive
            ? cn(
                'bg-gradient-to-r shadow-lg',
                isDark 
                  ? 'from-blue-500/10 to-cyan-500/10 border-blue-500/30' 
                  : 'from-blue-50 to-cyan-50 border-blue-200'
              )
            : cn(
                'border-transparent',
                isDark ? 'hover:bg-gray-800/50 hover:border-gray-700/50' : 'hover:bg-gray-100/50 hover:border-gray-200/50'
              ),
          collapsed ? 'p-3 justify-center' : 'p-3 gap-3'
        )}
        onMouseEnter={() => setActiveHover(item.id)}
        onMouseLeave={() => setActiveHover(null)}
        title={collapsed ? `${item.label} • ${item.description}` : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && !collapsed && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full bg-gradient-to-b from-blue-400 via-cyan-400 to-blue-400 shadow-lg shadow-blue-400/50" />
        )}

        <div className={cn('relative flex-shrink-0', collapsed ? 'mx-auto' : '')}>
          <div className={cn(
            'p-2.5 rounded-xl transition-all duration-300',
            'border',
            isDark 
              ? 'bg-gray-800/50 border-gray-700/50' 
              : 'bg-gray-50 border-gray-200',
            isActive && (isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-300 bg-blue-50'),
            isHovered && 'scale-110 shadow-lg'
          )}>
            <div className={cn(
              'transition-colors duration-300',
              isActive 
                ? (isDark ? 'text-cyan-400' : 'text-blue-600')
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            )}>
              {item.premiumIcon || item.icon}
            </div>
          </div>

          {collapsed && item.badge && (
            <span className={cn(
              'absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full border-2 flex items-center justify-center',
              isDark ? 'border-gray-900' : 'border-white',
              item.badgeVariant === 'urgent'
                ? 'bg-red-500 text-white'
                : item.badgeVariant === 'pro'
                ? 'bg-purple-500 text-white'
                : 'bg-blue-500 text-white'
            )}>
              {item.badge}
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                'font-semibold text-sm truncate',
                isActive 
                  ? (isDark ? 'text-white' : 'text-gray-900')
                  : (isDark ? 'text-gray-300' : 'text-gray-700')
              )}>
                {item.label}
              </span>
              
              {item.badge && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-bold rounded-full border shrink-0',
                  item.badgeVariant === 'urgent'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : item.badgeVariant === 'pro'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                )}>
                  {item.badge}
                </span>
              )}
            </div>
            
            <p className={cn(
              'text-xs truncate leading-relaxed',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}>
              {item.description}
            </p>
            
            <div className="flex items-center justify-between pt-0.5">
              {item.stats && (
                <span className={cn(
                  'text-xs font-medium',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {item.stats}
                </span>
              )}
              {item.shortcut && (
                <kbd className={cn(
                  'px-1.5 py-0.5 text-xs rounded border font-mono',
                  isDark 
                    ? 'bg-gray-800 text-gray-400 border-gray-700' 
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                )}>
                  {item.shortcut}
                </kbd>
              )}
            </div>
          </div>
        )}
      </a>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'h-full flex flex-col',
        'backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        isDark 
          ? 'bg-gray-900/98' 
          : 'bg-white/98',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Header */}
      <div className={cn('shrink-0 p-4 border-b', isDark ? 'border-gray-800/50' : 'border-gray-200/50')}>
        <div className="flex items-center justify-between gap-3">
          {!collapsed && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className={cn('font-bold text-base truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  CustoCare AI
                </h2>
                <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {isPatientMode ? 'Patient Portal' : `${activeContext.user?.first_name || 'Staff'} - ${activeContext.activeRoleCode || 'Professional'}`}
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => onClose?.()}
            className={cn(
              'lg:hidden p-2.5 rounded-xl transition-all duration-300',
              'hover:scale-105 active:scale-95 shrink-0',
              isDark 
                ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400' 
                : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
            )}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain">
        {!collapsed && (
          <div className="mb-3">
            <p className={cn(
              'text-xs font-bold uppercase tracking-wider px-2',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}>
              {isPatientMode ? 'My Health' : 'Navigation'}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          {currentMenuItems.map((item) => renderMenuItem(item))}
        </div>

        {!collapsed && (
          <>
            <div className={cn("my-6 border-t", isDark ? 'border-gray-800/50' : 'border-gray-200/50')} />
            
            <div className="mb-3">
              <p className={cn(
                'text-xs font-bold uppercase tracking-wider px-2',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )}>
                System
              </p>
            </div>

            <div className="space-y-1.5">
              {systemMenuItems.map((item) => renderMenuItem(item))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={cn('shrink-0 p-4 border-t', isDark ? 'border-gray-800/50' : 'border-gray-200/50')}>
        {!collapsed ? (
          <div className="space-y-3">
            <div className={cn(
              'p-3 rounded-xl border',
              isDark 
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-800/30 border-gray-700/50' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg shrink-0', isDark ? 'bg-cyan-500/20' : 'bg-cyan-100')}>
                  <Bell className={cn('w-4 h-4', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                    Quick Support
                  </p>
                  <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    24/7 priority assistance
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 overflow-hidden shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white/80" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  {user?.first_name || user?.full_name || 'User'}
                </p>
                <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {isPatientMode ? 'Patient' : activeContext.activeRoleCode || 'Staff'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button className={cn(
              'w-full p-2.5 rounded-xl transition-all duration-300',
              'hover:scale-105 active:scale-95',
              isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'
            )}>
              <Bell className="w-5 h-5 mx-auto text-gray-500 dark:text-gray-400" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 mx-auto overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-white/80" />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;