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
  Crown,
  Building2,
} from 'lucide-react';
import { cn } from '../../../types/cn';
import { useNavigate } from 'react-router-dom';
import { ROUTES} from '../../../../app/routes/routeConstants';
import { ROUTES as ONBOARDING_ROUTES } from '../../../../modules/administration/onboarding/routes/onboardingRouteConstants';
import { logoutClientSession } from '../../../../app/store/utils/logoutClientSession';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import {
  switchCapability,
  switchFacility,
  selectActiveFacilityId,
  selectCurrentCapabilityName,
  selectStaffFacilities,
  selectHasActiveStaffFacility,
  getRoleDisplayName,
} from '../../../../app/store/slices/activeContextSlice';
import {
  getStaffFacilitySwitchToast,
  mergeStaffFacilityContext,
  resolveStaffFacilityLandingPath,
} from '../../../navigation/facilityContextNavigation';
import LogoImage from '../../../assets/LogoImage';
import { useSelector } from 'react-redux';
import {
  getStaffUuid,
  isInPatientMode,
  isInStaffMode,
  getPatientUuid,
} from '../../../../app/store/utils/contextSelectors';
import { useGetFacilitySubscription } from '../../../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';

import { UserProfileMenu } from './UserProfileMenu';
import ContextSwitcher from './ContextSwitcher';
import StaffPresence from './StaffPresence';
import MySpace from './MySpace';
import Subscription from './Subscription';
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
  /** When set, choosing this row navigates here instead of switching Redux capability */
  navigateTo?: string;
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

  const activeFacilityId = useAppSelector(selectActiveFacilityId);
  const showStaffFacilityContext = useAppSelector((state) =>
    selectHasActiveStaffFacility(state),
  );
  const subscriptionQueryEnabled =
    showStaffFacilityContext && activeFacilityId != null;

  const { data: subResp } = useGetFacilitySubscription({
    enabled: subscriptionQueryEnabled,
  });

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
    } else {
      options.push({
        id: 'activate-patient-portal',
        type: 'personal',
        capability: 'patient',
        title: 'Activate Patient Portal',
        subtitle:
          'Access your health records, appointments, test results, and billing',
        icon: <Heart className="w-4 h-4" />,
        color: 'purple',
        isActive: false,
        navigateTo: ONBOARDING_ROUTES.PATIENT_ONBOARDING,
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
    const active = allContextOptions.find((opt) => opt.isActive);
    if (active) return active;
    const firstSwitchable = allContextOptions.find((opt) => !opt.navigateTo);
    return firstSwitchable ?? allContextOptions[0];
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
      
      // 2. Clear auth, facility context, and React Query cache (aligned with API logout)
      logoutClientSession(dispatch);
      
      // 3. Finally navigate (redirects user)
      navigate(ROUTES.LANDING);
    };


  const handleContextSwitch = (option: ContextOption) => {
    try {
      setIsContextSwitcherOpen(false);

      if (option.navigateTo) {
        navigate(option.navigateTo);
        showToast('info', 'Complete activation to unlock your patient portal', 3500);
        return;
      }

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

            const facility = mergeStaffFacilityContext(
              staffFacilities.find(
                (entry) => entry.facility_id === option.facilityId,
              ),
              {
                facility_id: option.facilityId,
                facility_name: option.facilityName ?? null,
                role_code: option.roleCode ?? '',
                is_primary_facility: false,
              },
            );

            const landingPath = resolveStaffFacilityLandingPath(facility);
            navigate(landingPath);

            const toast = getStaffFacilitySwitchToast(
              facility,
              option.facilityName ?? 'facility',
              option.title,
            );
            if (toast) {
              showToast(toast.type, toast.message, toast.type === 'success' ? 3000 : 5000);
            }
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
      <BrandName />
        {subscriptionQueryEnabled && (() => {
          const plan = subResp?.data?.plan;
          const slug = plan?.slug || '';
          const name = plan?.name?.slice(0, 3) || '';
          if (!name) {
            return null;
          }
          const icon =
            slug === 'essential' ? <Crown className="w-3 h-3 inline mr-1" /> :
            slug === 'professional' ? <Sparkles className="w-3 h-3 inline mr-1" /> :
            <Building2 className="w-3 h-3 inline mr-1" />;
          const colors = slug === 'essential'
            ? { light: 'bg-emerald-100 text-emerald-700 border-emerald-300', dark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
            : slug === 'professional'
            ? { light: 'bg-blue-100 text-blue-700 border-blue-300', dark: 'bg-blue-500/20 text-cyan-300 border-cyan-500/30' }
            : { light: 'bg-purple-100 text-purple-700 border-purple-300', dark: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
          return (
            <span className={cn('px-2 py-0.5 text-xs font-bold rounded-full border whitespace-nowrap', isDark ? colors.dark : colors.light)}>
              {icon}{name}
            </span>
          );
        })()}
      </div>

      <p className={cn('text-xs mt-0.5 font-semibold', isDark ? 'text-blue-500' : 'text-blue-600')}>
        Continuous Care. Clinical Excellence.
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
      {subscriptionQueryEnabled && (
        <Subscription isDark={isDark} isMobile={isMobile} />
      )}

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