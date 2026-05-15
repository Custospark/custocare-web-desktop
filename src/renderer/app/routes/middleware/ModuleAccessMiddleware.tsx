/**
 * ============================================================================
 * MODULE ACCESS MIDDLEWARE COMPONENT
 * ============================================================================
 * 
 * Middleware component that validates user access to module routes based on
 * their assigned module permissions. Prevents unauthorized access to restricted
 * modules and displays appropriate error messages.
 * 
 * Features:
 * - Comprehensive module access validation
 * - Patient mode handling with safe redirects
 * - No infinite loops with proper state management
 * - Theme-aware UI components
 * - Support for both BrowserRouter and HashRouter
 * - Clean access denied screens with reference codes
 * - ✅ COMPLETELY BYPASSED for account routes
 * - ✅ Supports all Spatie roles via backend module assignments
 * 
 * @component ModuleAccessMiddleware
 */

import React, { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, Lock } from 'lucide-react';
import type { RootState } from '../../store/store';
import { selectAccessibleModuleCodes } from '../../store/slices/activeContextSlice';
import { ROUTES } from './../routeConstants';
import { PLATFORM_ADMIN_ROUTES } from './../constants/platform-administration.paths';
import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';
import { isInPatientMode } from '../../store/utils/contextSelectors';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Configuration for mapping routes to required module codes
 */
interface ModuleAccessConfig {
  route: string;           // The route path
  moduleCode: string;      // The module code required for access
  displayName: string;     // Human-readable module name for display
}

/**
 * Result of route access analysis
 */
interface RouteAccessCheck {
  requiresValidation: boolean;        // Whether this route needs validation
  requiredModuleCode: string | null;  // The module code required (if any)
  moduleName: string;                 // Display name of the module
  isRestricted: boolean;              // Whether this is a restricted route
  isAccountRoute: boolean;            // Whether this is an account route
  isPlatformAdminRoute: boolean;      // Whether this is a platform admin route
}

/**
 * Current access state of the middleware
 */
interface AccessState {
  status: 'checking' | 'granted' | 'denied' | 'redirecting' | 'bypassed';
  message?: string;
  redirectTo?: string;
}

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

/**
 * Configuration mapping for routes to module codes
 * Defines which module is required for each protected route
 */
const MODULE_ACCESS_CONFIG: readonly ModuleAccessConfig[] = [
  // Clinical/Staff routes
  { route: ROUTES.MEDICAL_RECORDS, moduleCode: 'medical_records', displayName: 'Medical Records' },
  { route: ROUTES.CLINICAL, moduleCode: 'clinical', displayName: 'Clinical' },
  { route: ROUTES.NURSING, moduleCode: 'nursing', displayName: 'Nursing' },
  { route: ROUTES.LABORATORY, moduleCode: 'laboratory', displayName: 'Laboratory' },
  { route: ROUTES.PHARMACY, moduleCode: 'pharmacy', displayName: 'Pharmacy' },
  { route: ROUTES.AMBULANCE, moduleCode: 'ambulance', displayName: 'Ambulance Services' },
  { route: ROUTES.BILLING, moduleCode: 'billing', displayName: 'Billing' },
  { route: ROUTES.ADMINISTRATION, moduleCode: 'administration', displayName: 'Administration' },
  
  // Patient routes
  { route: ROUTES.PATIENT_DASHBOARD, moduleCode: 'patient_dashboard', displayName: 'Patient Dashboard' },
  
  // Platform Administration routes (for super_admin)
  { route: PLATFORM_ADMIN_ROUTES.FACILITIES, moduleCode: 'platform_administration', displayName: 'Platform Administration' },
  { route: PLATFORM_ADMIN_ROUTES.USERS, moduleCode: 'platform_administration', displayName: 'Platform Administration' },
  
  // Account route (always accessible - included for reference)
  { route: ROUTES.ACCOUNT, moduleCode: 'account', displayName: 'Account' },
] as const;

