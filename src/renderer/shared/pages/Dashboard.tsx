import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store/store';
import { ROUTES, MEDICAL_RECORDS_ROUTES, CLINICAL_ROUTES } from '../../app/routes/routeConstants';
import { 
  selectAccessibleModuleCodes,
} from '../../app/store/slices/activeContextSlice';
import LoadingSkeleton from '../components/Loading/LoadingSkeletons';

/**
 * Dashboard Component - Redirect to first accessible module
 */

// Module priority order (if you want to maintain some hierarchy)
const MODULE_PRIORITY = [
  'medical_records',
  'clinical',
  'nursing',
  'laboratory',
  'pharmacy',
  'billing',
  'administration',
  'patient_dashboard',
  'account' // Always last as fallback
] as const;

// Module to route mapping
const MODULE_ROUTES: Record<string, string> = {
  medical_records: MEDICAL_RECORDS_ROUTES.OVERVIEW,
  clinical: CLINICAL_ROUTES.OVERVIEW || ROUTES.CLINICAL,
  nursing: ROUTES.NURSING,
  laboratory: ROUTES.LABORATORY,
  pharmacy: ROUTES.PHARMACY,
  billing: ROUTES.BILLING,
  administration: ROUTES.ADMINISTRATION,
  patient_dashboard: ROUTES.PATIENT_DASHBOARD,
  account: ROUTES.ACCOUNT,
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const accessibleModuleCodes = useSelector(selectAccessibleModuleCodes);
  
  // Find first accessible module in priority order
  const getTargetModule = () => {
    for (const moduleCode of MODULE_PRIORITY) {
      if (accessibleModuleCodes.includes(moduleCode)) {
        return moduleCode;
      }
    }
    return 'account'; // Default fallback
  };
  
  const targetModule = getTargetModule();
  const targetRoute = MODULE_ROUTES[targetModule] || ROUTES.ACCOUNT;
  
  // Loading message based on target module
  const loadingMessages: Record<string, string> = {
    medical_records: 'Loading front desk...',
    clinical: 'Loading clinical workspace...',
    nursing: 'Loading nursing care...',
    laboratory: 'Loading laboratory...',
    pharmacy: 'Loading pharmacy...',
    billing: 'Loading billing & finance...',
    administration: 'Loading administration...',
    patient_dashboard: 'Loading health dashboard...',
    account: 'Loading account settings...',
  };
  
  const loadingMessage = loadingMessages[targetModule] || 'Loading workspace...';
  
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      console.log(`Redirecting to: ${targetRoute} (module: ${targetModule})`);
      console.log(`All accessible modules: ${accessibleModuleCodes.join(', ')}`);
      navigate(targetRoute, { replace: true });
    }, 800);
    
    return () => clearTimeout(redirectTimer);
  }, [targetRoute, navigate, accessibleModuleCodes, targetModule]);
  
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