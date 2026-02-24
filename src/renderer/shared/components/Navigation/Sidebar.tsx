import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Bell,
  Stethoscope,
  HeartPulse,
  PillIcon,
  FileText,
  UserCog,
  Briefcase,
  MicroscopeIcon,
  MonitorCheckIcon,
  HeadphonesIcon,
  X,
} from 'lucide-react';
import { type SidebarProps } from '../../types/index';
import { cn } from '../../types/cn';
import { ROUTES } from '../../../app/routes/routeConstants';
import { useAppSelector } from '../../../app/store/hooks/useApp';
import { 
  selectAccessibleModuleCodes,
  selectCurrentCapabilityName,
  selectActiveFacilityName,
  selectActiveRoleCode,
} from '../../../app/store/slices/activeContextSlice';
import { FaRegCreditCard } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { getPatientUuid, getStaffUuid, isInPatientMode, isInStaffMode } from '../../../app/store/utils/contextSelectors';
import { getRoleDisplayName as formatName } from '../../utils/facilityRoleFormator';
import LogoImage from '../../assets/LogoImage';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  route: string;
  description: string;
  stats?: string;
  shortcut?: string;
  glowColor?: string;
  badge?: string | number;
  badgeVariant?: 'urgent' | 'pro' | 'default';
  moduleCode: string;
  category?: 'clinical' | 'admin' | 'patient' | 'system' | 'finance';
}

