import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  X,
  Shield,
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
} from 'lucide-react';
import { type SidebarProps } from '../../types/index';
import { cn } from '../../types/cn';
import { ROUTES } from '../../../app/routes/routeConstants';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks/useApp';
import { 
  selectAccessibleModuleCodes,
  selectCurrentCapabilityName,
  selectActiveFacilityName,
  selectActiveRoleCode,
  selectStaffFacilities,
  switchCapability,
  switchFacility,
  getRoleDisplayName,
  type StaffFacilityAssignment,
} from '../../../app/store/slices/activeContextSlice';
import {FaRegCreditCard } from 'react-icons/fa';

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
  moduleCode: string; // Backend module code - this is REQUIRED
  category?: 'clinical' | 'admin' | 'patient' | 'system'|'finance';
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
  const dispatch = useAppDispatch();
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Get active context from Redux
  const activeContext = useAppSelector((state) => state.activeContext);
  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const currentCapabilityName = useAppSelector(selectCurrentCapabilityName);
  const activeFacilityName = useAppSelector(selectActiveFacilityName);
  const activeRoleCode = useAppSelector(selectActiveRoleCode);
  const staffFacilities = useAppSelector(selectStaffFacilities);
  const [isRoleSwitcherVisible, setIsRoleSwitcherVisible] = useState(false);

  
  const { 
    user, 
    availableCapabilities, 
    activeCapability,
    activeFacilityId,
    isStaffWithFacility,
  } = activeContext;

  const isDark = theme === 'dark';

  // Master menu configuration - maps backend module codes to sidebar items
  const menuConfig: MenuItem[] = useMemo(() => [
    // Dashboard Modules.
    {
      id: 'patient-dashboard',
      label: 'My Health',
      icon: <HeartPulse className="w-5 h-5" />,
      href: ROUTES.DASHBOARD,//TODO: Change to patient databoard.
      route: ROUTES.DASHBOARD,
      description: 'Personal health overview',
      stats: 'Health',
      shortcut: '⌘1',
      glowColor: 'from-emerald-500 to-teal-400',
      moduleCode: 'patient_dashboard',
      category: 'patient'
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
      category: 'admin'
    },

    //Modules.
    //1.Reception & medical records.
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
      category: 'clinical'
    },
    //2.Ward & Nursing Care Module.
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
      category: 'clinical'
    },
    //3.Clinical Module.
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
      category: 'clinical'
    }, 
    //4.Labooratory Module.
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
      category: 'clinical'
    },

    //5.Pharmacy Module.
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
      category: 'clinical'
    },

    //6. Billing & Finance Finance Module.
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
      category: 'finance'
    },

    // 7. Administration Module.
    {
      id: 'administration',
      label: 'Administration',
      icon: <MonitorCheckIcon className="w-5 h-5" />,
      href: ROUTES.ADMINISTRATION,
      route: ROUTES.ADMINISTRATION,
      description: 'Users & configuration',
      stats: 'Admin',
      glowColor: 'from-gray-600 to-gray-500',
      moduleCode: 'administration',
      category: 'admin'
    },
    //8. Account Module.
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

  // Filter menu items based on accessible module codes
  const currentMenuItems = useMemo(() => {
    return menuConfig.filter(item => {
      // Check if user has access to this module code
      return accessibleModuleCodes.includes(item.moduleCode);
    });
  }, [accessibleModuleCodes, menuConfig]);

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
    patient: 'Patient',
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

  // Navigation handler
  const handleNavigation = useCallback((e: React.MouseEvent, route: string) => {
    e.preventDefault();
    navigate(route);
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  }, [navigate, onClose]);

  // Capability switcher handler
  const handleCapabilitySwitch = useCallback((capability: string) => {
    dispatch(switchCapability(capability));
  }, [dispatch]);

  // Facility switcher handler (for staff)
  const handleFacilitySwitch = useCallback((facilityId: number) => {
    dispatch(switchFacility(facilityId));
  }, [dispatch]);

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
        href={item.href}
        onClick={(e) => handleNavigation(e, item.route)}
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
          collapsed ? 'p-2 justify-center' : 'p-2 gap-2'
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

  // Render capability switcher dropdown
  const renderCapabilitySwitcher = useCallback(() => {
    if (availableCapabilities.length <= 1) return null;

    return (
      <div className="mb-4">
        <label className={cn(
          'block text-xs font-medium mb-2',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          Select Portal.
        </label>
        <select
          value={activeCapability || ''}
          onChange={(e) => handleCapabilitySwitch(e.target.value)}
          className={cn(
            'w-full px-3 py-2 rounded-lg border text-sm',
            isDark 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-gray-50 border-gray-300 text-gray-900'
          )}
        >
          {availableCapabilities.map(capability => (
            <option key={capability} value={capability}>
              {getRoleDisplayName(capability)}
            </option>
          ))}
        </select>
      </div>
    );
  }, [availableCapabilities, activeCapability, isDark, handleCapabilitySwitch]);

  // Render facility switcher (for staff with facilities)
  const renderFacilitySwitcher = useCallback(() => {
    if (!isStaffWithFacility || staffFacilities.length <= 1) return null;

    return (
      <div className="mb-4">
        <label className={cn(
          'block text-xs font-medium mb-2',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          Switch Facility(Auto)
        </label>
        <select
          value={activeFacilityId || ''}
          onChange={(e) => handleFacilitySwitch(parseInt(e.target.value, 10))}
          className={cn(
            'w-full px-3 py-2 rounded-lg border text-sm',
            isDark 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-gray-50 border-gray-300 text-gray-900'
          )}
        >
          {staffFacilities.map((facility: StaffFacilityAssignment) => (
            <option key={facility.facility_id} value={facility.facility_id}>
              {facility.facility_name} ({getRoleDisplayName(facility.role_code)})
            </option>
          ))}
        </select>
      </div>
    );
  }, [isStaffWithFacility, staffFacilities, activeFacilityId, isDark, handleFacilitySwitch]);

  // Get context subtitle for header
  const getContextSubtitle = useCallback(() => {
    if (activeFacilityName && activeRoleCode) {
      return `${activeFacilityName} • ${getRoleDisplayName(activeRoleCode)}`;
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
            Custocare AI
          </h2>
          <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {getContextSubtitle()}
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

  {/* Capability & Facility Switchers */}
  {!collapsed && (
    <>
      {/* Role switcher toggle indicator - shown by default */}
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRoleSwitcherVisible(!isRoleSwitcherVisible)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 w-full',
              'hover:scale-[1.02] active:scale-95',
              isDark
                ? 'hover:bg-gray-800/50 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            )}
            aria-label="Toggle role switcher"
          >
            <div className="flex items-center gap-2 flex-1 cursor-pointer">
              <span className="text-sm font-medium">Switch Workspace.</span>
              <div className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                isDark 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-blue-100 text-blue-600'
              )}>
                Available
              </div>
            </div>
            <LayoutDashboard   className={cn(
              'w-4 h-4 transition-transform duration-300',
              isRoleSwitcherVisible && 'rotate-90'
            )} />
          </button>
        </div>
      </div>

      {/* Role switcher content - hidden by default */}
      {isRoleSwitcherVisible && (
        <div className="mt-2">
          {renderCapabilitySwitcher()}
          {renderFacilitySwitcher()}
        </div>
      )}
    </>
  )}
</div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
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
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-800/30 border-gray-700/50' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50'
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
                  {currentCapabilityName}
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
