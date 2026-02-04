/**
 * ============================================================================
 * NAVBAR - MAIN COMPONENT
 * ============================================================================
 * 
 * Refactored into modular components:
 * - ContextSwitcher: Workspace/capability switching
 * - SmartSearch: AI-powered search
 * - NotificationCenter: Notification bell with badge
 * - QuickActions: Fast access menu
 * - UserProfileMenu: Profile dropdown
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Sparkles,
  Moon, 
  Sun,
  Heart, 
  Briefcase, 
  UserCheck,
} from 'lucide-react';
import { cn } from '../../../types/cn';
import { useNavigate } from 'react-router-dom';
import { ROUTES, ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';
import { logout } from '../../../../app/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { 
  switchCapability,
  switchFacility,
  selectCurrentCapabilityName,
  selectStaffFacilities,
  getRoleDisplayName,
} from '../../../../app/store/slices/activeContextSlice';
import { useSelector } from 'react-redux';
import { 
  getStaffUuid, 
  isInPatientMode, 
  isInStaffMode, 
  getPatientUuid 
} from '../../../../app/store/utils/contextSelectors';

// Import sub-components
import { NotificationCenter } from './NotificationCenter';
import { UserProfileMenu } from './UserProfileMenu';
import ContextSwitcher from './ContextSwitcher';
import StaffPresence from './StaffPresence';
import MySpace from './MySpace';
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
  const [isContextSwitcherOpen, setIsContextSwitcherOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const inPatientMode = useSelector(isInPatientMode);
  const inStaffMode = useSelector(isInStaffMode);
  const staffNumber = useSelector(getStaffUuid);
  const patientNumber = useSelector(getPatientUuid);

  const isDark = theme === 'dark';

  // ============================================================================
  // REDUX STATE & SELECTORS
  // ============================================================================
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    user,
    activeCapability,
    activeFacilityId,
    availableCapabilities,
  } = useAppSelector((state) => state.activeContext);

  const currentCapabilityName = useAppSelector(selectCurrentCapabilityName);
  const staffFacilities = useAppSelector(selectStaffFacilities);

  // ============================================================================
  // CONTEXT OPTIONS BUILDER
  // ============================================================================
  const allContextOptions = useMemo((): ContextOption[] => {
    const options: ContextOption[] = [];

    const hasPatient = availableCapabilities.includes('patient');
    const hasStaff = availableCapabilities.includes('staff');
    const spatieRoles = availableCapabilities.filter(cap => 
      cap !== 'patient' && cap !== 'staff'
    );

    // Personal Space
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

    // Professional Workspace
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

    // System Administration
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
    return allContextOptions.find(opt => opt.isActive) || allContextOptions[0];
  }, [allContextOptions]);

  const unreadCount = 3;

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsContextSwitcherOpen(true);
      }
      if (e.key === 'Escape') {
        setIsContextSwitcherOpen(false);
        setIsNotificationsOpen(false);
        setIsUserDropdownOpen(false);
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
    navigate(ROUTES.HOME);
  };

  const handleNotification = () => {
    navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
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
          if (inPatientMode) {
            navigate(ROUTES.PATIENT_DASHBOARD);
          }
          showToast('success', `Switched to ${option.title}`, 3000);
          break;

        case 'professional':
          if (option.facilityId) {
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
  // RENDER
  // ============================================================================
  return (
    <nav className={cn('flex items-center justify-between gap-2 sm:gap-4 px-4 py-3', className)}>
      {/* LEFT: BRAND */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 sm:ms-4 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20 cursor-pointer">
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

      {/* RIGHT: ACTION BUTTONS */}
      <div className="flex items-center gap-3 sm:gap-3">
        {/* Context Switcher */}
        {allContextOptions.length > 0 && (
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
        )}



        {/* Staff Presence */}
         {inStaffMode && activeFacilityId && (
        <StaffPresence isDark={isDark} />
              )}

      {/* My space for slef room booking. */}
        {inStaffMode && activeFacilityId && (
                <MySpace isDark={isDark} />
              )}
        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className={cn(
            'p-2 rounded-lg transition-all duration-300 hover:scale-105 hidden sm:block cursor-pointer',
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
        <NotificationCenter
          unreadCount={unreadCount}
          isOpen={isNotificationsOpen}
          isDark={isDark}
          onNotificationClick={handleNotification}
        />

        {/* User Profile */}
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
    </nav>
  );
};

export default React.memo(Navbar);