/**
 * ============================================================================
 * NAVBAR - MAIN COMPONENT
 * ============================================================================
 *
 * Layout-only adjustments:
 * - Pass `isMobile` down to StaffPresence/MySpace for ProfileMenu-like dropdown positioning
 * - Slight wrapping/spacing improvements for small screens
 * - ✅ Enforces navigation to /dashboard after ANY account/context switch
 * - ✅ Mobile menu icon is now among the right-side items (first item on mobile)
 * - ✅ Menu option is now visible on iPads and tablets (breakpoint adjusted to lg)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Sparkles,
  Heart,
  Briefcase,
  UserCheck,
  Menu,
} from 'lucide-react';
import { cn } from '../../../types/cn';
import { useNavigate } from 'react-router-dom';
import { ROUTES} from '../../../../app/routes/routeConstants';
import { logout } from '../../../../app/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
// import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../app/routes/constants/administration.paths';
import {
  switchCapability,
  switchFacility,
  selectCurrentCapabilityName,
  selectStaffFacilities,
  getRoleDisplayName,
} from '../../../../app/store/slices/activeContextSlice';
import LogoImage from '../../../assets/LogoImage';
import { useSelector } from 'react-redux';
import {
  getStaffUuid,
  isInPatientMode,
  isInStaffMode,
  getPatientUuid,
} from '../../../../app/store/utils/contextSelectors';

import { UserProfileMenu } from './UserProfileMenu';
import ContextSwitcher from './ContextSwitcher';
import StaffPresence from './StaffPresence';
import MySpace from './MySpace';
// import Subscription from './Subscription';
import { BrandName } from '../../../utils/BrandName';

export interface NavbarProps {
  theme: 'light' | 'dark';
  onMenuClick?: () => void;
  onThemeToggle?: () => void;
  className?: string;
}

interface ContextOption {
  id: string;
  type: 'personal' | 'professional' | 'administrative';
  capability: string;
  facilityId?: number;
  facilityName?: string;
  facilityLogo?: string | null;
  roleCode?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'rose' | 'amber' | 'emerald' | 'cyan' | 'indigo' | 'teal';
  isActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme = 'dark',
  onMenuClick,
  className,
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isContextSwitcherOpen, setIsContextSwitcherOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const inPatientMode = useSelector(isInPatientMode);
  const inStaffMode = useSelector(isInStaffMode);
  const staffNumber = useSelector(getStaffUuid);
  const patientNumber = useSelector(getPatientUuid);

  const isDark = theme === 'dark';

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { user, activeCapability, activeFacilityId, availableCapabilities } = useAppSelector(
    (state) => state.activeContext
  );

  const currentCapabilityName = useAppSelector(selectCurrentCapabilityName);
  const staffFacilities = useAppSelector(selectStaffFacilities);

  const allContextOptions = useMemo((): ContextOption[] => {
    const options: ContextOption[] = [];

    const hasPatient = availableCapabilities.includes('patient');
    const hasStaff = availableCapabilities.includes('staff');
    const spatieRoles = availableCapabilities.filter((cap) => cap !== 'patient' && cap !== 'staff');

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

    if (hasStaff && staffFacilities.length > 0) {
      staffFacilities.forEach((facility) => {
        options.push({
          id: `staff-facility-${facility.facility_id}`,
          type: 'professional',
          capability: 'staff',
          facilityId: facility.facility_id,
          facilityName: facility.facility_name,
          facilityLogo: facility.facility_logo_path,
          roleCode: facility.role_code,
          title: getRoleDisplayName(facility.role_code),
          subtitle: facility.facility_name,
          icon: <Briefcase className="w-4 h-4" />,
          color: 'blue',
          isActive: activeCapability === 'staff' && activeFacilityId === facility.facility_id,
        });
      });
    }

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
  }, [availableCapabilities, staffFacilities, activeCapability, activeFacilityId]);

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

  const activeContextOption = useMemo(() => {
    return allContextOptions.find((opt) => opt.isActive) || allContextOptions[0];
  }, [allContextOptions]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') e.preventDefault();
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsContextSwitcherOpen(true);
      }
      if (e.key === 'Escape') {
        setIsContextSwitcherOpen(false);
        setIsUserDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

    const handleLogout = () => {
      // 1. First show toast (immediate feedback to user)
      showToast(
        'info',
        "You've been logged out successfully. Thank you for using Custocare — see you again soon!",
        5000
      );
      
      // 2. Then dispatch logout (clears auth state)
      dispatch(logout());
      
      // 3. Finally navigate (redirects user)
      navigate(ROUTES.LANDING);
    };


  const handleContextSwitch = (option: ContextOption) => {
    try {
      setIsContextSwitcherOpen(false);

      if (option.isActive) {
        showToast('info', `Already in ${option.title}`, 2000);
        return;
      }

      switch (option.type) {
        case 'personal':
          dispatch(switchCapability(option.capability));
          // ✅ Always navigate to dashboard after switching context
          navigate(ROUTES.DASHBOARD);
          showToast('success', `Switched to ${option.title}`, 3000);
          break;

        case 'professional':
          if (option.facilityId) {
            if (activeCapability !== 'staff') dispatch(switchCapability('staff'));
            dispatch(switchFacility(option.facilityId));
            // ✅ Always navigate to dashboard after switching context
            navigate(ROUTES.DASHBOARD);
            showToast('success', `Switched to ${option.title} at ${option.facilityName}`, 3000);
          }
          break;

        case 'administrative':
          dispatch(switchCapability(option.capability));
          // ✅ Always navigate to dashboard after switching context
          navigate(ROUTES.DASHBOARD);
          showToast('success', `Switched to ${option.title}`, 3000);
          break;

        default:
          // ✅ Always navigate to dashboard as fallback
          navigate(ROUTES.DASHBOARD);
          break;
      }
    } catch (error) {
      console.error('Error switching context:', error);
      showToast('error', 'Failed to switch workspace. Please try again.', 4000);
      // ✅ Even on error, navigate to dashboard for consistency
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
   <nav
  className={cn(
    // Mobile: tighter padding, items start at left
    // Desktop: normal padding, spread out
    'flex items-center gap-2 px-2 sm:px-4 py-1.2 lg:justify-between',
    className
  )}
>
  {/* LEFT: BRAND (desktop only) */}
  <div className="hidden lg:flex items-center gap-2 sm:gap-3 shrink-0">
  <LogoImage/>
    <div className="hidden lg:block">
      <div className="flex items-center gap-2">
      <BrandName></BrandName>
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-bold rounded-full border',
            isDark
              ? 'bg-linear-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30'
              : 'bg-linear-to-r from-blue-100 to-cyan-50 text-blue-700 border-blue-300'
          )}
        >
          <Sparkles className="w-3 h-3 inline mr-1" />
          Pro
        </span>
      </div>

      <p className={cn('text-xs mt-0.5 font-semibold', isDark ? 'text-blue-500' : 'text-blue-600')}>
        Continuous Care. Operational Excellence.
      </p>
    </div>
  </div>

  {/* RIGHT: ACTIONS */}
