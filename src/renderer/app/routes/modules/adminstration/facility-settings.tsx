import React from 'react';
import { Navigate, Route } from 'react-router-dom';

import {
  ADMINISTRATION_FACILITY_SETTINGS_ROUTE_SEGMENTS,
} from '../../constants/administration.paths';
import { SuspenseWrapper, WithThemeProp } from '../shared/routeUtils';

const FacilityIdentity = React.lazy(
  () => import('../../../../modules/administration/admin-module/ui/facility-settings/FacilityIdentity'),
);
const OperationalPolicy = React.lazy(
  () => import('../../../../modules/administration/admin-module/ui/facility-settings/OperationalPolicy'),
);

export const facilitySettingsRoutes = [
  <Route
    key="facility-settings-index"
    index
    element={
      <Navigate to={ADMINISTRATION_FACILITY_SETTINGS_ROUTE_SEGMENTS.FACILITY_IDENTITY} replace />
    }
  />,

  <Route
    key="facility-identity"
    path={ADMINISTRATION_FACILITY_SETTINGS_ROUTE_SEGMENTS.FACILITY_IDENTITY}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FacilityIdentity} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="operational-policies"
    path={ADMINISTRATION_FACILITY_SETTINGS_ROUTE_SEGMENTS.OPERATIONAL_POLICIES}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={OperationalPolicy} />
      </SuspenseWrapper>
    }
  />,
];
