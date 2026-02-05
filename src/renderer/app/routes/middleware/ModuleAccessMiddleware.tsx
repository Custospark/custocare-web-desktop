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
 * - Detailed access denied screens with support information
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
import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';
import { isInPatientMode } from '../../store/utils/contextSelectors';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ModuleAccessConfig {
  route: string;
  moduleCode: string;
  displayName: string;
}

interface RouteAccessCheck {
  requiresValidation: boolean;
  requiredModuleCode: string | null;
  moduleName: string;
  isRestricted: boolean;
}

interface AccessState {
  status: 'checking' | 'granted' | 'denied' | 'redirecting';
  message?: string;
  redirectTo?: string;
}

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

/**
 * Configuration mapping for routes to module codes
 */
const MODULE_ACCESS_CONFIG: readonly ModuleAccessConfig[] = [
  { route: ROUTES.MEDICAL_RECORDS, moduleCode: 'medical_records', displayName: 'Medical Records' },
  { route: ROUTES.CLINICAL, moduleCode: 'clinical', displayName: 'Clinical' },
  { route: ROUTES.NURSING, moduleCode: 'nursing', displayName: 'Nursing' },
  { route: ROUTES.LABORATORY, moduleCode: 'laboratory', displayName: 'Laboratory' },
  { route: ROUTES.PHARMACY, moduleCode: 'pharmacy', displayName: 'Pharmacy' },
  { route: ROUTES.BILLING, moduleCode: 'billing', displayName: 'Billing' },
  { route: ROUTES.ADMINISTRATION, moduleCode: 'administration', displayName: 'Administration' },
  { route: ROUTES.PATIENT_DASHBOARD, moduleCode: 'patient_dashboard', displayName: 'Patient Dashboard' },
  { route: ROUTES.ACCOUNT, moduleCode: 'account', displayName: 'Account' },
] as const;

/**
 * Routes that are always accessible regardless of permissions
 */
const UNRESTRICTED_ROUTES: readonly string[] = [
  ROUTES.DASHBOARD,
  ROUTES.ACCOUNT,
  ROUTES.PATIENT_DASHBOARD,
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
 * Routes accessible in patient mode
 */
const PATIENT_ACCESSIBLE_ROUTES: readonly string[] = [
  ROUTES.PATIENT_DASHBOARD,
  ROUTES.ACCOUNT,
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
 */
const normalizePath = (pathname: string): string => {
  // Remove hash prefix if present
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
 */
const extractBasePath = (pathname: string): string => {
  const normalized = normalizePath(pathname);
  const segments = normalized.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return '/';
  }
  
  return `/${segments[0]}`;
};

/**
 * Checks if a path is unrestricted (always accessible)
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
 * Analyzes route access requirements
 */
const analyzeRouteAccess = (pathname: string): RouteAccessCheck => {
  const normalized = normalizePath(pathname);
  
  // Check if route is unrestricted
  if (isUnrestrictedRoute(normalized)) {
    return {
      requiresValidation: false,
      requiredModuleCode: null,
      moduleName: '',
      isRestricted: false,
    };
  }
  
  const basePath = extractBasePath(normalized);
  const requiredModuleCode = ROUTE_TO_MODULE_MAP[basePath] || null;
  const moduleName = requiredModuleCode 
    ? MODULE_CODE_TO_DISPLAY_NAME[requiredModuleCode] || formatModuleName(requiredModuleCode)
    : 'Unknown Module';
  
  return {
    requiresValidation: true,
    requiredModuleCode,
    moduleName,
    isRestricted: requiredModuleCode !== null,
  };
};

/**
 * Formats module code into display name
 */
const formatModuleName = (moduleCode: string): string => {
  return moduleCode
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Validates user access to a module
 */
const validateModuleAccess = (
  accessibleModuleCodes: string[],
  requiredModuleCode: string | null
): boolean => {
  // No module required or module is 'account' (always accessible)
  if (!requiredModuleCode || requiredModuleCode === 'account') {
    return true;
  }
  
  // Check if user has the required module code
  return accessibleModuleCodes.includes(requiredModuleCode);
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

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
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
      isDark ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in ${
        isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        {/* Icon */}
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
            Access Restricted
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {moduleName ? `Module: ${moduleName}` : 'This area requires special permissions'}
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
                Permission Required
              </p>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isPatientMode 
                  ? 'Patient accounts have limited access to the system. Please use the patient dashboard for available features.'
                  : `Your current role does not include access to the ${moduleName} module. Please contact your administrator if you need access to this resource.`
                }
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
        
        {/* Footer */}
        <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Reference: MOD_ACCESS_{moduleName.toUpperCase().replace(/\s+/g, '_')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ModuleAccessMiddleware: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Redux state
  const theme = useSelector((state: RootState) => state.ui.theme);
  const accessibleModuleCodes = useSelector(selectAccessibleModuleCodes);
  const isPatientMode = useSelector(isInPatientMode);
  
  // Local state - properly imported useState
  const [accessState, setAccessState] = useState<AccessState>({ status: 'checking' });
  
  // Use refs for values that don't need to trigger re-renders
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
    return validateModuleAccess(accessibleModuleCodes, routeAnalysis.requiredModuleCode);
  }, [routeAnalysis, accessibleModuleCodes]);
  
  // Handle navigation to dashboard
  const handleNavigateHome = useCallback(() => {
    const targetRoute = isPatientMode ? ROUTES.PATIENT_DASHBOARD : ROUTES.DASHBOARD;
    navigate(targetRoute, { replace: true });
  }, [navigate, isPatientMode]);
  
  // Main access validation logic - standalone function
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
      
      // Use requestAnimationFrame to schedule state update
      requestAnimationFrame(() => {
        setAccessState({
          status: 'redirecting',
          message: 'Redirecting to patient dashboard...',
          redirectTo: ROUTES.PATIENT_DASHBOARD,
        });
        
        // Navigate on next animation frame
        requestAnimationFrame(() => {
          navigate(ROUTES.PATIENT_DASHBOARD, { replace: true });
        });
        
        // Reset redirecting flag after navigation completes
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          isRedirectingRef.current = false;
        }, 300);
      });
      
      return;
    }
    
    // Validate module access - use requestAnimationFrame to avoid sync state update
    requestAnimationFrame(() => {
      if (routeAnalysis.requiresValidation && !hasModuleAccess) {
        console.warn('[ModuleAccess] Access denied:', {
          path: currentPath,
          requiredModule: routeAnalysis.requiredModuleCode,
          accessibleModules: accessibleModuleCodes,
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
    accessibleModuleCodes,
    navigate,
  ]);
  
  // Effect to trigger access check when path or dependencies change
  useEffect(() => {
    // Schedule the access check on next animation frame
    const rafId = requestAnimationFrame(() => {
      performAccessCheck();
    });
    
    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [performAccessCheck, currentPath]);
  
  // Reset redirecting flag when path changes
  useEffect(() => {
    if (currentPath !== lastCheckedPathRef.current) {
      isRedirectingRef.current = false;
    }
  }, [currentPath]);
  
  // Log route changes for debugging
  useEffect(() => {
    if (currentPath !== lastCheckedPathRef.current) {
      console.log('[ModuleAccess] Route changed:', currentPath);
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
  
  // Handle redirect state - this runs after state is updated
  useEffect(() => {
    if (accessState.status === 'redirecting' && accessState.redirectTo) {
      // Navigation is already handled in performAccessCheck, just ensure consistency
      console.log('[ModuleAccess] In redirect state, target:', accessState.redirectTo);
    }
  }, [accessState.status, accessState.redirectTo]);
  
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
  
  // Render access denied
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