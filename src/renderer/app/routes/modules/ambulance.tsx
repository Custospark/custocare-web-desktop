import { Navigate, Route } from 'react-router-dom';
import { SuspenseWrapper, WithThemeProp } from './shared/routeUtils';
import { AMBULANCE_ROUTES } from '../routeConstants';

import AmbulanceOverview from '../../../modules/ambulance/ui/overview/AmbulanceOverview';
import FleetAdminDashboard from '../../../modules/ambulance/ui/admin/FleetAdminDashboard';
import VehicleManagement from '../../../modules/ambulance/ui/vehicles/VehicleManagement';
import CrewManagement from '../../../modules/ambulance/ui/crew/CrewManagement';
import AmbulanceAnalytics from '../../../modules/ambulance/ui/analytics/AmbulanceAnalytics';
import DispatchFrontDesk from '../../../modules/ambulance/ui/dispatch/DispatchFrontDesk';
import ActiveTripsBoard from '../../../modules/ambulance/ui/dispatch/views/ActiveTripsBoard';
import TripList from '../../../modules/ambulance/ui/dispatch/views/TripList';
import TripDetail from '../../../modules/ambulance/ui/dispatch/views/TripDetail';
import TripTimeline from '../../../modules/ambulance/ui/dispatch/views/TripTimeline';
import TripLogList from '../../../modules/ambulance/ui/dispatch/views/TripLogList';

export const ambulanceRoutes = [
  // ─── Operation 1: Fleet Intelligence ─────────────────────────────────
  <Route key="ambulance-overview" path="overview" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={AmbulanceOverview} /></SuspenseWrapper>
  } />,

  // ─── Operation 2: Dispatch & Trip Center ────────────────────────────
  <Route key="ambulance-dispatch" path="dispatch" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={DispatchFrontDesk} /></SuspenseWrapper>
  }>
    <Route index element={<Navigate to={AMBULANCE_ROUTES.DISPATCH_ACTIVE_BOARD} replace />} />
    <Route key="ambulance-dispatch-active-board" path="active-board" element={
      <SuspenseWrapper variant="table"><WithThemeProp Component={ActiveTripsBoard} /></SuspenseWrapper>
    } />
    <Route key="ambulance-dispatch-history" path="trip-history" element={
      <SuspenseWrapper variant="table"><WithThemeProp Component={TripList} /></SuspenseWrapper>
    } />
  </Route>,

  // ─── Operation 3: Active Trip Workspace ─────────────────────────────
  <Route key="ambulance-trip-workspace" path="trip-workspace" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={TripDetail} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-trip-workspace-timeline" path="trip-workspace/timeline" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={TripTimeline} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-trip-workspace-logs" path="trip-workspace/logs" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={TripLogList} /></SuspenseWrapper>
  } />,

  // ─── Operation 4: Fleet Administration ───────────────────────────────
  <Route key="ambulance-admin" path="admin" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={FleetAdminDashboard} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-vehicles" path="admin/vehicles" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={VehicleManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-vehicles-all" path="admin/vehicles/all" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={VehicleManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-vehicles-create" path="admin/vehicles/create" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={VehicleManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-vehicles-service" path="admin/vehicles/service-schedule" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={VehicleManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-vehicles-detail" path="admin/vehicles/:uuid" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={VehicleManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-vehicles-edit" path="admin/vehicles/:uuid/edit" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={VehicleManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-crew" path="admin/crew" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={CrewManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-crew-by-vehicle" path="admin/crew/by-vehicle" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={CrewManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-crew-by-staff" path="admin/crew/by-staff" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={CrewManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-crew-assign" path="admin/crew/assign" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={CrewManagement} /></SuspenseWrapper>
  } />,
  <Route key="ambulance-admin-analytics" path="admin/analytics" element={
    <SuspenseWrapper variant="table"><WithThemeProp Component={AmbulanceAnalytics} /></SuspenseWrapper>
  } />,
];
