import React from 'react';
import { Navigate, Route } from 'react-router-dom';

import {
  ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTE_SEGMENTS,
} from '../../constants/administration.paths';
import { SuspenseWrapper, WithThemeProp } from '../shared/routeUtils';
import FacilitySubscriptions from '../../../../modules/administration/admin-module/ui/plans-and-subscriptions/FacilitySubscriptions';

const AvailablePlans = React.lazy(
  () => import('../../../../modules/administration/admin-module/ui/plans-and-subscriptions/AvailablePlans'),
);
const Payments = React.lazy(
  () => import('../../../../modules/administration/admin-module/ui/plans-and-subscriptions/Payments'),
);
const Invoices = React.lazy(
  () => import('../../../../modules/administration/admin-module/ui/plans-and-subscriptions/Invoices'),
);

export const plansSubscriptionsRoutes = [
  <Route
    key="plans-subscriptions-index"
    index
    element={<Navigate to={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTE_SEGMENTS.AVAILABLE_PLANS} replace />}
  />,

  <Route
    key="available-plans"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTE_SEGMENTS.AVAILABLE_PLANS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={AvailablePlans} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="subscriptions"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTE_SEGMENTS.SUBSCRIPTIONS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FacilitySubscriptions} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="payments"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTE_SEGMENTS.PAYMENTS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Payments} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="invoices"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTE_SEGMENTS.INVOICES}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Invoices} />
      </SuspenseWrapper>
    }
  />,
];
