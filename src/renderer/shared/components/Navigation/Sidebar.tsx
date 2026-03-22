import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Bell,
  // Stethoscope,
  HeartPulse,
  // PillIcon,
  FileText,
  UserCog,
  Briefcase,
  // MicroscopeIcon,
  MonitorCheckIcon,
  HeadphonesIcon,
  X,
  Globe,
} from 'lucide-react';
import { type SidebarProps } from '../../types/index';
import { cn } from '../../types/cn';
import { ROUTES } from '../../../app/routes/routeConstants';
import { PLATFORM_ADMIN_ROUTES } from '../../../app/routes/constants/platform-administration.paths';
import { useAppSelector } from '../../../app/store/hooks/useApp';
import {
  selectAccessibleModuleCodes,
  selectCurrentCapabilityName,
  selectActiveFacilityName,
  selectActiveRoleCode,
} from '../../../app/store/slices/activeContextSlice';
// import { FaRegCreditCard } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import {
  getPatientUuid,
  getStaffUuid,
  isInPatientMode,
  isInStaffMode,
  getActiveCapability,
  getStaffFacilities,
  getActiveFacilityId,
} from '../../../app/store/utils/contextSelectors';
import { getRoleDisplayName as formatName } from '../../utils/facilityRoleFormator';
import LogoImage from '../../assets/LogoImage';

/* ── Read the authenticated user from the auth slice ── */
import { selectUser } from '../../../app/store/slices/authSlice';
import { BrandName } from '../../utils/BrandName';

