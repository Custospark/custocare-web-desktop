import { Navigate, Route } from "react-router-dom";
import { ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES } from "../../constants/administration.paths";
import { SuspenseWrapper, WithThemeProp } from "../shared/routeUtils";

import ClinicalRooms from "../../../../modules/administration/admin-module/ui/clinical-space/ClinicalRooms";
import WardManagement from "../../../../modules/administration/admin-module/ui/clinical-space/Wardmanagment";
import FacilityZones from "../../../../modules/administration/admin-module/ui/clinical-space/FacilityZone";
import SpaceAllocation from "../../../../modules/administration/admin-module/ui/clinical-space/SpaceAllocation";

export const clinicalSpaceManagementRoutes = [
  /* Default redirect to Clinical Rooms */
  <Route
    index
    element={
      <Navigate
        to={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.CLINICAL_ROOMS}
        replace
      />
    }
  />,

  /* Clinical Rooms */
  <Route
    key="clinical-rooms"
    path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.CLINICAL_ROOMS}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={ClinicalRooms} />
      </SuspenseWrapper>
    }
  />,

  /* Ward Management */
  <Route
    key="ward-management"
    path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.WARD_MANAGEMENT}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={WardManagement} />
      </SuspenseWrapper>
    }
  />,

  /* Facility Zones */
  <Route
    key="facility-zones"
    path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.FACILITY_ZONES}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FacilityZones} />
      </SuspenseWrapper>
    }
  />,

  /* Space Allocation */
  <Route
    key="space-allocation"
    path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.SPACE_ALLOCATION}
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={SpaceAllocation} />
      </SuspenseWrapper>
    }
  />,
];
