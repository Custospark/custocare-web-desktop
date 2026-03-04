import React from "react";
import { Route, Navigate } from "react-router-dom";
import { ADMINISTRATION_FACILITY_SETTINGS_ROUTES } from "../../constants/administration.paths";
import { SuspenseWrapper, WithThemeProp } from "../shared/routeUtils";

const FacilityIdentity = React.lazy(() => import("../../../../modules/administration/admin-module/ui/facility-settings/FacilityIdentity"));
const OperationalPolicy = React.lazy(() => import("../../../../modules/administration/admin-module/ui/facility-settings/OperationalPolicy"));

export const facilitySettingsRoutes = [
  // Redirect from /administration/settings to identity
  <Route
    key="facility-settings-index"
    index
    element={<Navigate to={ADMINISTRATION_FACILITY_SETTINGS_ROUTES.ROOT} replace />}
  />,

  <Route
    key="facility-identity"
    path={ADMINISTRATION_FACILITY_SETTINGS_ROUTES.FACILITY_IDENTITY}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FacilityIdentity} />
      </SuspenseWrapper>
    }
  />,

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