<div className="flex items-center justify-between w-full lg:flex-1 lg:justify-end lg:gap-3">
  {/* Mobile menu (visible on tablets and below) */}
  <button
    onClick={onMenuClick}
    className={cn(
      'lg:hidden flex items-center justify-center shrink-0 cursor-pointer',
      'w-10 h-10 rounded-lg',
      '-ml-2 sm:-ml-1 lg:ml-0',
      'transition-all duration-300 hover:scale-105',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      isDark
        ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/50 focus:ring-cyan-500/50'
        : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 border border-gray-300/50 focus:ring-blue-500/50'
    )}
    aria-label="Open menu"
    title="Open menu"
  >
    <Menu className="w-5 h-5" />
  </button>
      {/* <Subscription 
      isDark={isDark} 
      isMobile={isMobile}
      onUpgradeClick={() => {
        // Handle upgrade navigation
        navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS);
      }}
      onManageClick={() => {
        // Handle manage billing navigation
        navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS);
      }}
    /> */}

  {/* Context switcher */}
  {allContextOptions.length > 0 && (
    <div className="cursor-pointer" title="Switch facility or role">
      <ContextSwitcher
        isOpen={isContextSwitcherOpen}
        onToggle={() => setIsContextSwitcherOpen(!isContextSwitcherOpen)}
        activeContextOption={activeContextOption}
        groupedContextOptions={groupedContextOptions}
        allContextOptions={allContextOptions}
        userName={user?.full_name || 'User'}
        isDark={isDark}
        isMobile={isMobile}
        onContextSwitch={handleContextSwitch}
      />
    </div>
  )}

  {/* Staff presence */}
  {inStaffMode && activeFacilityId && (
    <div className="cursor-pointer" title="Set your work status">
      <StaffPresence isDark={isDark} isMobile={isMobile} />
    </div>
  )}

  {/* My space */}
  {inStaffMode && activeFacilityId && (
    <div className="cursor-pointer" title="Manage your workspace">
      <MySpace isDark={isDark} isMobile={isMobile} />
    </div>
  )}

  {/* User profile */}
  <div className="cursor-pointer" title="">
    <UserProfileMenu
      isOpen={isUserDropdownOpen}
      onToggle={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
      isDark={isDark}
      isMobile={isMobile}
      userName={user?.first_name}
      userEmail={user?.email ?? undefined}
      currentCapabilityName={currentCapabilityName}
      inStaffMode={inStaffMode}
      inPatientMode={inPatientMode}
      staffNumber={staffNumber ?? undefined}
      patientNumber={patientNumber ?? undefined}
      onLogout={handleLogout}
      onNavigate={(route) => navigate(route)}
    />
  </div>
</div>

</nav>

  );
};

export default React.memo(Navbar);