/* -------------------------------------------------------------------------- */

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
  moduleCode: string;
  category?: 'clinical' | 'admin' | 'patient' | 'system' | 'finance' | 'platform';
  // Which capabilities this menu item belongs to
  allowedCapabilities: string[];
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
  theme = 'dark',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);
  const user = useSelector(selectUser);
  
  const displayName = 
    user?.profile?.last_name && user?.profile?.first_name
      ? `${user.profile.last_name} ${user.profile.first_name}`
      : user?.profile?.display_name || 'User';

  /* ── Context selectors ── */
  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const currentCapabilityName = useAppSelector(selectCurrentCapabilityName);
  const activeFacilityName = useAppSelector(selectActiveFacilityName);
  const activeRoleCode = useAppSelector(selectActiveRoleCode);
  
  /* ── Get current capability ── */
  const activeCapability = useSelector(getActiveCapability);
  const staffFacilities = useSelector(getStaffFacilities);
  const activeFacilityId = useSelector(getActiveFacilityId);

  /* ── UUID helpers ── */
  const staffNumber = useSelector(getStaffUuid);
  const patientNumber = useSelector(getPatientUuid);

  /* ── Mode flags ── */
  const inPatientMode = useSelector(isInPatientMode);
  const inStaffMode = useSelector(isInStaffMode);

  const isDark = theme === 'dark';

  /* ── Get modules for current facility (if in staff mode with facility) ── */
  const currentFacilityModules = useMemo(() => {
    if (inStaffMode && activeFacilityId && staffFacilities.length > 0) {
      const facility = staffFacilities.find(f => f.facility_id === activeFacilityId);
      return facility?.modules?.filter(m => m.is_active).map(m => m.code) || [];
    }
    return [];
  }, [inStaffMode, activeFacilityId, staffFacilities]);

  /* ── Master menu configuration with capability ownership ── */
  const menuConfig: MenuItem[] = useMemo(
    () => [
      // Patient Module - ONLY patient capability
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
        allowedCapabilities: ['patient'],
      },
      
      // Staff Dashboard - ONLY staff capability
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
        allowedCapabilities: ['staff'],
      },

      // Clinical Modules - ONLY staff capability (facility-based)
      {
        id: 'front-desk',
        label: 'Medical Records',
        icon: <FileText className="w-5 h-5" />,
        href: ROUTES.MEDICAL_RECORDS,
        route: ROUTES.MEDICAL_RECORDS,
        description: 'Medical Records, Patient Registration & workflows',
        stats: 'Patients in Care',
        glowColor: 'from-purple-500 to-pink-400',
        moduleCode: 'medical_records',
        category: 'clinical',
        allowedCapabilities: ['staff'],
      },
      // {
      //   id: 'nursing-care',
      //   label: 'Nursing Care',
      //   icon: <HeartPulse className="w-5 h-5" />,
      //   href: ROUTES.NURSING,
      //   route: ROUTES.NURSING,
      //   description: 'Vitals & ward care',
      //   stats: 'Nursing',
      //   glowColor: 'from-green-500 to-emerald-400',
      //   moduleCode: 'nursing',
      //   category: 'clinical',
      //   allowedCapabilities: ['staff'],
      // },
      // {
      //   id: 'clinical',
      //   label: 'Clinical Workspace',
      //   icon: <Stethoscope className="w-5 h-5" />,
      //   href: ROUTES.CLINICAL,
      //   route: ROUTES.CLINICAL,
      //   description: 'Doctor Consultation & diagnosis',
      //   stats: 'Clinical',
      //   glowColor: 'from-indigo-500 to-purple-400',
      //   moduleCode: 'clinical',
      //   category: 'clinical',
      //   allowedCapabilities: ['staff'],
      // },
      // {
      //   id: 'laboratory',
      //   label: 'Laboratory',
      //   icon: <MicroscopeIcon className="w-5 h-5" />,
      //   href: ROUTES.LABORATORY,
      //   route: ROUTES.LABORATORY,
      //   description: 'Lab tests, results & specimens.',
      //   stats: 'Lab',
      //   glowColor: 'from-rose-500 to-pink-400',
      //   moduleCode: 'laboratory',
      //   category: 'clinical',
      //   allowedCapabilities: ['staff'],
      // },
      // {
      //   id: 'pharmacy',
      //   label: 'Pharmacy',
      //   icon: <PillIcon className="w-5 h-5" />,
      //   href: ROUTES.PHARMACY,
      //   route: ROUTES.PHARMACY,
      //   description: 'Medication dispensing',
      //   stats: 'Pharmacy',
      //   glowColor: 'from-orange-500 to-amber-400',
      //   moduleCode: 'pharmacy',
      //   category: 'clinical',
      //   allowedCapabilities: ['staff'],
      // },

      // Finance Module - ONLY staff capability (facility-based)
      // {
      //   id: 'billing',
      //   label: 'Billing & Finance',
      //   icon: <FaRegCreditCard className="w-5 h-5" />,
      //   href: ROUTES.BILLING,
      //   route: ROUTES.BILLING,
      //   description: 'Invoices & payments',
      //   stats: 'Finance',
      //   glowColor: 'from-yellow-500 to-orange-400',
      //   moduleCode: 'billing',
      //   category: 'finance',
      //   allowedCapabilities: ['staff'],
      // },

      // Administration Module - ONLY staff capability (facility-based)
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
        allowedCapabilities: ['staff'],
      },

      // Platform Administration - ONLY super_admin capability
      {
        id: 'platform-admin',
        label: 'Platform Administration',
        icon: <Globe className="w-5 h-5" />,
        href: PLATFORM_ADMIN_ROUTES.FACILITIES,
        route: PLATFORM_ADMIN_ROUTES.FACILITIES,
        description: 'Global platform settings, system configuration, user management across all facilities',
        stats: 'Platform',
        shortcut: '⌘P',
        glowColor: 'from-slate-600 to-slate-500',
        moduleCode: 'platform_administration',
        category: 'platform',
        allowedCapabilities: ['super_admin'],
      },

      // System Settings - ONLY super_admin capability//Note: To be added later
      // {
      //   id: 'system-settings',
      //   label: 'System Settings',
      //   icon: <Settings className="w-5 h-5" />,
      //   href: ROUTES.SYSTEM_SETTINGS,
      //   route: ROUTES.SYSTEM_SETTINGS,
      //   description: 'System-wide configuration and maintenance',
      //   stats: 'System',
      //   glowColor: 'from-slate-600 to-slate-500',
      //   moduleCode: 'platform_administration',
      //   category: 'platform',
      //   allowedCapabilities: ['super_admin'],
      // },

      // Account Module - Available to ALL capabilities
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
        allowedCapabilities: ['patient', 'staff', 'super_admin'], // Add any new capabilities here
      },
    ],
    [],
  );

  /* ── Filter menu items based on active capability and module access ── */
  const currentMenuItems = useMemo(() => {
    if (!activeCapability) return [];

    return menuConfig.filter((item) => {
      // First check if this item is allowed for the current capability
      if (!item.allowedCapabilities.includes(activeCapability)) {
        return false;
      }

      // For staff capability, we must also check module access permissions
      if (activeCapability === 'staff') {
        // Staff with facilities: check facility-specific modules
        if (inStaffMode && activeFacilityId && currentFacilityModules.length > 0) {
          return currentFacilityModules.includes(item.moduleCode);
        }
        // Staff without facilities: check standard accessible modules
        return accessibleModuleCodes.includes(item.moduleCode);
      }

      // For non-staff capabilities (patient, super_admin, etc.), 
      // we don't need to check module codes - if they're allowed in the capability,
      // they have access
      return true;
    });
  }, [activeCapability, menuConfig, inStaffMode, activeFacilityId, currentFacilityModules, accessibleModuleCodes]);

  /* ── Group menu items by category (preserving original order) ── */
  const groupedMenuItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    
    // Define category order (matching original)
    const categoryOrder = ['patient','clinical', 'finance', 'admin', 'platform', 'system'];
    
    // Initialize empty arrays for each category
    categoryOrder.forEach(category => {
      groups[category] = [];
    });
    
    // Group items by category
    currentMenuItems.forEach((item) => {
      const category = item.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    
    // Remove empty categories
    const filteredGroups: Record<string, MenuItem[]> = {};
    categoryOrder.forEach(category => {
      if (groups[category] && groups[category].length > 0) {
        filteredGroups[category] = groups[category];
      }
    });
    
    return filteredGroups;
  }, [currentMenuItems]);

  const categoryNames: Record<string, string> = {
    clinical: 'Clinical',
    admin: 'Administration',
    patient: 'Patient Portal',
    system: 'System',
    finance: 'Finance',
    platform: 'Platform',
    other: 'Other',
  };

  /* ── Route helpers ── */
