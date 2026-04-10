import { Route } from "react-router-dom";
import { SuspenseWrapper, WithThemeProp } from "../shared/routeUtils";
import { ADMIN_ROUTES } from "../../constants/administration.paths";
import RevenueStats from "../../../../modules/medical-records/ui/revenue/stats/RevenueStats";
import MRBillingReview from "../../../../modules/medical-records/ui/revenue/MRBillingReview";

export const facilityAdminBillingCycleRoutes = [
  <Route
    key="facility-admin-revenue-stats"
    path={ADMIN_ROUTES.BILLING_CYCLE_REVENUE_STATS}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={RevenueStats} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="facility-admin-billing-review"
    path={ADMIN_ROUTES.BILLING_CYCLE_BILLING_REVIEW}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={MRBillingReview} />
      </SuspenseWrapper>
    }
  />,
];