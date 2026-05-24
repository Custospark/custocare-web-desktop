import React from 'react';

import LoadingRedirect from '../../../../shared/components/Loading/LoadingRedirect';
import {
  ADMIN_ROUTES,
  ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES,
} from '../../../../app/routes/constants/administration.paths';
import { useAdministrationSubscriptionRestriction } from '../../../../shared/entitlements/useAdministrationSubscriptionRestriction';

/** Redirects `/administration` index based on subscription restriction state. */
export const AdministrationIndexRedirect: React.FC = () => {
  const { restrictToPlansOnly } = useAdministrationSubscriptionRestriction();

  return (
    <LoadingRedirect
      to={
        restrictToPlansOnly
          ? ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS
          : ADMIN_ROUTES.OVERVIEW
      }
      replace
      variant="dashboard"
      message={
        restrictToPlansOnly
          ? 'Loading Plans & Subscriptions...'
          : 'Loading Facility Intelligence...'
      }
    />
  );
};

export default AdministrationIndexRedirect;
