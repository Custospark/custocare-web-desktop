import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store/store';
import {
  ROUTES,
  MEDICAL_RECORDS_ROUTES,
  CLINICAL_ROUTES,
  NURSING_ROUTES,
  LABORATORY_ROUTES,
  PHARMACY_ROUTES,
  BILLING_ROUTES,
  ACCOUNT_ROUTES,
  PATIENT_PORTAL_ROUTES,
} from '../../app/routes/routeConstants';
import { ADMIN_ROUTES } from '../../app/routes/constants/administration.paths';
import { PLATFORM_ADMIN_ROUTES } from '../../app/routes/constants/platform-administration.paths';
import { 
  selectAccessibleModuleCodes,
} from '../../app/store/slices/activeContextSlice';
import LoadingSkeleton from '../components/Loading/LoadingSkeletons';
import { 
  isInPatientMode,
  getActiveCapability,
} from '../../app/store/utils/contextSelectors';

/**
 * Dashboard Component - Redirect to first accessible module
 */

// Module priority order (maintains hierarchy)
const MODULE_PRIORITY = [
  'medical_records',
  'clinical',
  'nursing',
  'laboratory',
  'pharmacy',
  'billing',
  'administration',
  'platform_administration',
  'patient_dashboard',
  'account' // Always last as fallback
] as const;

// Module to route mapping
const MODULE_ROUTES: Record<string, string> = {
  medical_records: MEDICAL_RECORDS_ROUTES.OVERVIEW,
  clinical: CLINICAL_ROUTES.OVERVIEW,
  nursing: NURSING_ROUTES.OVERVIEW,
  laboratory: LABORATORY_ROUTES.OVERVIEW,
  pharmacy: PHARMACY_ROUTES.OVERVIEW,
  billing: BILLING_ROUTES.OVERVIEW,
  administration: ADMIN_ROUTES.OVERVIEW,
  platform_administration: PLATFORM_ADMIN_ROUTES.PLATFORM_FACILITY_GOVERNANCE,
  patient_dashboard: PATIENT_PORTAL_ROUTES.OVERVIEW,
  account: ACCOUNT_ROUTES.SETTINGS_PROFILE,
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const accessibleModuleCodes = useSelector(selectAccessibleModuleCodes);
  const isPatientMode = useSelector(isInPatientMode);
  const activeCapability = useSelector(getActiveCapability);
  
  // ✅ DEBUG: Log what's coming from the backend
  useEffect(() => {
    console.log('[Dashboard DEBUG] ================');
    console.log('[Dashboard DEBUG] Active Capability:', activeCapability);
    console.log('[Dashboard DEBUG] Accessible Module Codes:', accessibleModuleCodes);
    console.log('[Dashboard DEBUG] Includes platform_administration:', accessibleModuleCodes.includes('platform_administration'));
    console.log('[Dashboard DEBUG] Is Spatie Role:', activeCapability && activeCapability !== 'patient' && activeCapability !== 'staff');
    console.log('[Dashboard DEBUG] ================');
  }, [activeCapability, accessibleModuleCodes]);
  
  // Check if current capability is a Spatie role (not patient or staff)
  const isSpatieRole = activeCapability && 
                       activeCapability !== 'patient' && 
                       activeCapability !== 'staff';
  
  // ✅ Handle patient mode redirect
  useEffect(() => {
    if (isPatientMode) {
      console.log('[Dashboard] Patient mode detected, redirecting to patient dashboard');
      navigate(ROUTES.PATIENT_DASHBOARD, { replace: true });
      return;
    }
  }, [isPatientMode, navigate]);
  
  // Find first accessible module based on priority
  const getTargetModule = () => {
    // Skip priority logic if in patient mode (should have already redirected)
    if (isPatientMode) {
      return 'patient_dashboard';
    }
    
    // For Spatie roles, use their specific modules
    if (isSpatieRole) {
      // Check if platform_administration is accessible for super_admin
      if (activeCapability === 'super_admin' && accessibleModuleCodes.includes('platform_administration')) {
        console.log('[Dashboard] Super admin with platform_administration access, redirecting there');
        return 'platform_administration';
      }
      
      console.log('[Dashboard] Spatie role but no platform_administration access, falling back to priority');
      // For other Spatie roles, fall back to first accessible module
    }
    
    // Standard priority-based selection
    for (const moduleCode of MODULE_PRIORITY) {
      if (accessibleModuleCodes.includes(moduleCode)) {
        console.log(`[Dashboard] Found accessible module: ${moduleCode}`);
        return moduleCode;
      }
    }
    
    console.log('[Dashboard] No accessible modules found, defaulting to account');
    return 'account'; // Default fallback
  };
  
  const targetModule = getTargetModule();
  const targetRoute = MODULE_ROUTES[targetModule] || ROUTES.ACCOUNT;
  
  // Loading messages based on target module
  const loadingMessages: Record<string, string> = {
    medical_records: 'Loading front desk...',
    clinical: 'Loading clinical workspace...',
    nursing: 'Loading nursing care...',
    laboratory: 'Loading laboratory...',
    pharmacy: 'Loading pharmacy...',
    billing: 'Loading billing & finance...',
    administration: 'Loading administration...',
    platform_administration: 'Loading platform administration...',
    patient_dashboard: 'Loading health dashboard...',
    account: 'Loading account settings...',
  };
  
  // Get capability-specific loading message
  const getCapabilityLoadingMessage = () => {
    if (activeCapability && activeCapability !== 'patient' && activeCapability !== 'staff') {
      return `Loading ${activeCapability.replace('_', ' ')} workspace...`;
    }
    return loadingMessages[targetModule] || 'Loading workspace...';
  };
  
  const loadingMessage = getCapabilityLoadingMessage();
  
  useEffect(() => {
    // Skip redirection timer if in patient mode (already redirected)
    if (isPatientMode) {
      return;
    }
    
    const redirectTimer = setTimeout(() => {
      console.log(`[Dashboard] FINAL - Redirecting to: ${targetRoute} (module: ${targetModule})`);
      console.log(`[Dashboard] FINAL - Active capability: ${activeCapability}`);
      console.log(`[Dashboard] FINAL - Accessible modules: ${accessibleModuleCodes.join(', ')}`);
      
      // For Spatie roles, we might want to pass capability info in state
      if (isSpatieRole) {
        navigate(targetRoute, { 
          replace: true,
          state: {
            capability: activeCapability,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        navigate(targetRoute, { replace: true });
      }
    }, 800);
    
    return () => clearTimeout(redirectTimer);
  }, [targetRoute, navigate, accessibleModuleCodes, targetModule, isPatientMode, activeCapability, isSpatieRole]);
  
  // Patient mode loading
  if (isPatientMode) {
    return (
      <div className="min-h-screen">
        <LoadingSkeleton
          variant="dashboard"
          message="Loading patient dashboard..."
          theme={theme}
          className="h-screen"
        />
      </div>
    );
  }
  
  // Spatie role loading
  if (isSpatieRole) {
    return (
      <div className="min-h-screen">
        <LoadingSkeleton
          variant="dashboard"
          message={loadingMessage}
          theme={theme}
          className="h-screen"
        />
      </div>
    );
  }
  
  // Staff/Default loading
  return (
    <div className="min-h-screen">
      <LoadingSkeleton
        variant="dashboard"
        message={loadingMessage}
        theme={theme}
        className="h-screen"
      />
    </div>
  );
};

export default Dashboard;