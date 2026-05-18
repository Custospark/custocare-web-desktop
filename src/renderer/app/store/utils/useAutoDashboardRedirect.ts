import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAccessibleModuleCodes, isInPatientMode, getActiveCapability } from './contextSelectors';
import {
  getDefaultDashboardRoute as resolveDefaultDashboardRoute,
} from '../../routes/dashboardRedirectConfig';

/**
 * Automatically redirects users to their primary accessible module
 * using the shared dashboard priority config.
 */
export const useAutoDashboardRedirect = () => {
  const accessibleModuleCodes = useSelector(getAccessibleModuleCodes);
  const inPatientMode = useSelector(isInPatientMode);
  const activeCapability = useSelector(getActiveCapability);
  const navigate = useNavigate();

  useEffect(() => {
    const targetRoute = resolveDefaultDashboardRoute(accessibleModuleCodes, {
      isPatientMode: inPatientMode,
      activeCapability,
    });

    navigate(targetRoute, { replace: true });
  }, [accessibleModuleCodes, inPatientMode, activeCapability, navigate]);
};

/**
 * Get the default route without triggering navigation.
 */
export const getDefaultDashboardRoute = (
  accessibleModuleCodes: string[],
  inPatientMode: boolean,
  activeCapability?: string | null
): string =>
  resolveDefaultDashboardRoute(accessibleModuleCodes, {
    isPatientMode: inPatientMode,
    activeCapability,
  });