/**
 * Routes that are always accessible regardless of permissions
 * These routes don't require module validation
 */
const UNRESTRICTED_ROUTES: readonly string[] = [
  ROUTES.DASHBOARD,
  ROUTES.ACCOUNT,
  ROUTES.PATIENT_DASHBOARD,
  ROUTES.CUSTOCARE_HUB,
  '/onboarding',
  '/settings',
  '/profile',
  '/auth',
  '/login',
  '/logout',
  '/error',
  '/404',
] as const;

/**
 * Routes that COMPLETELY bypass middleware (immediate render)
 * These routes skip all validation checks for performance
 */
const BYPASS_ROUTES: readonly string[] = [
  ROUTES.ACCOUNT,
  '/auth',
  '/login',
  '/logout',
  '/error',
  '/404',
] as const;

/**
 * Routes accessible in patient mode
 * Patient users can only access these specific routes
 */
const PATIENT_ACCESSIBLE_ROUTES: readonly string[] = [
  ROUTES.PATIENT_DASHBOARD,
  ROUTES.ACCOUNT,
  ROUTES.CUSTOCARE_HUB,
  '/settings',
  '/profile',
  '/patient',
] as const;

// Create lookup maps for efficient access
const ROUTE_TO_MODULE_MAP = MODULE_ACCESS_CONFIG.reduce(
  (acc, config) => {
    acc[config.route] = config.moduleCode;
    return acc;
  },
  {} as Record<string, string>
);

const MODULE_CODE_TO_DISPLAY_NAME = MODULE_ACCESS_CONFIG.reduce(
  (acc, config) => {
    acc[config.moduleCode] = config.displayName;
    return acc;
  },
  {} as Record<string, string>
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalizes pathname for consistent comparison
 * Handles both BrowserRouter and HashRouter formats
 * 
 * @param pathname - The raw pathname from location
 * @returns Normalized path string
 */
const normalizePath = (pathname: string): string => {
  // Remove hash prefix if present (for HashRouter support)
  let normalized = pathname.startsWith('#') ? pathname.substring(1) : pathname;
  
  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  
  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
};

/**
 * Extracts the base path from a given pathname
 * Used for matching parent routes to their children
 * 
 * @param pathname - The normalized pathname
 * @returns The base path (first segment or first two for platform admin)
 */
const extractBasePath = (pathname: string): string => {
  const normalized = normalizePath(pathname);
  const segments = normalized.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return '/';
  }
  
  // For platform admin routes, we want the first two segments
  // e.g., /platform-admin/facilities/* -> /platform-admin/facilities
  if (segments[0] === 'platform-admin' && segments.length > 1) {
    return `/${segments[0]}/${segments[1]}`;
  }
  
  // For other routes, just the first segment
  // e.g., /clinical/* -> /clinical
  return `/${segments[0]}`;
};

/**
 * Checks if a path is a platform admin route
 * 
 * @param pathname - The pathname to check
 * @returns True if the path is under /platform-admin
 */
const checkIsPlatformAdminRoute = (pathname: string): boolean => {
  const normalized = normalizePath(pathname);
  return normalized.startsWith('/platform-admin');
};

/**
 * Checks if a path should completely bypass middleware
 * 
 * @param pathname - The pathname to check
 * @returns True if the path should bypass all validation
 */
const shouldBypassMiddleware = (pathname: string): boolean => {
  const normalized = normalizePath(pathname);
  const basePath = extractBasePath(normalized);
  
  return BYPASS_ROUTES.some(route => {
    const normalizedRoute = normalizePath(route);
    return normalized === normalizedRoute || 
           normalized.startsWith(`${normalizedRoute}/`) ||
           basePath === normalizedRoute;
  });
};

/**
 * Checks if a path is unrestricted (always accessible)
 * 
 * @param pathname - The pathname to check
 * @returns True if the path doesn't require module validation
 */
