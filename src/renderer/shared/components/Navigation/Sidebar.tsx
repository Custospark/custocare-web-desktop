import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Receipt,
  FileText,
  Globe,
  HeartPulse,
  MonitorCheckIcon,
  UserCog,
  Syringe,        // for NURSING
  Stethoscope,    // for CLINICAL  
  Microscope,     // for LABORATORY
  Pill,           // for PHARMACY
} from 'lucide-react';
import { type SidebarProps } from '../../types/index';
import { cn } from '../../types/cn';
import { ROUTES } from '../../../app/routes/routeConstants';
import {
  ACCOUNT_ROUTES,
  MEDICAL_RECORDS_ROUTES,
  CLINICAL_ROUTES,
  NURSING_ROUTES,
  LABORATORY_ROUTES,
  PATIENT_PORTAL_ROUTES,
  PHARMACY_ROUTES,
  BILLING_ROUTES,
} from '../../../app/routes/routeConstants';
import { ADMIN_ROUTES } from '../../../app/routes/constants/administration.paths';
import { useAppSelector } from '../../../app/store/hooks/useApp';
import {
  selectAccessibleModuleCodes,
  selectCurrentCapabilityName,
  selectActiveFacilityName,
  selectActiveRoleCode,
} from '../../../app/store/slices/activeContextSlice';
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
import { selectUser } from '../../../app/store/slices/authSlice';

import SidebarHeader from './side-bar-components/SidebarHeader';
import SidebarNavigation from './side-bar-components/SidebarNavigation';
import SidebarFooter from './side-bar-components/SidebarFooter';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  route: string;
  description: string;
  operations?: Array<{
    id: string;
    label: string;
    route: string;
  }>;
  stats?: string;
  shortcut?: string;
  glowColor?: string;
  moduleCode: string;
  category?: 'clinical' | 'admin' | 'patient' | 'system' | 'finance' | 'platform';
  allowedCapabilities: string[];
}

interface SidebarExtendedProps extends SidebarProps {
  collapsed: boolean;
  enableNestedNavigation?: boolean;
  onToggleCollapse: () => void; // currently unused, kept for API compatibility
}

const CONTENT_SCROLL_SELECTOR = '[data-app-scroll-container="true"]';

