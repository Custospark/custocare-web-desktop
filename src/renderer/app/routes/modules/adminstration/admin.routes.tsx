import { Route } from "react-router-dom";
import { ADMIN_ROUTES } from "../../constants/administration.paths";
import { SuspenseWrapper, WithThemeProp } from "../shared/routeUtils";
import AdminOverview from "../../../../modules/administration/admin-module/ui/admin-overview-ui/AdminOverview";
import AdminTeam from "../../../../modules/administration/admin-module/ui/team-ui/AdminTeam";
import AdminFacilitySetup from "../../../../modules/administration/admin-module/ui/facility-setup-ui/AdminFacilitySetup";
import AdminServiceCatalog from "../../../../modules/administration/admin-module/ui/service-catalog-ui/AdminServiceCatalog";
import AdminInventoryItem from "../../../../modules/administration/admin-module/ui/inventory/AdminInventoryItems";

export const adminRoutes = [
  <Route 
    key="admin-overview"
    path={ADMIN_ROUTES.OVERVIEW}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={AdminOverview} />
      </SuspenseWrapper>
    } 
  />,
  
  <Route 
    key="admin-team"
    path={ADMIN_ROUTES.TEAM}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={AdminTeam} />
      </SuspenseWrapper>
    } 
  />,
  
  <Route 
    key="admin-facility-setup"
    path={ADMIN_ROUTES.FACILITY_SETUP}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={AdminFacilitySetup} />
      </SuspenseWrapper>
    } 
  />,
  
  <Route 
    key="admin-service-catalog"
    path={ADMIN_ROUTES.SERVICE_CATALOG}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={AdminServiceCatalog} />
      </SuspenseWrapper>
    } 
  />,
  
  <Route 
    key="admin-inventory"
    path={ADMIN_ROUTES.INVENTORY}
    element={
      <SuspenseWrapper variant="detail">
        <WithThemeProp Component={AdminInventoryItem} />
      </SuspenseWrapper>
    } 
  />,
];