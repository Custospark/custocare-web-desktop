// useAutoDashboardRedirect.ts
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAccessibleModuleCodes, isInPatientMode } from './contextSelectors';
import { ROUTES } from '../../routes/routeConstants';

/**
 * ============================================================================
 * AUTO DASHBOARD REDIRECT HOOK
 * ============================================================================
 * 
 * Automatically redirects users to their primary accessible module
 * based on role permissions and context.
 * 
 * Rules:
 * 1. Redirects to first accessible module from user's permissions
 * 2. Falls back to patient dashboard if in patient mode
 * 3. Falls back to home/landing if no accessible modules
 */
export const useAutoDashboardRedirect = () => {
  const accessibleModuleCodes = useSelector(getAccessibleModuleCodes);
  const inPatientMode = useSelector(isInPatientMode);
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect if no accessible modules (let auth handle it)
    if (!accessibleModuleCodes || accessibleModuleCodes.length === 0) {
      if (inPatientMode) {
        navigate(ROUTES.PATIENT_DASHBOARD, { replace: true });
      }
      return;
    }

    const firstModuleCode = accessibleModuleCodes[0];

    // Map module codes to routes
    const moduleRouteMap: Record<string, string> = {
      medical_records: ROUTES.MEDICAL_RECORDS,
      nursing: ROUTES.NURSING,
      clinical: ROUTES.CLINICAL,
      laboratory: ROUTES.LABORATORY,
      pharmacy: ROUTES.PHARMACY,
      billing: ROUTES.BILLING,
      administration: ROUTES.ADMINISTRATION,
      account: ROUTES.ACCOUNT,
    };

    const targetRoute = moduleRouteMap[firstModuleCode];

    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    } else if (inPatientMode) {
      navigate(ROUTES.PATIENT_DASHBOARD, { replace: true });
    } else {
      // Fallback to dashboard
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [accessibleModuleCodes, inPatientMode, navigate]);
};

/**
 * ============================================================================
 * GET DEFAULT DASHBOARD ROUTE (UTILITY)
 * ============================================================================
 * 
 * Get the default route without triggering navigation.
 * Useful for conditional rendering or link generation.
 */
export const getDefaultDashboardRoute = (
  accessibleModuleCodes: string[],
  inPatientMode: boolean
): string => {
  if (!accessibleModuleCodes || accessibleModuleCodes.length === 0) {
    return inPatientMode ? ROUTES.PATIENT_DASHBOARD : ROUTES.DASHBOARD;
  }

  const firstModuleCode = accessibleModuleCodes[0];

  const moduleRouteMap: Record<string, string> = {
    medical_records: ROUTES.MEDICAL_RECORDS,
    nursing: ROUTES.NURSING,
    clinical: ROUTES.CLINICAL,
    laboratory: ROUTES.LABORATORY,
    pharmacy: ROUTES.PHARMACY,
    billing: ROUTES.BILLING,
    administration: ROUTES.ADMINISTRATION,
    account: ROUTES.ACCOUNT,
  };

  return moduleRouteMap[firstModuleCode] || ROUTES.DASHBOARD;
};