const isUnrestrictedRoute = (pathname: string): boolean => {
  const normalized = normalizePath(pathname);
  const basePath = extractBasePath(normalized);
  
  return UNRESTRICTED_ROUTES.some(route => {
    const normalizedRoute = normalizePath(route);
    return normalized === normalizedRoute || 
           normalized.startsWith(`${normalizedRoute}/`) ||
           basePath === normalizedRoute;
  });
};

/**
 * Checks if a route is accessible in patient mode
 * 
 * @param pathname - The pathname to check
 * @returns True if the route is whitelisted for patient access
 */
const isPatientAccessibleRoute = (pathname: string): boolean => {
  const normalized = normalizePath(pathname);
  
  return PATIENT_ACCESSIBLE_ROUTES.some(route => {
    const normalizedRoute = normalizePath(route);
    return normalized === normalizedRoute || 
           normalized.startsWith(`${normalizedRoute}/`);
  });
};

/**
 * Gets the required module code for a path
 * 
 * @param pathname - The pathname to check
 * @returns The module code required, or null if none
 */
const getRequiredModuleCode = (pathname: string): string | null => {
  const normalized = normalizePath(pathname);
  const basePath = extractBasePath(normalized);
  
  // Platform admin routes require platform_administration module
  if (checkIsPlatformAdminRoute(normalized)) {
    return 'platform_administration';
  }
  
  // Check for exact route match
  if (ROUTE_TO_MODULE_MAP[normalized]) {
    return ROUTE_TO_MODULE_MAP[normalized];
  }
  
  // Check for base path match
  if (ROUTE_TO_MODULE_MAP[basePath]) {
    return ROUTE_TO_MODULE_MAP[basePath];
  }
  
  // Check if any configured route is a prefix of the current path
  for (const route of Object.keys(ROUTE_TO_MODULE_MAP)) {
    if (normalized.startsWith(route) && route !== '/') {
      return ROUTE_TO_MODULE_MAP[route];
    }
  }
  
  return null;
};

/**
 * Gets display name for a module
 * 
 * @param moduleCode - The module code to get the display name for
 * @returns Human-readable module name
 */
const getModuleDisplayName = (moduleCode: string | null): string => {
  if (!moduleCode) {
    return 'Unknown Module';
  }
  
  if (MODULE_CODE_TO_DISPLAY_NAME[moduleCode]) {
    return MODULE_CODE_TO_DISPLAY_NAME[moduleCode];
  }
  
  // Special handling for platform admin
  if (moduleCode === 'platform_administration') {
    return 'Platform Administration';
  }
  
  // Fallback: format the module code
  return formatModuleName(moduleCode);
};

/**
 * Analyzes route access requirements
 * 
 * @param pathname - The pathname to analyze
 * @param activeCapability - The user's active capability
 * @returns Detailed route access information
 */
const analyzeRouteAccess = (pathname: string): RouteAccessCheck => {
  const normalized = normalizePath(pathname);
  const basePath = extractBasePath(normalized);
  
  // Check if this is an account route
  const isAccountRoute = basePath === ROUTES.ACCOUNT || normalized.startsWith(`${ROUTES.ACCOUNT}/`);
  
  // Check if this is a platform admin route
  const isPlatformAdminRoute = checkIsPlatformAdminRoute(normalized);
  
  // If it's a bypass route, return early with no validation needed
  if (shouldBypassMiddleware(normalized)) {
    return {
      requiresValidation: false,
      requiredModuleCode: null,
      moduleName: '',
      isRestricted: false,
      isAccountRoute,
      isPlatformAdminRoute,
    };
  }
  
  // If it's an unrestricted route, no validation needed
  if (isUnrestrictedRoute(normalized)) {
    return {
      requiresValidation: false,
      requiredModuleCode: null,
      moduleName: '',
      isRestricted: false,
      isAccountRoute,
      isPlatformAdminRoute,
    };
  }
  
  const requiredModuleCode = getRequiredModuleCode(normalized);
  const moduleName = getModuleDisplayName(requiredModuleCode);
  
  return {
    requiresValidation: true,
    requiredModuleCode,
    moduleName,
    isRestricted: requiredModuleCode !== null,
    isAccountRoute,
    isPlatformAdminRoute,
  };
};

