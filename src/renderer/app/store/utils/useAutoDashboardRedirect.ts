// useAutoDashboardRedirect.ts
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAccessibleModuleCodes, isInPatientMode } from './contextSelectors';
import {
  ROUTES,
  MEDICAL_RECORDS_ROUTES,
  NURSING_ROUTES,
  CLINICAL_ROUTES,
  LABORATORY_ROUTES,
  PHARMACY_ROUTES,
  BILLING_ROUTES,
  ACCOUNT_ROUTES,
  PATIENT_PORTAL_ROUTES,
} from '../../routes/routeConstants';
import { ADMIN_ROUTES } from '../../routes/constants/administration.paths';

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
      medical_records: MEDICAL_RECORDS_ROUTES.OVERVIEW,
      nursing: NURSING_ROUTES.OVERVIEW,
      clinical: CLINICAL_ROUTES.OVERVIEW,
      laboratory: LABORATORY_ROUTES.OVERVIEW,
      pharmacy: PHARMACY_ROUTES.OVERVIEW,
      billing: BILLING_ROUTES.INTELLIGENCE,
      administration: ADMIN_ROUTES.OVERVIEW,
      patient_dashboard: PATIENT_PORTAL_ROUTES.OVERVIEW,
      account: ACCOUNT_ROUTES.SETTINGS_PROFILE,
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
    medical_records: MEDICAL_RECORDS_ROUTES.OVERVIEW,
    nursing: NURSING_ROUTES.OVERVIEW,
    clinical: CLINICAL_ROUTES.OVERVIEW,
    laboratory: LABORATORY_ROUTES.OVERVIEW,
    pharmacy: PHARMACY_ROUTES.OVERVIEW,
    billing: BILLING_ROUTES.INTELLIGENCE,
    administration: ADMIN_ROUTES.OVERVIEW,
    patient_dashboard: PATIENT_PORTAL_ROUTES.OVERVIEW,
    account: ACCOUNT_ROUTES.SETTINGS_PROFILE,
  };

  return moduleRouteMap[firstModuleCode] || ROUTES.DASHBOARD;
};