const isRouteActive = useCallback(
  (route: string) => {
    // Exact match for dashboard
    if (route === ROUTES.DASHBOARD) return location.pathname === ROUTES.DASHBOARD;
    
    // Get the base path (first two segments for platform-admin, first segment for others)
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // For platform-admin routes, match the two segments (/platform-admin/facilities/*)
    if (route.includes('/platform-admin/')) {
      const basePath = `/${pathSegments.slice(0, 1).join('/')}`;
      return route.startsWith(basePath);
    }
    
    // For account routes, match the first two segments (/account/*)
    if (route === ROUTES.ACCOUNT) {
      return pathSegments[0] === 'account';
    }
    
    // For other routes, use startsWith
    return location.pathname.startsWith(route);
  },
  [location.pathname],
);

  const activeItemId = useMemo(() => {
    const activeItem = currentMenuItems.find((item) => isRouteActive(item.route));
    return activeItem?.id;
  }, [currentMenuItems, isRouteActive]);

  /* ── Scroll active item into view ── */
  useEffect(() => {
    if (activeItemRef.current && navContainerRef.current) {
      const container = navContainerRef.current;
      const activeElement = activeItemRef.current;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      const isAboveViewport = activeRect.top < containerRect.top;
      const isBelowViewport = activeRect.bottom > containerRect.bottom;

      if (isAboveViewport) {
        container.scrollTo({
          top: container.scrollTop - (containerRect.top - activeRect.top) - 20,
          behavior: 'smooth',
        });
      } else if (isBelowViewport) {
        container.scrollTo({
          top: container.scrollTop + (activeRect.bottom - containerRect.bottom) + 20,
          behavior: 'smooth',
        });
      }
    }
  }, [activeItemId]);

  /* ── Navigation handler ── */
  const handleNavigation = useCallback(
    (e: React.MouseEvent, route: string) => {
      e.preventDefault();
      navigate(route);
      if (window.innerWidth < 1024) onClose?.();
    },
    [navigate, onClose],
  );

  /* ── Touch gesture handling ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart === null || !isOpen) return;
      const touchEnd = e.touches[0].clientX;
      const diff = touchStart - touchEnd;
      if (diff > 50) onClose?.();
    },
    [touchStart, isOpen, onClose],
  );

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose?.();

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const shortcutMap: Record<string, string> = {};
        currentMenuItems.forEach((item, index) => {
          if (index < 9) shortcutMap[(index + 1).toString()] = item.route;
        });

        const route = shortcutMap[e.key];
        if (route) {
          e.preventDefault();
          navigate(route);
        }

        // Special shortcut for platform admin (⌘P) - only works if in super_admin capability
        if (e.key === 'p' && activeCapability === 'super_admin') {
          e.preventDefault();
          navigate(ROUTES.PLATFORM_ADMINISTRATION);
        }

        if (e.key === ',') {
          e.preventDefault();
          navigate(ROUTES.SETTINGS);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, navigate, currentMenuItems, activeCapability]);

  /* ── Render a single menu item (original styling preserved) ── */
  const renderMenuItem = useCallback(
    (item: MenuItem) => {
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
                  'bg-linear-to-r shadow-xl',
                  isDark
                    ? 'from-blue-500/20 to-cyan-500/20 border-blue-500/50'
                    : 'from-blue-100 to-cyan-100 border-blue-300',
                )
              : cn(
                  'border-transparent',
                  isDark
                    ? 'hover:bg-gray-800/50 hover:border-gray-700/50'
                    : 'hover:bg-gray-100/50 hover:border-gray-200/50',
                ),
            collapsed ? 'p-2 justify-center' : 'p-2 gap-2',
          )}
          onMouseEnter={() => setActiveHover(item.id)}
          onMouseLeave={() => setActiveHover(null)}
          title={collapsed ? `${item.label} • ${item.description}` : undefined}
          aria-current={isActive ? 'page' : undefined}
        >
          {isActive && !collapsed && (
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full bg-linear-to-b from-blue-500 via-cyan-400 to-blue-500 shadow-xl shadow-blue-500/70" />
          )}

          <div className={cn('relative shrink-0', collapsed ? 'mx-auto' : '')}>
            <div
              className={cn(
                'p-2.5 rounded-xl transition-all duration-300',
                'border',
                isDark
                  ? 'bg-gray-800/50 border-gray-700/50'
                  : 'bg-gray-50 border-gray-200',
                isActive &&
                  (isDark
                    ? 'border-blue-500/50 bg-blue-500/20 shadow-lg shadow-blue-500/30'
                    : 'border-blue-400 bg-blue-100 shadow-md shadow-blue-300/50'),
                isHovered && 'scale-110 shadow-xl',
              )}
            >
              <div
                className={cn(
                  'transition-all duration-300',
                  isActive
                    ? isDark
                      ? 'text-cyan-300 scale-110'
                      : 'text-blue-700 scale-110'
                    : isDark
                    ? 'text-gray-400'
                    : 'text-gray-600',
                )}
              >
                {item.icon}
              </div>
            </div>
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'font-semibold text-sm truncate',
                    isActive
                      ? isDark
                        ? 'text-white font-bold'
                        : 'text-gray-900 font-bold'
                      : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700',
                  )}
                >
                  {item.label}
                </span>
              </div>

              <p
                className={cn(
                  'text-xs truncate leading-relaxed',
                  isActive
                    ? isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                    : isDark
                    ? 'text-gray-500'
                    : 'text-gray-600',
                )}
              >
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-0.5">
                {item.stats && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isActive
                        ? isDark
                          ? 'text-gray-300'
                          : 'text-gray-700'
                        : isDark
                        ? 'text-gray-400'
                        : 'text-gray-600',
                    )}
                  >
                    {item.stats}
                  </span>
                )}
                {item.shortcut && (
                  <kbd
                    className={cn(
                      'px-1.5 py-0.5 text-xs rounded border font-mono',
                      isDark
                        ? 'bg-gray-800 text-gray-400 border-gray-700'
                        : 'bg-gray-100 text-gray-600 border-gray-300',
                    )}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </div>
            </div>
          )}
        </a>
      );
    },
    [collapsed, activeHover, isDark, isRouteActive, handleNavigation],
  );

  /* ── Context subtitle for header ── */
  const getContextSubtitle = useCallback(() => {
    // When in super_admin capability, show "Platform Administrator"
    if (activeCapability === 'super_admin') {
      return 'Platform Administrator';
    }
    // When in staff capability with facility, show facility name
    if (activeFacilityName && activeRoleCode) {
      return activeFacilityName;
    }
    // Default to capability name
    return currentCapabilityName;
  }, [activeFacilityName, activeRoleCode, currentCapabilityName, activeCapability]);

  /* ── Render ── */
  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'h-full flex flex-col',
        'backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        isDark ? 'bg-gray-900/98' : 'bg-white/98',
        'w-full lg:w-auto',
        'max-w-[75vw] sm:max-w-[75vw] lg:max-w-none',
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* ── Header ── */}
    <div className={cn('shrink-0 p-3 border-b', isDark ? 'border-gray-800/50' : 'border-gray-200/50')}>
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            'flex items-center gap-3 flex-1 min-w-0 transition-all duration-300',
            collapsed && 'justify-center',
          )}
        >
          <LogoImage />
          {!collapsed && (
            <div className="min-w-0">
              {/* Fixed: Changed bg-linear-to-r to bg-gradient-to-r */}
             <BrandName/>
              <p className={cn('text-xs truncate', isDark ? 'text-blue-400' : 'text-blue-600')}>
                {formatName(getContextSubtitle())}
              </p>
            </div>
          )}
        </div>

        {/* Close button — mobile only */}
        <button
          onClick={() => onClose?.()}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-300 shrink-0',
            'hover:scale-105 active:scale-95',
            'lg:hidden',
            isDark
              ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400'
              : 'hover:bg-red-50 text-gray-600 hover:text-red-600',
          )}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>

      {/* ── Navigation ── */}
      <nav
        ref={navContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain scroll-smooth"
      >
        {!collapsed ? (
          Object.entries(groupedMenuItems).map(
            ([category, items]) =>
              items.length > 0 && (
                <div key={category} className="space-y-2">
                  <p
                    className={cn(
                      'text-xs font-bold uppercase tracking-wider px-2',
                      isDark ? 'text-gray-500' : 'text-gray-400',
                    )}
                  >
                    {categoryNames[category]}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((item) => renderMenuItem(item))}
                  </div>
                </div>
              ),
          )
        ) : (
          <div className="space-y-1.5">
            {currentMenuItems.map((item) => renderMenuItem(item))}
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className={cn('shrink-0 p-4 border-t', isDark ? 'border-gray-800/50' : 'border-gray-200/50')}>
        {!collapsed ? (
          <div className="space-y-3">
            <div
              className={cn(
                'p-3 rounded-xl border',
                isDark
                  ? 'bg-linear-to-br from-gray-800/50 to-gray-800/30 border-gray-700/50'
                  : 'bg-linear-to-br from-gray-50 to-gray-100/50 border-gray-200/50',
              )}
            >
             <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg shrink-0', isDark ? 'bg-cyan-500/20' : 'bg-cyan-100')}>
              <HeadphonesIcon className={cn('w-4 h-4', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                Quick Support
              </p>
              <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 mt-0.5">
                {/* Email */}
                <a 
                  href="mailto:custocare@custospark.com"
                  className={cn(
                    'text-xs truncate hover:underline inline-flex items-center gap-1',
                    isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'
                  )}
                >
                  <span className="hidden xs:inline">✉️</span>
                  custocare@custospark.com
                </a>
                
                {/* Phone - optional, add if you have support phone */}
                <a 
                  href="tel:+256756697871"
                  className={cn(
                    'text-xs truncate hover:underline inline-flex items-center gap-1',
                    isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                  )}
                >
                  <span className="hidden xs:inline">📞</span>
                  +256 (756) 697-871
                </a>
              </div>
            </div>
          </div>
            </div>

            <div className="flex flex-col gap-2">
              {/* ── User display name — sourced from auth slice ── */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  {displayName}
                </p>
              </div>

              {inStaffMode && staffNumber && (
                <div className="flex-1 min-w-0">
                  <p className={cn('truncate font-bold text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Staff Number:{' '}
                    <span className={cn('truncate', isDark ? 'text-blue-300' : 'text-blue-500')}>
                      {staffNumber}
                    </span>
                  </p>
                </div>
              )}

              {inPatientMode && patientNumber && (
                <div className="flex-1 min-w-0">
                  <p className={cn('truncate font-bold text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Patient Number:{' '}
                    <span className={cn('truncate', isDark ? 'text-blue-300' : 'text-blue-500')}>
                      {patientNumber}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              className={cn(
                'w-full p-2.5 rounded-xl transition-all duration-300',
                'hover:scale-105 active:scale-95',
                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50',
              )}
            >
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