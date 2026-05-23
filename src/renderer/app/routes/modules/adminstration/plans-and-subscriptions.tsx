import React from "react";
import { Route } from "react-router-dom";
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from "../../constants/administration.paths";
import { SuspenseWrapper, WithThemeProp } from "../shared/routeUtils";
import FacilitySubscriptions from "../../../../modules/administration/admin-module/ui/plans-and-subscriptions/FacilitySubscriptions";

const AvailablePlans = React.lazy(() => import("../../../../modules/administration/admin-module/ui/plans-and-subscriptions/AvailablePlans"));
const Payments = React.lazy(() => import("../../../../modules/administration/admin-module/ui/plans-and-subscriptions/Payments"));
const Invoices = React.lazy(() => import("../../../../modules/administration/admin-module/ui/plans-and-subscriptions/Invoices"));

export const plansSubscriptionsRoutes = [
  <Route
    key="available-plans"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={AvailablePlans} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="subscriptions"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FacilitySubscriptions} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="payments"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Payments} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="invoices"
    path={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.INVOICES}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Invoices} />
      </SuspenseWrapper>
    }
  />,
];