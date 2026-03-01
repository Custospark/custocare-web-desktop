import React from "react";
import { Navigate, Route } from "react-router-dom";
import { ADMINISTRATION_FACILITY_SETTINGS_ROUTES } from "../../constants/administration.paths";
import { SuspenseWrapper, WithThemeProp } from "../shared/routeUtils";
// Lazy-loaded Facility Settings components
const FacilityIdentity = React.lazy(() => import("../../../../modules/administration/admin-module/ui/facility-settings/FacilityIdentity"));
const OperationalPolicy = React.lazy(() => import("../../../../modules/administration/admin-module/ui/facility-settings/OperationalPolicy"));



export const facilitySettingsRoutes = [
  /* Default redirect to Facility Identity */
  <Route
    index
    element={
      <Navigate
        to={ADMINISTRATION_FACILITY_SETTINGS_ROUTES.FACILITY_IDENTITY}
        replace
      />
    }
  />,

  /* Facility Identity */
  <Route
    key="facility-identity"
    path={ADMINISTRATION_FACILITY_SETTINGS_ROUTES.FACILITY_IDENTITY}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FacilityIdentity} />
      </SuspenseWrapper>
    }
  />,

  /* Operational Policies */
  <Route
    key="operational-policies"
    path={ADMINISTRATION_FACILITY_SETTINGS_ROUTES.OPERATIONAL_POLICIES}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={OperationalPolicy} />
      </SuspenseWrapper>
    }
  />,
];