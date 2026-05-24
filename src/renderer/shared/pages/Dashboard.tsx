import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store/store';
import { ROUTES } from '../../app/routes/routeConstants';
import { selectAccessibleModuleCodes } from '../../app/store/slices/activeContextSlice';
import LoadingSkeleton from '../components/Loading/LoadingSkeletons';
import {
  isInPatientMode,
  getActiveCapability,
  isInStaffMode,
} from '../../app/store/utils/contextSelectors';
import { selectIsActiveFacilityOwner } from '../../app/store/slices/activeContextSlice';
import { useAdministrationSubscriptionRestriction } from '../entitlements/useAdministrationSubscriptionRestriction';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../app/routes/constants/administration.paths';
import {
  getDashboardLoadingMessage,
  getDashboardModuleEntry,
  resolveDashboardModule,
} from '../../app/routes/dashboardRedirectConfig';
import { cn } from '../utils/classNameUtils';

/**
 * Dashboard Component - Redirect to first accessible module (by priority).
 */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const accessibleModuleCodes = useSelector(selectAccessibleModuleCodes);
  const isPatientMode = useSelector(isInPatientMode);
  const activeCapability = useSelector(getActiveCapability);
  const inStaffMode = useSelector(isInStaffMode);
  const isFacilityOwner = useSelector(selectIsActiveFacilityOwner);
  const { restrictToPlansOnly } = useAdministrationSubscriptionRestriction();

  const isSpatieRole =
    activeCapability && activeCapability !== 'patient' && activeCapability !== 'staff';

  useEffect(() => {
    if (isPatientMode) {
      navigate(ROUTES.PATIENT_DASHBOARD, { replace: true });
    }
  }, [isPatientMode, navigate]);

  const targetModule = resolveDashboardModule({
    accessibleModuleCodes,
    isPatientMode,
    activeCapability,
  });

  const { route: resolvedRoute } = getDashboardModuleEntry(targetModule);
  const targetRoute =
    inStaffMode &&
    isFacilityOwner &&
    restrictToPlansOnly &&
    targetModule === 'administration'
      ? ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS
      : resolvedRoute;
  const loadingMessage = getDashboardLoadingMessage(targetModule, activeCapability);

  useEffect(() => {
    if (isPatientMode) {
      return;
    }

    const redirectTimer = setTimeout(() => {
      if (isSpatieRole) {
        navigate(targetRoute, {
          replace: true,
          state: {
            capability: activeCapability,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        navigate(targetRoute, { replace: true });
      }
    }, 800);

    return () => clearTimeout(redirectTimer);
  }, [targetRoute, navigate, isPatientMode, activeCapability, isSpatieRole]);

  return (
    <div
      className={cn(
        'min-h-screen w-full',
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      )}
    >
      <LoadingSkeleton
        variant="dashboard"
        message={loadingMessage}
        theme={theme}
        className="min-h-screen"
      />
    </div>
  );
};

export default Dashboard;