/**
 * Formats module code into display name
 * 
 * @param moduleCode - The module code to format
 * @returns Formatted display name
 */
const formatModuleName = (moduleCode: string): string => {
  return moduleCode
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Validates user access to a module
 * 
 * @param accessibleModuleCodes - Array of module codes the user has access to
 * @param requiredModuleCode - The module code required for the route
 * @param isPlatformAdminRoute - Whether this is a platform admin route
 * @returns True if user has access, false otherwise
 */
const validateModuleAccess = (
  accessibleModuleCodes: string[],
  requiredModuleCode: string | null,
  isPlatformAdminRoute: boolean,
): boolean => {
  // No module required -> always accessible
  if (!requiredModuleCode) {
    return true;
  }
  
  // Account module is always accessible to everyone
  if (requiredModuleCode === 'account') {
    return true;
  }
  
  // Platform admin routes require the platform_administration module
  if (isPlatformAdminRoute) {
    return accessibleModuleCodes.includes('platform_administration');
  }
  
  // For all other routes, check if user has the required module
  // This works for staff, patient, and all Spatie roles
  return accessibleModuleCodes.includes(requiredModuleCode);
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

/**
 * Access Denied Screen Component
 * Displays a user-friendly message when access is denied
 */
interface AccessDeniedProps {
  theme: 'light' | 'dark';
  moduleName: string;
  onNavigateHome: () => void;
  isPatientMode: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  theme,
  moduleName,
  onNavigateHome,
  isPatientMode,
}) => {
  const isDark = theme === 'dark';
  const dashboardName = isPatientMode ? 'Patient Dashboard' : 'Dashboard';
  
  // Generate reference code for support
  const referenceCode = `MOD_ACCESS_${moduleName.toUpperCase().replace(/\s+/g, '_')}`;
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
      isDark ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in ${
        isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        {/* Lock Icon */}
        <div className="flex justify-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isDark ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <Lock className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
        </div>
        
        {/* Heading */}
        <div className="text-center space-y-3">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Access Denied
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {moduleName}
          </p>
        </div>
        
        {/* Message */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div className="space-y-2">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                You don't have permission to access this resource
              </p>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                If you believe this is a mistake, please contact the support team.
              </p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onNavigateHome}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all cursor-pointer
              ${isDark 
                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
              }`}
            type="button"
            autoFocus
          >
            <Home className="w-4 h-4" />
            Go to {dashboardName}
          </button>
          
          <div className="flex gap-3">
            <a
              href="mailto:support@custospark.com"
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-center transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              Contact Support
            </a>
            <button
              onClick={() => window.location.reload()}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
              type="button"
            >
              Refresh Page
            </button>
          </div>
        </div>
        
        {/* Footer with Reference Code */}
        <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Reference: {referenceCode}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Module Access Middleware
 * 
 * Protects routes by validating user's module permissions.
 * Redirects patient users away from staff routes.
 * Shows access denied screen for unauthorized access attempts.
 */
export const ModuleAccessMiddleware: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Redux state
  const theme = useSelector((state: RootState) => state.ui.theme);
  const accessibleModuleCodes = useSelector(selectAccessibleModuleCodes);
  const isPatientMode = useSelector(isInPatientMode);
  
  // Local state
  const [accessState, setAccessState] = useState<AccessState>({ status: 'checking' });
  
  // Refs for values that don't need to trigger re-renders
  const lastCheckedPathRef = useRef<string>('');
  const isRedirectingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Memoized derived values
  const currentPath = useMemo(() => {
    const path = location.hash ? location.hash.substring(1) : location.pathname;
    return normalizePath(path);
  }, [location]);
  
  const routeAnalysis = useMemo(
    () => analyzeRouteAccess(currentPath),
    [currentPath]
  );
  
  const hasModuleAccess = useMemo(() => {
    if (!routeAnalysis.requiresValidation || !routeAnalysis.requiredModuleCode) {
      return true;
    }
    return validateModuleAccess(
      accessibleModuleCodes, 
      routeAnalysis.requiredModuleCode, 
      routeAnalysis.isPlatformAdminRoute
    );
  }, [routeAnalysis, accessibleModuleCodes]);
  
  // Check if this route should bypass middleware entirely
  const shouldBypass = useMemo(() => {
    return shouldBypassMiddleware(currentPath);
  }, [currentPath]);
  
  // Handle navigation to dashboard
  const handleNavigateHome = useCallback(() => {
    const targetRoute = isPatientMode ? ROUTES.PATIENT_DASHBOARD : ROUTES.DASHBOARD;
    navigate(targetRoute, { replace: true });
  }, [navigate, isPatientMode]);
  
  // Main access validation logic
  const performAccessCheck = useCallback(() => {
    // Skip if we already checked this path
    if (currentPath === lastCheckedPathRef.current) {
      return;
    }
    
    // Update ref without causing re-render
    lastCheckedPathRef.current = currentPath;
    
    // Check for patient mode redirection
    if (isPatientMode && !isPatientAccessibleRoute(currentPath) && !isRedirectingRef.current) {
      console.log('[ModuleAccess] Patient mode - redirecting to patient dashboard');
      isRedirectingRef.current = true;
      
      requestAnimationFrame(() => {
        setAccessState({
          status: 'redirecting',
          message: 'Redirecting to patient dashboard...',
          redirectTo: ROUTES.PATIENT_DASHBOARD,
        });
        
        requestAnimationFrame(() => {
          navigate(ROUTES.PATIENT_DASHBOARD, { replace: true });
        });
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          isRedirectingRef.current = false;
        }, 300);
      });
      
      return;
    }
    
    // Validate module access
    requestAnimationFrame(() => {
      if (routeAnalysis.requiresValidation && !hasModuleAccess) {
        console.warn('[ModuleAccess] Access denied:', {
          path: currentPath,
          requiredModule: routeAnalysis.requiredModuleCode,
        });
        
        setAccessState({
          status: 'denied',
          message: `Access denied to ${routeAnalysis.moduleName}`,
        });
      } else {
        setAccessState({ status: 'granted' });
      }
    });
  }, [
    currentPath,
    isPatientMode,
    routeAnalysis,
    hasModuleAccess,
    navigate,
  ]);
  
  // Effect to trigger access check when path changes
  useEffect(() => {
    // If this is a bypass route, skip all checks
    if (shouldBypass) {
      const rafId = requestAnimationFrame(() => {
        setAccessState({ status: 'bypassed' });
      });
      return () => cancelAnimationFrame(rafId);
    }
    
    const rafId = requestAnimationFrame(() => {
      performAccessCheck();
    });
    
    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [performAccessCheck, currentPath, shouldBypass]);
  
  // Reset redirecting flag when path changes
  useEffect(() => {
    if (currentPath !== lastCheckedPathRef.current) {
      isRedirectingRef.current = false;
    }
  }, [currentPath]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // IMMEDIATE BYPASS RENDER for account/auth routes
  if (shouldBypass) {
    // console.log('[ModuleAccess] Bypassing middleware for route:', currentPath);
    return <Outlet />;
  }
  
  // Render loading state
  if (accessState.status === 'checking' || accessState.status === 'redirecting') {
    return (
      <LoadingSkeleton
        variant="dashboard"
        message={accessState.message || 'Checking permissions...'}
        theme={theme}
      />
    );
  }
  
  // Render access denied screen
  if (accessState.status === 'denied') {
    return (
      <AccessDenied
        theme={theme}
        moduleName={routeAnalysis.moduleName}
        onNavigateHome={handleNavigateHome}
        isPatientMode={isPatientMode}
      />
    );
  }
  
  // Access granted - render child routes
  return <Outlet />;
};

export default ModuleAccessMiddleware;