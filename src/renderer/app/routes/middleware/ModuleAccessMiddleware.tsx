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
 * - Validates access based on accessible module codes from Redux state
 * - Supports both BrowserRouter and HashRouter
 * - Handles nested routes within modules
 * - Theme-aware error display
 * - Provides contact support information
 * 
 * @component ModuleAccessMiddleware
 */

import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Home } from 'lucide-react';
import type { RootState } from '../../store/store';
import { selectAccessibleModuleCodes } from '../../store/slices/activeContextSlice';
import { ROUTES } from './../routeConstants';

/**
 * Mapping of route paths to their corresponding module codes
 */
const ROUTE_TO_MODULE_MAP: Record<string, string> = {
  [ROUTES.MEDICAL_RECORDS]: 'medical_records',
  [ROUTES.CLINICAL]: 'clinical',
  [ROUTES.NURSING]: 'nursing',
  [ROUTES.LABORATORY]: 'laboratory',
  [ROUTES.PHARMACY]: 'pharmacy',
  [ROUTES.BILLING]: 'billing',
  [ROUTES.ADMINISTRATION]: 'administration',
  [ROUTES.PATIENT_DASHBOARD]: 'patient_dashboard',
  // Account is always accessible
  [ROUTES.ACCOUNT]: 'account',
};

/**
 * Routes that are always accessible regardless of module permissions
 */
const UNRESTRICTED_ROUTES = [
  ROUTES.ACCOUNT,
  ROUTES.DASHBOARD,
  '/onboarding',
  '/settings',
  '/profile',
];

/**
 * Extract the base module path from a given pathname
 * Handles both BrowserRouter (/module/sub) and HashRouter (#/module/sub) formats
 */
const extractBaseModulePath = (pathname: string): string | null => {
  // Remove hash prefix if present (HashRouter support)
  const cleanPath = pathname.startsWith('#') ? pathname.substring(1) : pathname;
  
  // Split path and get the first segment
  const segments = cleanPath.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return null;
  }
  
  // Return the base module path (e.g., /medical-records from /medical-records/patients/123)
  return `/${segments[0]}`;
};

/**
 * Check if a given path requires module access validation
 */
const isRestrictedPath = (pathname: string): boolean => {
  const basePath = extractBaseModulePath(pathname);
  
  if (!basePath) {
    return false;
  }
  
  // Check if path is in unrestricted routes
  const isUnrestricted = UNRESTRICTED_ROUTES.some(route => 
    basePath === route || basePath.startsWith(route)
  );
  
  return !isUnrestricted;
};

/**
 * Get the required module code for a given path
 */
const getRequiredModuleCode = (pathname: string): string | null => {
  const basePath = extractBaseModulePath(pathname);
  
  if (!basePath) {
    return null;
  }
  
  // Find matching module code
  return ROUTE_TO_MODULE_MAP[basePath] || null;
};

/**
 * Access Denied Component
 * Displays when user attempts to access a restricted module
 */
interface AccessDeniedProps {
  theme: 'light' | 'dark';
  moduleName: string;
  onNavigateHome: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ theme, moduleName, onNavigateHome }) => {
  const isDark = theme === 'dark';
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-8 text-center space-y-6 ${
        isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isDark ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <ShieldAlert className={`w-10 h-10 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`} />
          </div>
        </div>
        
        {/* Heading */}
        <div className="space-y-2">
          <h1 className={`text-2xl font-bold ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Access Denied
          </h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            You don't have access to this resource
          </p>
        </div>
        
        {/* Message */}
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-start gap-3 text-left">
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div className="space-y-2">
              <p className={`text-sm font-medium ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Permission for  Access Required
              </p>
              <p className={`text-xs leading-relaxed ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                You do not have permission to access the <span className="font-semibold">{moduleName}</span> module. 
                Your current role does not include access to this resource.
              </p>
            </div>
          </div>
        </div>
        
        {/* Support Information */}
        <div className={`p-4 rounded-lg text-left ${
          isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-xs ${
            isDark ? 'text-blue-300' : 'text-blue-800'
          }`}>
            <span className="font-semibold">If you believe this is a mistake:</span>
            <br />
            Contact your facility administrator or support team to request access to this module.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onNavigateHome}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            type="button"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </button>
          
          <a
            href="mailto:support@custospark.com"
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-center ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            }`}
          >
            Contact Support
          </a>
        </div>
        
        {/* Footer Note */}
        <p className={`text-xs ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          Error Code: MODULE_ACCESS_DENIED
        </p>
      </div>
    </div>
  );
};

/**
 * Module Access Middleware Component
 * Validates user access to module routes
 */
export const ModuleAccessMiddleware: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get theme and accessible modules from Redux
  const theme = useSelector((state: RootState) => state.ui.theme);
  const accessibleModuleCodes = useSelector(selectAccessibleModuleCodes);
  
  // Extract current pathname (handle both BrowserRouter and HashRouter)
  const currentPathname = location.hash 
    ? location.hash.substring(1) // Remove # for HashRouter
    : location.pathname;
  
  // Check if current path requires validation
  const requiresValidation = useMemo(
    () => isRestrictedPath(currentPathname),
    [currentPathname]
  );
  
  // Get required module code for current path
  const requiredModuleCode = useMemo(
    () => getRequiredModuleCode(currentPathname),
    [currentPathname]
  );
  
  // Check if user has access to the required module
  const hasAccess = useMemo(() => {
    if (!requiresValidation) {
      return true;
    }
    
    if (!requiredModuleCode) {
      return true; // Allow if we can't determine module (fail open for unknown routes)
    }
    
    // Account module is always accessible
    if (requiredModuleCode === 'account') {
      return true;
    }
    
    // Check if user has the required module code
    return accessibleModuleCodes.includes(requiredModuleCode);
  }, [requiresValidation, requiredModuleCode, accessibleModuleCodes]);
  
  // Get human-readable module name
  const moduleName = useMemo(() => {
    if (!requiredModuleCode) return 'Unknown Module';
    
    return requiredModuleCode
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [requiredModuleCode]);
  
  // Handle navigation back to dashboard
  const handleNavigateHome = () => {
    navigate(ROUTES.DASHBOARD, { replace: true });
  };
  
  // Log access attempts for debugging (optional - remove in production)
  useEffect(() => {
    if (requiresValidation && !hasAccess) {
      console.warn('[ModuleAccessMiddleware] Access denied:', {
        path: currentPathname,
        requiredModule: requiredModuleCode,
        accessibleModules: accessibleModuleCodes,
      });
    }
  }, [requiresValidation, hasAccess, currentPathname, requiredModuleCode, accessibleModuleCodes]);
  
  // Render access denied screen if user doesn't have access
  if (requiresValidation && !hasAccess) {
    return (
      <AccessDenied 
        theme={theme}
        moduleName={moduleName}
        onNavigateHome={handleNavigateHome}
      />
    );
  }
  
  // Allow access - render child routes
  return <Outlet />;
};

export default ModuleAccessMiddleware;