export const Sidebar: React.FC<SidebarExtendedProps> = ({
  isOpen,
  onClose,
  collapsed,
  enableNestedNavigation = false,
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
  const previousPathnameRef = useRef(location.pathname);

  const user = useSelector(selectUser);

  const displayName =
    user?.profile?.last_name && user?.profile?.first_name
      ? `${user.profile.last_name} ${user.profile.first_name}`
      : user?.profile?.display_name || 'User';

  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const currentCapabilityName = useAppSelector(selectCurrentCapabilityName);
  const activeFacilityName = useAppSelector(selectActiveFacilityName);
  const activeRoleCode = useAppSelector(selectActiveRoleCode);

  const activeCapability = useSelector(getActiveCapability);
  const staffFacilities = useSelector(getStaffFacilities);
  const activeFacilityId = useSelector(getActiveFacilityId);

  const staffNumber = useSelector(getStaffUuid);
  const patientNumber = useSelector(getPatientUuid);

  const inPatientMode = useSelector(isInPatientMode);
  const inStaffMode = useSelector(isInStaffMode);

  const isDark = theme === 'dark';

  const currentFacilityModules = useMemo(() => {
    if (inStaffMode && activeFacilityId && staffFacilities.length > 0) {
      const facility = staffFacilities.find((f) => f.facility_id === activeFacilityId);
      return facility?.modules?.filter((m) => m.is_active).map((m) => m.code) || [];
    }
    return [];
  }, [inStaffMode, activeFacilityId, staffFacilities]);

const menuConfig: MenuItem[] = useMemo(
  () => [
    {
      id: 'patient-dashboard',
      label: 'My Health',
      icon: <HeartPulse className="w-5 h-5" />,
      href: ROUTES.PATIENT_DASHBOARD,
      route: ROUTES.PATIENT_DASHBOARD,
      description: 'Personal health overview',
      operations: [
        { id: 'pp-overview', label: 'Overview', route: PATIENT_PORTAL_ROUTES.OVERVIEW },
        { id: 'pp-health', label: 'My Health', route: PATIENT_PORTAL_ROUTES.HEALTH },
        { id: 'pp-records', label: 'Medical Records', route: PATIENT_PORTAL_ROUTES.RECORDS },
        { id: 'pp-results', label: 'Test Results', route: PATIENT_PORTAL_ROUTES.TEST_RESULTS },
        { id: 'pp-appointments', label: 'Appointments', route: PATIENT_PORTAL_ROUTES.APPOINTMENTS },
        { id: 'pp-medications', label: 'Medications', route: PATIENT_PORTAL_ROUTES.MEDICATIONS },
      ],
      stats: 'Health',
      shortcut: '⌘1',
      glowColor: 'from-emerald-500 to-teal-400',
      moduleCode: 'patient_dashboard',
      category: 'patient',
      allowedCapabilities: ['patient'],
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
      allowedCapabilities: ['staff'],
    },
    {
      id: 'front-desk',
      label: 'Medical Records',
      icon: <FileText className="w-5 h-5" />,
      href: MEDICAL_RECORDS_ROUTES.OVERVIEW,
      route: ROUTES.MEDICAL_RECORDS,
      description: 'Medical Records, Patient Registration & workflows',
      operations: [
        { id: 'mr-overview', label: 'Patient Intelligence', route: MEDICAL_RECORDS_ROUTES.OVERVIEW },
        { id: 'mr-patients', label: 'Patient Registry Management', route: MEDICAL_RECORDS_ROUTES.PATIENTS },
        { id: 'mr-encounter', label: 'Patient Encounter Hub', route: MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER },
        { id: 'mr-revenue', label: 'Billing & Reconciliation', route: MEDICAL_RECORDS_ROUTES.REVENUE_INTEGRITY },
      ],
      stats: 'Patients in Care',
      glowColor: 'from-purple-500 to-pink-400',
      moduleCode: 'medical_records',
      category: 'clinical',
      allowedCapabilities: ['staff'],
    },
    // ========== NEW CLINICAL WORKFLOW MENU ITEMS ==========
    {
      id: 'nursing',
      label: 'Nursing',
      icon: <Syringe className="w-5 h-5" />,
      href: NURSING_ROUTES.OVERVIEW,
      route: ROUTES.NURSING,
      description: 'Nursing assessments, vitals, and clinical notes',
      operations: [
        { id: 'nur-overview', label: 'Nursing Intelligence', route: NURSING_ROUTES.OVERVIEW },
        { id: 'nur-wards-patients', label: 'Wards & Patients', route: NURSING_ROUTES.WARDS_PATIENTS },
        { id: 'nur-encounter', label: 'Nursing Encounter', route: NURSING_ROUTES.NURSING_ENCOUNTER },
        { id: 'nur-medication-treatment', label: 'Medication & Treatment', route: NURSING_ROUTES.MEDICATION_TREATMENT },
        { id: 'nur-tasks-shifts', label: 'Tasks & Shifts', route: NURSING_ROUTES.TASKS_SHIFTS },
      ],
      stats: 'Care',
      glowColor: 'from-blue-500 to-cyan-400',
      moduleCode: 'nursing',
      category: 'clinical',
      allowedCapabilities: ['staff'],
    },
    {
      id: 'clinical',
      label: 'Clinical',
      icon: <Stethoscope className="w-5 h-5" />,
      href: CLINICAL_ROUTES.OVERVIEW,
      route: ROUTES.CLINICAL,
      description: 'Doctor consultations: Notes, Diagnosis, Prescriptions',
      operations: [
        { id: 'cl-overview', label: 'Clinical Intelligence', route: CLINICAL_ROUTES.OVERVIEW },
        { id: 'cl-patients', label: 'Patient Registry Management', route: CLINICAL_ROUTES.PATIENTS },
        { id: 'cl-encounter', label: 'Clinical Encounter Workflow', route: CLINICAL_ROUTES.VISIT_ACTION_CENTER },
        { id: 'cl-revenue', label: 'Billing & Reconciliation', route: CLINICAL_ROUTES.REVENUE_INTEGRITY },
      ],
      stats: 'Consultation',
      shortcut: '⌘C',
      glowColor: 'from-emerald-500 to-teal-400',
      moduleCode: 'clinical',
      category: 'clinical',
      allowedCapabilities: ['staff'],
    },
    {
      id: 'laboratory',
      label: 'Laboratory',
      icon: <Microscope className="w-5 h-5" />,
      href: LABORATORY_ROUTES.OVERVIEW,
      route: ROUTES.LABORATORY,
      description: 'Lab requests, sample tracking, and results',
      operations: [
        { id: 'lab-overview', label: 'Laboratory Intelligence', route: LABORATORY_ROUTES.OVERVIEW },
        { id: 'lab-patients', label: 'Lab Intake', route: LABORATORY_ROUTES.PATIENTS },
        { id: 'lab-action-center', label: 'Lab Encounter Center', route: LABORATORY_ROUTES.ACTION_CENTER },
        { id: 'lab-catalog', label: 'Service & Inventory Catalog', route: LABORATORY_ROUTES.CATALOG },
        { id: 'lab-receipts', label: 'Billing & Receipts', route: LABORATORY_ROUTES.RECEIPTS },
      ],
      stats: 'Diagnostics',
      glowColor: 'from-purple-500 to-indigo-400',
      moduleCode: 'laboratory',
      category: 'clinical',
      allowedCapabilities: ['staff'],
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      icon: <Pill className="w-5 h-5" />,
      href: PHARMACY_ROUTES.OVERVIEW,
      route: ROUTES.PHARMACY,
      description: 'Prescription fulfillment and medication management',
      operations: [
        { id: 'ph-overview', label: 'Pharmacy Intelligence', route: PHARMACY_ROUTES.OVERVIEW },
        { id: 'ph-patients', label: 'Queue & Patient Intake', route: PHARMACY_ROUTES.PATIENTS },
        { id: 'ph-action-center', label: 'Medication Encounter Center', route: PHARMACY_ROUTES.ACTION_CENTER },
        { id: 'ph-inventory', label: 'Stock & Catalog', route: PHARMACY_ROUTES.INVENTORY },
        { id: 'ph-receipts', label: 'Billing & Receipts', route: PHARMACY_ROUTES.RECEIPTS },
      ],
      stats: 'Dispensing',
      glowColor: 'from-rose-500 to-orange-400',
      moduleCode: 'pharmacy',
      category: 'clinical',
      allowedCapabilities: ['staff'],
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <Receipt className="w-5 h-5" />,
      href: BILLING_ROUTES.INTELLIGENCE,
      route: ROUTES.BILLING,
      description: 'Billing intake, charge capture, receipts, invoices, and reconciliation',
      operations: [
        { id: 'bill-intelligence', label: 'Financial Intelligence', route: BILLING_ROUTES.INTELLIGENCE },
        { id: 'bill-patients', label: 'Billing Intake', route: BILLING_ROUTES.PATIENTS },
        { id: 'bill-action-center', label: 'Billing Encounter', route: BILLING_ROUTES.ACTION_CENTER },
        { id: 'bill-revenue', label: 'Receipts, Invoices & Reconciliation', route: BILLING_ROUTES.REVENUE },
      ],
      stats: 'Finance',
      glowColor: 'from-amber-500 to-orange-400',
      moduleCode: 'billing',
      category: 'finance',
      allowedCapabilities: ['staff'],
    },
    // =====================================================
    {
      id: 'administration',
      label: 'Facility Governance',
      icon: <MonitorCheckIcon className="w-5 h-5" />,
      href: ADMIN_ROUTES.OVERVIEW,
      route: ROUTES.ADMINISTRATION,
      description:
        'Configure facilities, manage workforce access, services, and operational controls',
      operations: [
        { id: 'adm-overview', label: 'Facility Intelligence', route: ADMIN_ROUTES.OVERVIEW },
        { id: 'adm-facility-setup', label: 'Clinical Departments', route: ADMIN_ROUTES.FACILITY_SETUP },
        { id: 'adm-clinical-space', label: 'Clinical Space Management', route: '/administration/clinical-space-management' },
        { id: 'adm-services', label: 'Clinical & Billing Services', route: ADMIN_ROUTES.SERVICE_CATALOG },
        { id: 'adm-inventory', label: 'Supply & Inventory Management', route: ADMIN_ROUTES.INVENTORY },
        { id: 'adm-team', label: 'Workforce Administration', route: ADMIN_ROUTES.TEAM },
        { id: 'adm-revenue-cycle', label: 'Revenue Cycle Management', route: ADMIN_ROUTES.BILLING_CYCLE },
        { id: 'adm-settings', label: 'Enterprise Facility Settings', route: ADMIN_ROUTES.FACILITY_SETTINGS },
      ],
      stats: 'Governance',
      glowColor: 'from-slate-600 to-slate-500',
      moduleCode: 'administration',
      category: 'admin',
      allowedCapabilities: ['staff'],
    },
    {
      id: 'platform-admin',
      label: 'Platform Administration',
      icon: <Globe className="w-5 h-5" />,
      href: ROUTES.PLATFORM_ADMINISTRATION,
      route: ROUTES.PLATFORM_ADMINISTRATION,
      description:
        'Global platform settings, system configuration, user management across all facilities',
      stats: 'Platform',
      shortcut: '⌘P',
      glowColor: 'from-slate-600 to-slate-500',
      moduleCode: 'platform_administration',
      category: 'platform',
      allowedCapabilities: ['super_admin'],
    },
    {
      id: 'account',
      label: 'Account',
      icon: <UserCog className="w-5 h-5" />,
      href: ROUTES.ACCOUNT,
      route: ROUTES.ACCOUNT,
      description: 'Manage your profile, security, and preferences',
      operations: [
        { id: 'acc-settings', label: 'Account Center', route: ACCOUNT_ROUTES.SETTINGS_PROFILE },
        { id: 'acc-messages', label: 'Message Center', route: ACCOUNT_ROUTES.MESSAGES },
        { id: 'acc-invitations', label: 'Access & Invitations', route: ACCOUNT_ROUTES.INVITATIONS },
      ],
      stats: 'User Settings',
      glowColor: 'from-emerald-500 to-teal-400',
      moduleCode: 'account',
      category: 'system',
      allowedCapabilities: ['patient', 'staff', 'super_admin'],
    },
  ],
  [],
);

  const currentMenuItems = useMemo(() => {
    if (!activeCapability) return [];

    return menuConfig.filter((item) => {
      if (!item.allowedCapabilities.includes(activeCapability)) return false;

      if (activeCapability === 'staff') {
        if (inStaffMode && activeFacilityId && currentFacilityModules.length > 0) {
          return currentFacilityModules.includes(item.moduleCode);
        }

        return accessibleModuleCodes.includes(item.moduleCode);
      }

      return true;
    });
  }, [
    activeCapability,
    menuConfig,
    inStaffMode,
    activeFacilityId,
    currentFacilityModules,
    accessibleModuleCodes,
  ]);

  const groupedMenuItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    const categoryOrder = ['patient', 'clinical', 'finance', 'admin', 'platform', 'system'];

    categoryOrder.forEach((category) => {
      groups[category] = [];
    });

    currentMenuItems.forEach((item) => {
      const category = item.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });

    const filteredGroups: Record<string, MenuItem[]> = {};
    categoryOrder.forEach((category) => {
      if (groups[category]?.length > 0) {
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

  const normalizePath = useCallback((path: string) => {
    if (!path) return '/';
    const normalized = path.replace(/\/+$/, '');
    return normalized || '/';
  }, []);

  const isRouteActive = useCallback(
    (route: string) => {
      const pathname = normalizePath(location.pathname);
      const target = normalizePath(route);

      if (target === ROUTES.DASHBOARD) {
        return pathname === target;
      }

      if (target === ROUTES.ACCOUNT) {
        return pathname === target || pathname.startsWith(`${target}/`);
      }

      return pathname === target || pathname.startsWith(`${target}/`);
    },
    [location.pathname, normalizePath],
  );

  const activeItemId = useMemo(() => {
    const activeItem = currentMenuItems.find((item) => isRouteActive(item.route));
    return activeItem?.id ?? null;
  }, [currentMenuItems, isRouteActive]);

  const scrollPageContentToTop = useCallback(() => {
    const explicitContainer = document.querySelector<HTMLElement>(CONTENT_SCROLL_SELECTOR);

    if (explicitContainer) {
      explicitContainer.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    const mainContainer = document.querySelector<HTMLElement>('main, [role="main"]');

    if (mainContainer && mainContainer.scrollHeight > mainContainer.clientHeight) {
      mainContainer.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useLayoutEffect(() => {
    const pathnameChanged = previousPathnameRef.current !== location.pathname;
    previousPathnameRef.current = location.pathname;

    if (!pathnameChanged || !activeItemId) return;

    const rafId = window.requestAnimationFrame(() => {
      scrollPageContentToTop();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [location.pathname, activeItemId, scrollPageContentToTop]);

  useEffect(() => {
    if (!activeItemRef.current) return;

    activeItemRef.current.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [activeItemId]);

  const handleNavigation = useCallback(
    (e: React.MouseEvent, route: string) => {
      e.preventDefault();
      navigate(route);

      if (window.innerWidth < 1024) {
        onClose?.();
      }
    },
    [navigate, onClose],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart === null || !isOpen) return;

      const touchEnd = e.touches[0].clientX;
      const diff = touchStart - touchEnd;

      if (diff > 50) {
        onClose?.();
      }
    },
    [touchStart, isOpen, onClose],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const shortcutMap: Record<string, string> = {};

        currentMenuItems.forEach((item, index) => {
          if (index < 9) {
            shortcutMap[(index + 1).toString()] = item.route;
          }
        });

        const route = shortcutMap[e.key];

        if (route) {
          e.preventDefault();
          navigate(route);
        }

        if (e.key.toLowerCase() === 'p' && activeCapability === 'super_admin') {
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

  const contextSubtitle = useMemo(() => {
    if (activeCapability === 'super_admin') return 'Platform Administrator';
    if (activeFacilityName && activeRoleCode) return activeFacilityName;
    return currentCapabilityName;
  }, [activeFacilityName, activeRoleCode, currentCapabilityName, activeCapability]);

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
      <SidebarHeader
        collapsed={collapsed}
        isDark={isDark}
        contextSubtitle={contextSubtitle}
        onClose={onClose}
      />

      <SidebarNavigation
        collapsed={collapsed}
        isDark={isDark}
        groupedMenuItems={groupedMenuItems}
        currentMenuItems={currentMenuItems}
        categoryNames={categoryNames}
        enableNestedNavigation={enableNestedNavigation}
        activeHover={activeHover}
        setActiveHover={setActiveHover}
        isRouteActive={isRouteActive}
        handleNavigation={handleNavigation}
        navContainerRef={navContainerRef}
        activeItemRef={activeItemRef}
      />

      <SidebarFooter
        collapsed={collapsed}
        isDark={isDark}
        displayName={displayName}
        inStaffMode={inStaffMode}
        staffNumber={staffNumber}
        inPatientMode={inPatientMode}
        patientNumber={patientNumber}
      />
    </aside>
  );
};

export default Sidebar;
