import { Route } from "react-router-dom";
import { ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES } from "../../constants/administration.paths";
import { SuspenseWrapper, WithThemeProp } from "../shared/routeUtils";
import React from 'react';
import { FacilitySpace } from "../../../../modules/administration/admin-module/ui/clinical-space/FacilitySpace";
import { FacilityWard } from "../../../../modules/administration/admin-module/ui/clinical-space/FacilityWard";
const FacilityZones = React.lazy(() => import("../../../../modules/administration/admin-module/ui/clinical-space/FacilityZone"));
import { SpaceAllocation } from "../../../../modules/administration/admin-module/ui/clinical-space/SpaceAllocation";

export const clinicalSpaceManagementRoutes = [
  <Route
    key="clinical-rooms"
    path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.CLINICAL_ROOMS}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={FacilitySpace} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="ward-management"
    path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.WARD_MANAGEMENT}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={FacilityWard} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="facility-zones"
    path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.FACILITY_ZONES}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={FacilityZones} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="space-allocation"
    path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.SPACE_ALLOCATION}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={SpaceAllocation} />
      </SuspenseWrapper>
    }
  />,
];