import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Settings, HelpCircle,
  X, Shield, Activity,  Lock,
  Bell, MessageSquare,Stethoscope,
  FlaskConical,
  CreditCard,
  Settings2,
  Hospital,
  HeartIcon,
  ClipboardCheck,
  HeartPulse,
  Building2,
  UserPlus,
  Ambulance,
  PillIcon,
} from 'lucide-react';
import { type SidebarProps, type MenuItem } from '../../types/index';
import { cn } from '../../types/cn';
import { ROUTES } from '../../routes/routeConstants';

interface EnhancedMenuItem extends MenuItem {
  premiumIcon?: React.ReactNode;
  glowColor?: string;
  stats?: string;
  shortcut?: string;
  route?: string;
}

/**
 * Enterprise-Grade Sidebar Component
 * 
 * Key Features:
 * 1. React Router integration for seamless navigation
 * 2. Active route detection and highlighting
 * 3. Mobile-first with proper z-index layering
 * 4. Smooth touch gestures
 * 5. Spatial hierarchy and visual feedback
 * 6. Accessible keyboard navigation
 * 7. No app reinitialization on navigation
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

  const isDark = theme === 'dark';

  // Touch gesture handling for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !isOpen) return;
    
    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Swipe left to close
    if (diff > 50) {
      onClose?.();
    }
  }, [touchStart, isOpen, onClose]);

  // Navigation handler - prevents default link behavior and uses React Router
  const handleNavigation = useCallback((e: React.MouseEvent, route: string) => {
    e.preventDefault();
    navigate(route);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  }, [navigate, onClose]);

  // Check if route is active
  const isRouteActive = useCallback((route: string) => {
    if (route === ROUTES.DASHBOARD) {
      return location.pathname === ROUTES.DASHBOARD;
    }
    return location.pathname.startsWith(route);
  }, [location.pathname]);

  // Enhanced menu items with routes
const menuItems: EnhancedMenuItem[] = [
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
  },

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
  },

  {
    id: 'facilities',
    label: 'Facilities',
    icon: <Building2 className="w-5 h-5" />,
    href: ROUTES.FACILITIES,
    route: ROUTES.FACILITIES,
    active: isRouteActive(ROUTES.FACILITIES),
    badge: 'NEW',
    description: 'Clinics, departments & units',
    stats: 'Facilities',
    shortcut: '⌘3',
    glowColor: 'from-yellow-500 to-orange-400',
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
  },
];



  const secondaryMenuItems: EnhancedMenuItem[] = [
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
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close sidebar on Escape
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }

      // Navigation shortcuts (Cmd/Ctrl + number)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const shortcuts: Record<string, string> = {
          '1': ROUTES.DASHBOARD,
          '2': ROUTES.PATIENTS,
          '3': '/encounters',
          '4': '/reports',
          '5': '/analytics',
          '6': '/system',
        };

        const route = shortcuts[e.key];
        if (route) {
          e.preventDefault();
          navigate(route);
        }

        // Settings shortcut (Cmd/Ctrl + ,)
        if (e.key === ',') {
          e.preventDefault();
          navigate(ROUTES.SETTINGS);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, navigate]);

  const renderMenuItem = (item: EnhancedMenuItem) => {
    const isActive = item.active;
    const isHovered = activeHover === item.id;

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
        {/* Active indicator */}
        {isActive && !collapsed && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full bg-gradient-to-b from-blue-400 via-cyan-400 to-blue-400 shadow-lg shadow-blue-400/50" />
        )}

        {/* Icon */}
        <div className={cn(
          'relative flex-shrink-0',
          collapsed ? 'mx-auto' : ''
        )}>
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

          {/* Badge on icon for collapsed state */}
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

        {/* Text content - hidden when collapsed */}
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
        // Theme
        isDark 
          ? 'bg-gray-900/98' 
          : 'bg-white/98',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Header - Enhanced for mobile */}
      <div className={cn(
        'shrink-0 p-4 border-b',
        isDark ? 'border-gray-800/50' : 'border-gray-200/50'
      )}>
        <div className="flex items-center justify-between gap-3">
          {!collapsed && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className={cn(
                  'font-bold text-base truncate',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  CustoCare AI
                </h2>
                <p className={cn(
                  'text-xs truncate',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Healthcare Pro
                </p>
              </div>
            </div>
          )}
          
          {/* Close button - Always visible on mobile, prominent */}
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

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain">
        {!collapsed && (
          <div className="mb-3">
            <p className={cn(
              'text-xs font-bold uppercase tracking-wider px-2',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}>
              Navigation
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          {menuItems.map((item) => renderMenuItem(item))}
        </div>

        {!collapsed && (
          <>
            <div className={cn(
              "my-6 border-t",
              isDark ? 'border-gray-800/50' : 'border-gray-200/50'
            )} />
            
            <div className="mb-3">
              <p className={cn(
                'text-xs font-bold uppercase tracking-wider px-2',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )}>
                System
              </p>
            </div>

            <div className="space-y-1.5">
              {secondaryMenuItems.map((item) => renderMenuItem(item))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={cn(
        'shrink-0 p-4 border-t',
        isDark ? 'border-gray-800/50' : 'border-gray-200/50'
      )}>
        {!collapsed ? (
          <div className="space-y-3">
            {/* Quick Support Card */}
            <div className={cn(
              'p-3 rounded-xl border',
              isDark 
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-800/30 border-gray-700/50' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg shrink-0',
                  isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'
                )}>
                  <Bell className={cn(
                    'w-4 h-4',
                    isDark ? 'text-cyan-400' : 'text-cyan-600'
                  )} />
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-semibold truncate',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}>
                    Quick Support
                  </p>
                  <p className={cn(
                    'text-xs truncate',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    24/7 priority assistance
                  </p>
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 overflow-hidden shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white/80" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-semibold truncate',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  Dr. Steve Okello
                </p>
                <p className={cn(
                  'text-xs truncate',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Chief Physician
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