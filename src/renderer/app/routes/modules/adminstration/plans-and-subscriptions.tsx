// plansSubscriptions.routes.tsx
import React from "react";
import { Navigate, Route } from "react-router-dom";
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from "../../constants/administration.paths";
import { SuspenseWrapper, WithThemeProp } from "../shared/routeUtils";

// Lazy-loaded components
const AvailablePlans = React.lazy(() => import("../../../../modules/administration/admin-module/ui/plans-and-subscriptions/AvailablePlans"));
const Payments = React.lazy(() => import("../../../../modules/administration/admin-module/ui/plans-and-subscriptions/Payments"));
const FacilitySubscriptions = React.lazy(() => import("../../../../modules/platform-administration/facility-managment/FacilitySubscriptions"));

export const plansSubscriptionsRoutes = [
  /* Default redirect to Available Plans */
  <Route
    key="plans-subscriptions-index"
    index
    element={
      <Navigate
        to={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS}
        replace
      />
    }
  />,

  /* Available Plans */
  <Route
    key="available-plans"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={AvailablePlans} />
      </SuspenseWrapper>
    }
  />,

  /* Subscriptions */
  <Route
    key="subscriptions"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FacilitySubscriptions} />
      </SuspenseWrapper>
    }
  />,

  /* Payment Methods */
  <Route
    key="payments"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Payments} />
      </SuspenseWrapper>
    }
  />,
];