interface SidebarExtendedProps extends SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarExtendedProps> = ({ 
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
  const navContainerRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  // Get active context from Redux
  const activeContext = useAppSelector((state) => state.activeContext);
  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const currentCapabilityName = useAppSelector(selectCurrentCapabilityName);
  const activeFacilityName = useAppSelector(selectActiveFacilityName);
  const activeRoleCode = useAppSelector(selectActiveRoleCode);

  // Get Patient Numbers and Staff Numbers
  const staffNumber = useSelector(getStaffUuid);
  const patientNumber = useSelector(getPatientUuid);

  // Get staff and Patient Modes
  const inPatientMode = useSelector(isInPatientMode);
  const inStaffMode = useSelector(isInStaffMode);

  const { user } = activeContext;
  const isDark = theme === 'dark';

  // Master menu configuration - maps backend module codes to sidebar items
  const menuConfig: MenuItem[] = useMemo(() => [
    // Dashboard Modules
    {
      id: 'patient-dashboard',
      label: 'My Health',
      icon: <HeartPulse className="w-5 h-5" />,
      href: ROUTES.PATIENT_DASHBOARD,
      route: ROUTES.PATIENT_DASHBOARD,
      description: 'Personal health overview',
      stats: 'Health',
      shortcut: '⌘1',
      glowColor: 'from-emerald-500 to-teal-400',
      moduleCode: 'patient_dashboard',
      category: 'patient',
    },
    {
      id: 'staff-dashboard',
      label: 'Staff Portal',
      icon: <Briefcase className="w-5 h-5" />,
      href: ROUTES.STAFF_DASHBOARD,
      route: ROUTES.STAFF_DASHBOARD,
      description: 'Staff workspace',
      stats: 'Portal',
      shortcut: '⌘1',
      glowColor: 'from-purple-500 to-pink-400',
      moduleCode: 'staff_dashboard',
      category: 'admin',
    },

    // Clinical Modules
    {
      id: 'Front Desk',
      label: 'Front Desk',
      icon: <FileText className="w-5 h-5" />,
      href: ROUTES.MEDICAL_RECORDS,
      route: ROUTES.MEDICAL_RECORDS,
      description: 'Medical Records.',
      stats: 'Records',
      glowColor: 'from-purple-500 to-pink-400',
      moduleCode: 'medical_records',
      category: 'clinical',
    },
    {
      id: 'nursing-care',
      label: 'Nursing Care',
      icon: <HeartPulse className="w-5 h-5" />,
      href: ROUTES.NURSING,
      route: ROUTES.NURSING,
      description: 'Vitals & ward care',
      stats: 'Nursing',
      glowColor: 'from-green-500 to-emerald-400',
      moduleCode: 'nursing',
      category: 'clinical',
    },
    {
      id: 'clinical',
      label: 'Clinical Workspace',
      icon: <Stethoscope className="w-5 h-5" />,
      href: ROUTES.CLINICAL,
      route: ROUTES.CLINICAL,
      description: 'Doctor Consultation & diagnosis',
      stats: 'Clinical',
      glowColor: 'from-indigo-500 to-purple-400',
      moduleCode: 'clinical',
      category: 'clinical',
    }, 
    {
      id: 'laboatory',
      label: 'Laboaratory',
      icon: <MicroscopeIcon className="w-5 h-5" />,
      href: ROUTES.LABORATORY,
      route: ROUTES.LABORATORY,
      description: 'Lab tests, results & specimens.',
      stats: 'Lab',
      glowColor: 'from-rose-500 to-pink-400',
      moduleCode: 'laboratory',
      category: 'clinical',
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      icon: <PillIcon className="w-5 h-5" />,
      href: ROUTES.PHARMACY,
      route: ROUTES.PHARMACY,
      description: 'Medication dispensing',
      stats: 'Pharmacy',
      glowColor: 'from-orange-500 to-amber-400',
      moduleCode: 'pharmacy',
      category: 'clinical',
    },

    // Finance Module
    {
      id: 'billing',
      label: 'Billing & Finance',
      icon: <FaRegCreditCard className="w-5 h-5" />,
      href: ROUTES.BILLING,
      route: ROUTES.BILLING,
      description: 'Invoices & payments',
      stats: 'Finance',
      glowColor: 'from-yellow-500 to-orange-400',
      moduleCode: 'billing',
      category: 'finance',
    },

    // Administration Module
    {
      id: 'administration',
      label: 'Facility Governance',
      icon: <MonitorCheckIcon className="w-5 h-5" />,
      href: ROUTES.ADMINISTRATION,
      route: ROUTES.ADMINISTRATION,
      description: 'Configure facilities, manage workforce access, services, and operational controls',
      stats: 'Governance',
      glowColor: 'from-slate-600 to-slate-500',
      moduleCode: 'administration',
      category: 'admin',
    },

    // Account Module - ALWAYS ACCESSIBLE
    {
      id: 'account',
      label: 'Account',
      icon: <UserCog className="w-5 h-5" />,
      href: ROUTES.ACCOUNT,
      route: ROUTES.ACCOUNT,
      description: 'Manage your profile, security, and preferences',
      stats: 'User Settings',
      glowColor: 'from-emerald-500 to-teal-400',
      moduleCode: 'account',
      category: 'system',
    },
  ], []);

  // Check if user is in patient mode
  const accessiblePatientModuleCodes = useMemo(
    () => ['patient_dashboard', 'account'],
    []
  );

  // Filter menu items based on accessible module codes
  const currentMenuItems = useMemo(() => {
    if (inPatientMode) {
      return menuConfig.filter(item => {
        if (item.moduleCode === 'account') return true;
        return accessiblePatientModuleCodes.includes(item.moduleCode);
      });
    } else {
      return menuConfig.filter(item => {
        if (item.moduleCode === 'account') return true;
        return accessibleModuleCodes.includes(item.moduleCode);
      });
    }
  }, [accessibleModuleCodes, accessiblePatientModuleCodes, inPatientMode, menuConfig]);

  // Group menu items by category for better organization
  const groupedMenuItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    
    currentMenuItems.forEach(item => {
      const category = item.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    
    return groups;
  }, [currentMenuItems]);

  // Category display names
  const categoryNames: Record<string, string> = {
    clinical: 'Clinical',
    admin: 'Administration',
    patient: 'Patient Portal',
    system: 'System',
    finance: 'Finance',
    other: 'Other'
  };

  // Check if route is active
  const isRouteActive = useCallback((route: string) => {
    if (route === ROUTES.DASHBOARD) {
      return location.pathname === ROUTES.DASHBOARD;
    }
    return location.pathname.startsWith(route);
  }, [location.pathname]);

  // Get active item ID
  const activeItemId = useMemo(() => {
    const activeItem = currentMenuItems.find(item => isRouteActive(item.route));
    return activeItem?.id;
  }, [currentMenuItems, isRouteActive]);

  // Scroll active item into view
  useEffect(() => {
    if (activeItemRef.current && navContainerRef.current) {
      const container = navContainerRef.current;
      const activeElement = activeItemRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      
      // Check if active item is outside the visible area
      const isAboveViewport = activeRect.top < containerRect.top;
      const isBelowViewport = activeRect.bottom > containerRect.bottom;
      
      if (isAboveViewport) {
        // Scroll up to show the top of active item
        container.scrollTo({
          top: container.scrollTop - (containerRect.top - activeRect.top) - 20, // 20px extra padding
          behavior: 'smooth'
        });
      } else if (isBelowViewport) {
        // Scroll down to show the bottom of active item
        container.scrollTo({
          top: container.scrollTop + (activeRect.bottom - containerRect.bottom) + 20, // 20px extra padding
          behavior: 'smooth'
        });
      }
    }
  }, [activeItemId, location.pathname, currentMenuItems]); // Re-run when active item changes

  // Navigation handler
  const handleNavigation = useCallback((e: React.MouseEvent, route: string) => {
    e.preventDefault();
    navigate(route);
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  }, [navigate, onClose]);

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart === null || !isOpen) return;
    
    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (diff > 50) {
      onClose?.();
    }
  }, [touchStart, isOpen, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }

      // Module-specific shortcuts
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const shortcutMap: Record<string, string> = {};
        
        // Build shortcut map from accessible modules
        currentMenuItems.forEach((item, index) => {
          if (index < 9) { // Only map 1-9
            shortcutMap[(index + 1).toString()] = item.route;
          }
        });

        const route = shortcutMap[e.key];
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
  }, [isOpen, onClose, navigate, currentMenuItems]);

  // Render a single menu item
  const renderMenuItem = useCallback((item: MenuItem) => {
    const isActive = isRouteActive(item.route);
    const isHovered = activeHover === item.id;

    return (
      <a
        key={item.id}
        ref={isActive ? activeItemRef : null}
        href={item.href}
        onClick={(e) => handleNavigation(e, item.route)}
        className={cn(
          'group relative flex items-center',
          'rounded-xl transition-all duration-300 ease-out',
          'border',
          isActive
            ? cn(
                'bg-linear-to-r shadow-lg',
                isDark 
                  ? 'from-blue-500/10 to-cyan-500/10 border-blue-500/30' 
                  : 'from-blue-50 to-cyan-50 border-blue-200'
              )
            : cn(
                'border-transparent',
                isDark ? 'hover:bg-gray-800/50 hover:border-gray-700/50' : 'hover:bg-gray-100/50 hover:border-gray-200/50'
              ),
          collapsed ? 'p-2 justify-center' : 'p-2 gap-2'
        )}
        onMouseEnter={() => setActiveHover(item.id)}
        onMouseLeave={() => setActiveHover(null)}
        title={collapsed ? `${item.label} • ${item.description}` : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && !collapsed && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full bg-linear-to-b from-blue-400 via-cyan-400 to-blue-400 shadow-lg shadow-blue-400/50" />
        )}

        <div className={cn('relative shrink-0', collapsed ? 'mx-auto' : '')}>
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
              {item.icon}
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
  }, [collapsed, activeHover, isDark, isRouteActive, handleNavigation]);

  // Get context subtitle for header
  const getContextSubtitle = useCallback(() => {
    if (activeFacilityName && activeRoleCode) {
      // return `${activeFacilityName} • ${getRoleDisplayName(activeRoleCode)}`;
      return `${activeFacilityName}`;
    }
    return currentCapabilityName;
  }, [activeFacilityName, activeRoleCode, currentCapabilityName]);

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
        'w-full lg:w-auto',
        'max-w-[75vw] sm:max-w-[75vw] lg:max-w-none',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Header */}
      <div className={cn('shrink-0 p-3 border-b', isDark ? 'border-gray-800/50' : 'border-gray-200/50')}>
        <div className="flex items-center justify-between gap-3">
          {/* Logo / Brand */}
          <div
            className={cn(
              'flex items-center gap-3 flex-1 min-w-0 transition-all duration-300',
              collapsed && 'justify-center'
            )}
          >
              <LogoImage></LogoImage>
            {/* Text only renders when expanded */}
            {!collapsed && (
              <div className="min-w-0">
                <h2
                  className={cn(
                    'text-base sm:text-lg font-bold bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent',
                  )}
                >
                  Custocare AI
                </h2>
                <p
                  className={cn(
                    'text-xs truncate',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )}
                >
                  {formatName(getContextSubtitle())}
                </p>
              </div>
            )}
          </div>

          {/* Close button - ONLY visible on mobile when sidebar is open */}
          <button
            onClick={() => onClose?.()}
            className={cn(
              'p-2.5 rounded-xl transition-all duration-300 shrink-0',
              'hover:scale-105 active:scale-95',
              'lg:hidden', // Only show on mobile
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
      <nav 
        ref={navContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain scroll-smooth"
      >
        {!collapsed ? (
          // Expanded view with categories
          Object.entries(groupedMenuItems).map(([category, items]) => (
            items.length > 0 && (
              <div key={category} className="space-y-2">
                <p className={cn(
                  'text-xs font-bold uppercase tracking-wider px-2',
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {categoryNames[category]}
                </p>
                <div className="space-y-1.5">
                  {items.map(item => renderMenuItem(item))}
                </div>
              </div>
            )
          ))
        ) : (
          // Collapsed view (icons only)
          <div className="space-y-1.5">
            {currentMenuItems.map(item => renderMenuItem(item))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={cn('shrink-0 p-4 border-t', isDark ? 'border-gray-800/50' : 'border-gray-200/50')}>
        {!collapsed ? (
          <div className="space-y-3">
            <div className={cn(
              'p-3 rounded-xl border',
              isDark 
                ? 'bg-linear-to-br from-gray-800/50 to-gray-800/30 border-gray-700/50' 
                : 'bg-linear-to-br from-gray-50 to-gray-100/50 border-gray-200/50'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg shrink-0', isDark ? 'bg-cyan-500/20' : 'bg-cyan-100')}>
                  <HeadphonesIcon className={cn('w-4 h-4', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
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

            <div className="flex flex-col gap-2">
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  {user?.full_name || user?.first_name || 'User'}
                </p>
              </div>
              {inStaffMode && staffNumber && (
                <div className="flex-1 min-w-0">
                  <p className={cn('truncate font-bold text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Staff Number: <span className={cn('truncate', isDark ? 'text-blue-300' : 'text-blue-500')}>{staffNumber}</span>
                  </p>
                </div>
              )}
              {inPatientMode && patientNumber && (
                <div className="flex-1 min-w-0">
                  <p className={cn('truncate font-bold text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Patient Number: <span className={cn('truncate', isDark ? 'text-blue-300' : 'text-blue-500')}>{patientNumber}</span>
                  </p>
                </div>
              )}
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
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-gray-700 to-gray-800 mx-auto overflow-hidden">
              <div className="w-full h-full bg-linear-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
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