// components/statusbar/SearchBar.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Command, Filter, ArrowRight } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { selectAccessibleModuleCodes } from '../../../../app/store/slices/activeContextSlice';
import { useSelector } from 'react-redux';
import { isInPatientMode, getAvailableCapabilities } from '../../../../app/store/utils/contextSelectors';
import { ACCOUNT_ROUTES, ROUTES } from '../../../../app/routes/routeConstants';
import { PLATFORM_ADMIN_ROUTES } from '../../../../app/routes/constants/platform-administration.paths';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
import type { SearchableModule, ThemeMode } from './StatusBarTypes';
import { ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES } from '../../../../app/routes/constants/administration.paths';
import { ADMINISTRATION_FACILITY_SETTINGS_ROUTES } from '../../../../app/routes/constants/administration.paths';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../app/routes/constants/administration.paths';
import { ADMIN_ROUTES } from '../../../../app/routes/constants/administration.paths';

interface SearchBarProps {
  searchQuery: string;
  isSearchFocused: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  theme: ThemeMode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onClearSearch,
  searchInputRef,
  theme,
}) => {
  const navigate = useNavigate();
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchableModule[]>([]);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Redux state for accessible modules
  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const inPatientMode = useSelector(isInPatientMode);
  const availableCapabilities = useSelector(getAvailableCapabilities);

  // Patient accessible modules
  const accessiblePatientModuleCodes = useMemo(
    () => ['patient_dashboard', 'account'],
    []
  );

  // Define all searchable modules including Spatie roles
// Define all searchable modules
const allModules: SearchableModule[] = useMemo(() => [
  // ============================================================================
  // PATIENT PORTAL
  // ============================================================================
  {
    id: 'patient-dashboard',
    label: 'My Health',
    route: ROUTES.PATIENT_DASHBOARD,
    description: 'Personal health overview',
    moduleCode: 'patient_dashboard',
    keywords: ['health', 'patient', 'dashboard', 'overview', 'personal'],
    category: 'Patient Portal',
  },

  // ============================================================================
  // STAFF PORTAL
  // ============================================================================
  {
    id: 'staff-dashboard',
    label: 'Staff Portal',
    route: ROUTES.STAFF_DASHBOARD,
    description: 'Staff workspace',
    moduleCode: 'staff_dashboard',
    keywords: ['staff', 'portal', 'dashboard', 'workspace', 'employee'],
    category: 'Administration',
  },

  // ============================================================================
  // CLINICAL MODULES
  // ============================================================================
  
  // Front Desk / Medical Records
  {
    id: 'medical-records',
    label: 'Front Desk',
    route: ROUTES.MEDICAL_RECORDS,
    description: 'Medical Records & Patient Registration',
    moduleCode: 'medical_records',
    keywords: ['front desk', 'reception', 'records', 'medical', 'registration', 'patient intake'],
    category: 'Clinical',
  },
  {
    id: 'patient-search',
    label: 'Search Patient',
    route: MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH,
    description: 'Search and find patient records',
    moduleCode: 'medical_records',
    keywords: ['search', 'find', 'patient', 'records', 'lookup'],
    category: 'Clinical',
  },
  {
    id: 'new-patient',
    label: 'New Patient Registration',
    route: MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER,
    description: 'Register a new patient',
    moduleCode: 'medical_records',
    keywords: ['new', 'register', 'create', 'patient', 'enroll'],
    category: 'Clinical',
  },
  {
    id: 'patient-queue',
    label: 'Patient Queue',
    route: MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE,
    description: 'Manage patient waiting queue',
    moduleCode: 'medical_records',
    keywords: ['queue', 'waiting', 'line', 'patients', 'triage'],
    category: 'Clinical',
  },
  {
    id: 'walk-in-patient',
    label: 'Walk-In Patient',
    route: MEDICAL_RECORDS_ROUTES.WALKIN_PATIENT,
    description: 'Process walk-in patient registration',
    moduleCode: 'medical_records',
    keywords: ['walk-in', 'urgent', 'unscheduled', 'drop-in'],
    category: 'Clinical',
  },
  {
    id: 'get-complaints',
    label: 'Get Complaints',
    route: MEDICAL_RECORDS_ROUTES.GET_COMPLAINTS,
    description: 'Record patient complaints and symptoms',
    moduleCode: 'medical_records',
    keywords: ['complaints', 'symptoms', 'issues', 'problems', 'chief complaint'],
    category: 'Clinical',
  },
  {
    id: 'forward-patient',
    label: 'Forward Patient',
    route: MEDICAL_RECORDS_ROUTES.FORWARD_PATIENT,
    description: 'Forward patient to another department',
    moduleCode: 'medical_records',
    keywords: ['forward', 'transfer', 'refer', 'department', 'specialist'],
    category: 'Clinical',
  },
  {
    id: 'patient-billing-space',
    label: 'Patient Billing Space',
    route: MEDICAL_RECORDS_ROUTES.PATIENT_BILLING_SPACE,
    description: 'View patient billing and payment information',
    moduleCode: 'medical_records',
    keywords: ['billing', 'payment', 'invoice', 'charges', 'patient billing'],
    category: 'Clinical',
  },
  {
    id: 'visit-status',
    label: 'Visit Status',
    route: MEDICAL_RECORDS_ROUTES.VISIT_STATUS,
    description: 'Track and update patient visit status',
    moduleCode: 'medical_records',
    keywords: ['visit', 'status', 'tracking', 'encounter', 'appointment'],
    category: 'Clinical',
  },

  // Nursing Care
  {
    id: 'nursing-care',
    label: 'Nursing Care',
    route: ROUTES.NURSING,
    description: 'Vitals & ward care',
    moduleCode: 'nursing',
    keywords: ['nursing', 'vitals', 'ward', 'care', 'nurse'],
    category: 'Clinical',
  },

  // Clinical Workspace
  {
    id: 'clinical',
    label: 'Clinical Workspace',
    route: ROUTES.CLINICAL,
    description: 'Doctor Consultation & diagnosis',
    moduleCode: 'clinical',
    keywords: ['clinical', 'doctor', 'consultation', 'diagnosis', 'physician'],
    category: 'Clinical',
  },

  // Laboratory
  {
    id: 'laboratory',
    label: 'Laboratory',
    route: ROUTES.LABORATORY,
    description: 'Lab tests, results & specimens',
    moduleCode: 'laboratory',
    keywords: ['lab', 'laboratory', 'tests', 'results', 'specimens', 'pathology'],
    category: 'Clinical',
  },

  // Pharmacy
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    route: ROUTES.PHARMACY,
    description: 'Medication dispensing',
    moduleCode: 'pharmacy',
    keywords: ['pharmacy', 'medication', 'drugs', 'dispensing', 'prescriptions'],
    category: 'Clinical',
  },

  // ============================================================================
  // FINANCE MODULE
  // ============================================================================
  {
    id: 'billing',
    label: 'Billing & Finance',
    route: ROUTES.BILLING,
    description: 'Invoices & payments',
    moduleCode: 'billing',
    keywords: ['billing', 'finance', 'invoices', 'payments', 'accounts'],
    category: 'Finance',
  },

  // ============================================================================
  // ADMINISTRATION MODULES
  // ============================================================================
  
  // Facility Governance (Main Admin)
  {
    id: 'administration',
    label: 'Facility Governance',
    route: ROUTES.ADMINISTRATION,
    description: 'Configure facilities, manage workforce access, services, and operational controls',
    moduleCode: 'administration',
    keywords: ['admin', 'administration', 'governance', 'facilities', 'management', 'settings'],
    category: 'Administration',
  },

  // Clinical Space Management
  {
    id: 'clinical-rooms',
    label: 'Clinical Rooms',
    route: ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.CLINICAL_ROOMS,
    description: 'Manage clinical rooms and spaces',
    moduleCode: 'administration',
    keywords: ['rooms', 'clinical', 'space', 'facility', 'consultation'],
    category: 'Administration',
  },
  {
    id: 'ward-management',
    label: 'Ward Management',
    route: ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.WARD_MANAGEMENT,
    description: 'Manage hospital wards and bed allocation',
    moduleCode: 'administration',
    keywords: ['ward', 'beds', 'inpatient', 'unit', 'nursing unit'],
    category: 'Administration',
  },
  {
    id: 'facility-zones',
    label: 'Facility Zones',
    route: ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.FACILITY_ZONES,
    description: 'Define and manage facility zones',
    moduleCode: 'administration',
    keywords: ['zones', 'areas', 'sections', 'departments', 'facility layout'],
    category: 'Administration',
  },
  {
    id: 'space-allocation',
    label: 'Space Allocation',
    route: ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.SPACE_ALLOCATION,
    description: 'Allocate staff to spaces and rooms',
    moduleCode: 'administration',
    keywords: ['allocation', 'assignment', 'staff', 'space', 'room assignment'],
    category: 'Administration',
  },

  // Facility Settings
  {
    id: 'facility-identity',
    label: 'Facility Identity',
    route: ADMINISTRATION_FACILITY_SETTINGS_ROUTES.FACILITY_IDENTITY,
    description: 'Manage facility profile and branding',
    moduleCode: 'administration',
    keywords: ['identity', 'profile', 'branding', 'facility info', 'details'],
    category: 'Administration',
  },
  {
    id: 'operational-policies',
    label: 'Operational Policies',
    route: ADMINISTRATION_FACILITY_SETTINGS_ROUTES.OPERATIONAL_POLICIES,
    description: 'Configure facility operational policies',
    moduleCode: 'administration',
    keywords: ['policies', 'rules', 'guidelines', 'procedures', 'operations'],
    category: 'Administration',
  },

  // Plans & Subscriptions
  {
    id: 'available-plans',
    label: 'Available Plans',
    route: ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS,
    description: 'Browse and manage available subscription plans',
    moduleCode: 'administration',
    keywords: ['plans', 'subscriptions', 'pricing', 'tiers', 'packages'],
    category: 'Administration',
  },
  {
    id: 'facility-subscriptions',
    label: 'Facility Subscriptions',
    route: ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS,
    description: 'Manage facility subscriptions',
    moduleCode: 'administration',
    keywords: ['subscriptions', 'facility', 'plans', 'enrollment'],
    category: 'Administration',
  },
  {
    id: 'payments',
    label: 'Payments',
    route: ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS,
    description: 'Manage payment methods and history',
    moduleCode: 'administration',
    keywords: ['payments', 'billing', 'credit card', 'payment method'],
    category: 'Administration',
  },

  // ============================================================================
  // PLATFORM ADMINISTRATION (Super Admin Only)
  // ============================================================================
  {
    id: 'platform-admin-facilities',
    label: 'Platform Administration - Facilities',
    route: PLATFORM_ADMIN_ROUTES.FACILITIES,
    description: 'Manage all facilities across the platform',
    moduleCode: 'platform_administration',
    keywords: ['platform', 'admin', 'facilities', 'global', 'system', 'management'],
    category: 'Platform Administration',
    requiredCapability: 'super_admin',
  },
  {
    id: 'platform-admin-users',
    label: 'Platform Administration - Users',
    route: PLATFORM_ADMIN_ROUTES.USERS,
    description: 'Manage all users across the platform',
    moduleCode: 'platform_administration',
    keywords: ['platform', 'admin', 'users', 'global', 'accounts', 'management'],
    category: 'Platform Administration',
    requiredCapability: 'super_admin',
  },
  {
    id: 'platform-admin-plans',
    label: 'Platform Plans & Subscriptions',
    route: PLATFORM_ADMIN_ROUTES.FACILITIES_PLANS,
    description: 'Manage global subscription plans and pricing',
    moduleCode: 'platform_administration',
    keywords: ['platform', 'plans', 'subscriptions', 'global', 'pricing'],
    category: 'Platform Administration',
    requiredCapability: 'super_admin',
  },

  // ============================================================================
  // ACCOUNT MODULES (Always Accessible)
  // ============================================================================
  
  // Account Settings
  {
    id: 'account-profile',
    label: 'My Profile',
    route: ACCOUNT_ROUTES.SETTINGS_PROFILE,
    description: 'Maintain and update your account identity information',
    moduleCode: 'account',
    keywords: ['profile', 'personal', 'information', 'details', 'name', 'contact'],
    category: 'Account',
  },
  {
    id: 'account-security',
    label: 'Account Security',
    route: ACCOUNT_ROUTES.SETTINGS_SECURITY,
    description: 'Configure password policies and multi-factor authentication',
    moduleCode: 'account',
    keywords: ['security', 'password', 'mfa', 'authentication', 'login', '2fa'],
    category: 'Account',
  },
  {
    id: 'account-preferences',
    label: 'User Preferences',
    route: ACCOUNT_ROUTES.SETTINGS_PREFERENCES,
    description: 'Customize interface behavior and system experience',
    moduleCode: 'account',
    keywords: ['preferences', 'settings', 'theme', 'language', 'notifications'],
    category: 'Account',
  },
  {
    id: 'account-invitations',
    label: 'Invitations',
    route: ACCOUNT_ROUTES.INVITATIONS,
    description: 'Manage facility and team invitations',
    moduleCode: 'account',
    keywords: ['invitations', 'facility', 'team', 'join', 'access', 'invites'],
    category: 'Account',
  },

  // Message Center
  {
    id: 'message-center',
    label: 'Message Center',
    route: ACCOUNT_ROUTES.MESSAGES,
    description: 'Inbox and message center',
    moduleCode: 'account',
    keywords: ['messages', 'inbox', 'communication', 'notifications', 'chat'],
    category: 'Account',
  },
  {
    id: 'compose-message',
    label: 'Compose Message',
    route: ACCOUNT_ROUTES.MESSAGES_COMPOSE,
    description: 'Write and send new messages',
    moduleCode: 'account',
    keywords: ['compose', 'write', 'send', 'new message', 'email'],
    category: 'Account',
  },
  {
    id: 'message-inbox',
    label: 'Message Inbox',
    route: ACCOUNT_ROUTES.MESSAGES_INBOX,
    description: 'View received messages',
    moduleCode: 'account',
    keywords: ['inbox', 'received', 'messages', 'unread'],
    category: 'Account',
  },
  {
    id: 'sent-messages',
    label: 'Sent Messages',
    route: ACCOUNT_ROUTES.MESSAGES_SENT,
    description: 'View sent messages',
    moduleCode: 'account',
    keywords: ['sent', 'outbox', 'sent items'],
    category: 'Account',
  },
  {
    id: 'draft-messages',
    label: 'Draft Messages',
    route: ACCOUNT_ROUTES.MESSAGES_DRAFT,
    description: 'View and edit draft messages',
    moduleCode: 'account',
    keywords: ['draft', 'unsent', 'saved'],
    category: 'Account',
  },
  {
    id: 'trash-messages',
    label: 'Trash',
    route: ACCOUNT_ROUTES.MESSAGES_TRASH,
    description: 'View deleted messages',
    moduleCode: 'account',
    keywords: ['trash', 'deleted', 'bin', 'recycle'],
    category: 'Account',
  },
  
// ============================================================================
// ADMINISTRATION MODULES (continued)
// ============================================================================

// Admin Overview
{
  id: 'admin-overview',
  label: 'Command Center',
  route: ADMIN_ROUTES.OVERVIEW,
  description: 'Administrative overview and setup status dashboard',
  moduleCode: 'administration',
  keywords: ['overview', 'dashboard', 'command center', 'stats', 'metrics', 'setup'],
  category: 'Administration',
},

// Team Management
{
  id: 'admin-team',
  label: 'Workforce Administration',
  route: ADMIN_ROUTES.TEAM,
  description: 'Manage staff, invitations, roles, and team members',
  moduleCode: 'administration',
  keywords: ['team', 'staff', 'employees', 'workforce', 'invitations', 'roles', 'permissions'],
  category: 'Administration',
},

// Facility Setup
{
  id: 'admin-facility-setup',
  label: 'Clinical Departments',
  route: ADMIN_ROUTES.FACILITY_SETUP,
  description: 'Configure departments and facility structure',
  moduleCode: 'administration',
  keywords: ['facility', 'departments', 'structure', 'organization', 'clinical departments'],
  category: 'Administration',
},

// Service Catalog
{
  id: 'admin-service-catalog',
  label: 'Clinical & Billing Services',
  route: ADMIN_ROUTES.SERVICE_CATALOG,
  description: 'Manage services, procedures, and pricing versions',
  moduleCode: 'administration',
  keywords: ['services', 'catalog', 'pricing', 'procedures', 'billing services', 'clinical services'],
  category: 'Administration',
},

// Inventory Management
{
  id: 'admin-inventory',
  label: 'Supply & Inventory Management',
  route: ADMIN_ROUTES.INVENTORY,
  description: 'Manage stock items, locations, and inventory controls',
  moduleCode: 'administration',
  keywords: ['inventory', 'supplies', 'stock', 'items', 'locations', 'warehouse'],
  category: 'Administration',
},
], []);
  // Filter accessible modules based on user's permissions
  const accessibleModules = useMemo(() => {
    if (inPatientMode) {
      // Patient mode: only patient dashboard and account
      return allModules.filter(module => {
        if (module.moduleCode === 'account') return true;
        return accessiblePatientModuleCodes.includes(module.moduleCode);
      });
    } else {
      // Staff or Spatie role mode
      return allModules.filter(module => {
        // Account module is always accessible
        if (module.moduleCode === 'account') return true;
        
        // Check if module requires a specific capability
        if (module.requiredCapability) {
          // Only show if user has that capability AND the module code is accessible
          return availableCapabilities.includes(module.requiredCapability) && 
                 accessibleModuleCodes.includes(module.moduleCode);
        }
        
        // Regular modules: check if accessible via module codes
        return accessibleModuleCodes.includes(module.moduleCode);
      });
    }
  }, [allModules, accessibleModuleCodes, accessiblePatientModuleCodes, inPatientMode, availableCapabilities]);

  // Comprehensive search filtering with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const term = searchQuery.trim().toLowerCase();
      
      if (!term) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const results = accessibleModules.filter((module) => {
        const searchableText = [
          module.label,
          module.description,
          module.category,
          ...module.keywords
        ].join(' ').toLowerCase();

        return searchableText.includes(term);
      }).slice(0, 8);

      setSearchResults(results);
      setShowSearchResults(true);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, accessibleModules]);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [searchInputRef]);

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
    onClearSearch();
    setShowSearchResults(false);
    searchInputRef.current?.blur();
  }, [navigate, onClearSearch, searchInputRef]);

  return (
    <div className="flex-1 max-w-lg mx-2 sm:mx-3" ref={searchWrapRef}>
      <div className="relative group">
        <Search
          className={cn(
            'absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
            'transition-all duration-300 ease-in-out',
            isSearchFocused
              ? theme === 'dark'
                ? 'text-cyan-400 scale-110'
                : 'text-blue-500 scale-110'
              : theme === 'dark'
                ? 'text-gray-500'
                : 'text-gray-400'
          )}
        />

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          onFocus={() => {
            onSearchFocus();
            if (searchQuery.trim()) setShowSearchResults(true);
          }}
          onBlur={onSearchBlur}
          placeholder="Search for anything you need..."
          aria-label="Global module search"
          className={cn(
            'w-full pl-9 pr-16 sm:pr-20 py-1.5 rounded-lg text-sm',
            'border transition-all duration-300 ease-in-out',
            'focus:outline-none focus:ring-2',
            theme === 'dark'
              ? 'bg-gray-800/50 border-gray-700/50 text-gray-100 placeholder-gray-500 focus:border-cyan-500/40 focus:ring-cyan-500/20'
              : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/40 focus:ring-blue-500/20'
          )}
        />

        {searchQuery ? (
          <button
            onClick={onClearSearch}
            aria-label="Clear search"
            className={cn(
              'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded',
              'transition-all duration-200 hover:scale-110 active:scale-95',
              'cursor-pointer',
              theme === 'dark' ? 'hover:bg-gray-700/50 text-gray-400' : 'hover:bg-gray-200/50 text-gray-600'
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div
            className={cn(
              'absolute right-2.5 top-1/2 -translate-y-1/2 hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
              'transition-all duration-200',
              theme === 'dark'
                ? 'bg-gray-800/40 border border-gray-700/50 text-gray-500'
                : 'bg-gray-100/40 border border-gray-300/50 text-gray-600'
            )}
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        )}

        {/* SEARCH RESULTS DROPDOWN */}
        {showSearchResults && (
          <div 
            className={cn(
              'absolute z-[60] mt-2 rounded-lg shadow-xl border backdrop-blur-sm',
              'transition-all duration-200',
              'left-0 right-0',
              'mx-auto',
              'w-full',
              'max-h-[70vh] sm:max-h-96 overflow-y-auto',
              theme === 'dark'
                ? 'bg-gray-900/98 border-gray-700/50'
                : 'bg-white/98 border-gray-200/50'
            )}
            style={{
              maxWidth: 'min(100%, 500px)',
            }}
          >
            {searchResults.length > 0 ? (
              <div className="divide-y divide-gray-800/20 dark:divide-gray-700/30">
                {searchResults.map((module, index) => (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => handleNavigate(module.route)}
                    className={cn(
                      'w-full text-left p-4 sm:p-4 transition-all duration-150 cursor-pointer',
                      'hover:bg-opacity-80 active:bg-opacity-90',
                      theme === 'dark'
                        ? 'hover:bg-gray-800/60 active:bg-gray-800/80'
                        : 'hover:bg-gray-50/80 active:bg-gray-100',
                      index === 0 && 'rounded-t-lg',
                      index === searchResults.length - 1 && 'rounded-b-lg'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-1.5">
                          <span
                            className={cn(
                              'font-semibold text-sm sm:text-base truncate',
                              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                            )}
                          >
                            {module.label}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full inline-flex items-center justify-center',
                              'w-fit',
                              theme === 'dark'
                                ? module.category === 'Platform Administration'
                                  ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30'
                                  : 'bg-blue-900/30 text-blue-300 border border-blue-700/30'
                                : module.category === 'Platform Administration'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200/50'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                            )}
                          >
                            {module.category}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-xs sm:text-sm leading-relaxed line-clamp-2',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}
                        >
                          {module.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'p-1.5 sm:p-2 rounded-lg flex-shrink-0 self-center',
                          'transition-transform group-hover:translate-x-1',
                          theme === 'dark'
                            ? 'bg-cyan-900/20 text-cyan-400'
                            : 'bg-blue-50 text-blue-600'
                        )}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center">
                <div
                  className={cn(
                    'inline-flex p-3 sm:p-4 rounded-full mb-3 mx-auto',
                    theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                  )}
                >
                  <Filter
                    className={cn(
                      'w-5 h-5 sm:w-6 sm:h-6',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}
                  />
                </div>
                <p
                  className={cn(
                    'font-semibold text-sm sm:text-base mb-1',
                    theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                  )}
                >
                  No results found
                </p>
                <p
                  className={cn(
                    'text-xs sm:text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  Try different keywords
                </p>
                <p
                  className={cn(
                    'text-xs mt-2',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  )}
                >
                  Search by name, category, or functionality
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};