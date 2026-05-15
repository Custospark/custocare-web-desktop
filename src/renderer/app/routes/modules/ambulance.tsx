/* eslint-disable react-refresh/only-export-components -- route table */
import { type ComponentType } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { AMBULANCE_ROUTES } from '../routeConstants';
import { SuspenseWrapper, WithThemeProp } from './shared/routeUtils';

import AmbulanceOverview from '../../../modules/ambulance/ui/overview/AmbulanceOverview';
import AmbulanceFrontDesk from '../../../modules/ambulance/ui/patients/AmbulanceFrontDesk';
import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientCreate from '../../../modules/medical-records/ui/patients/views/MRPatientCreate';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientWalkIn from '../../../modules/medical-records/ui/patients/views/MRPatientWalkIn';
import MRPatientRecords from '../../../modules/medical-records/ui/patients/views/MRPatientRecords';
import AmbulanceActionCenter from '../../../modules/ambulance/ui/action-center/AmbulanceActionCenter';
import VisitTransportStatus from '../../../modules/ambulance/ui/action-center/VisitTransportStatus';
import VisitTransportRequest from '../../../modules/ambulance/ui/action-center/VisitTransportRequest';
import AmbulanceFleetWorkspace from '../../../modules/ambulance/ui/fleet/AmbulanceFleetWorkspace';
import TripTimeline from '../../../modules/ambulance/ui/dispatch/views/TripTimeline';
import TripLogList from '../../../modules/ambulance/ui/dispatch/views/TripLogList';
import FleetAdminDashboard from '../../../modules/ambulance/ui/admin/FleetAdminDashboard';
import FleetDispatchHub from '../../../modules/ambulance/ui/fleet/FleetDispatchHub';
import FleetAssetsHub from '../../../modules/ambulance/ui/fleet/FleetAssetsHub';
import VehicleDetail from '../../../modules/ambulance/ui/vehicles/views/VehicleDetail';
import VehicleEdit from '../../../modules/ambulance/ui/vehicles/views/VehicleEdit';
import AmbulanceAnalytics from '../../../modules/ambulance/ui/analytics/AmbulanceAnalytics';
import { MRBillingReview } from '../../../modules/medical-records/ui/revenue/MRBillingReview';
import RedirectToForwardPatientFocus from '../../../modules/medical-records/ui/visit-action-center/RedirectToForwardPatientFocus';

const tablePage = <P extends { theme: 'light' | 'dark' }>(Component: ComponentType<P>) => (
  <SuspenseWrapper variant="table">
    <WithThemeProp Component={Component} />
  </SuspenseWrapper>
);

export const ambulanceRoutes = [
  <Route key="ambulance-index" index element={<Navigate to={AMBULANCE_ROUTES.OVERVIEW} replace />} />,

  <Route key="ambulance-overview" path="overview" element={tablePage(AmbulanceOverview)} />,

  <Route key="ambulance-patients" path="patients" element={tablePage(AmbulanceFrontDesk)}>
    <Route index element={<Navigate to={AMBULANCE_ROUTES.PATIENT_QUEUE} replace />} />
    <Route
      path="search"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientSearch} props={{ intakeModule: 'ambulance' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="register"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientCreate} props={{ intakeModule: 'ambulance' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="queue"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientQueue} props={{ intakeModule: 'ambulance' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="walk-in"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientWalkIn} props={{ intakeModule: 'ambulance' }} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route key="ambulance-action-center" path="action-center" element={tablePage(AmbulanceActionCenter)}>
    <Route index element={<Navigate to={AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT} replace />} />
    <Route
      path="forward-patient"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={RedirectToForwardPatientFocus}
            props={{
              cancelTo: AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT,
              queueRedirectTo: AMBULANCE_ROUTES.PATIENT_QUEUE,
            }}
          />
        </SuspenseWrapper>
      }
    />
    <Route path="transport" element={tablePage(VisitTransportStatus)} />
    <Route path="transport/timeline" element={tablePage(TripTimeline)} />
    <Route path="transport/logs" element={tablePage(TripLogList)} />
    <Route path="transport-request" element={tablePage(VisitTransportRequest)} />
    <Route
      path="patient-info"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientRecords} props={{ presentation: 'ambulance' }} />
        </SuspenseWrapper>
      }
    />
    <Route path="active-board" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ACTIVE_BOARD} replace />} />
    <Route path="trip-history" element={<Navigate to={AMBULANCE_ROUTES.FLEET_TRIP_HISTORY} replace />} />
    <Route path="new-trip" element={<Navigate to={AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT_REQUEST} replace />} />
    <Route path="trip-workspace" element={<Navigate to={AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT} replace />} />
    <Route path="trip-workspace/timeline" element={<Navigate to={AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT_TIMELINE} replace />} />
    <Route path="trip-workspace/logs" element={<Navigate to={AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT_LOGS} replace />} />
  </Route>,

  <Route key="ambulance-fleet" path="fleet" element={tablePage(AmbulanceFleetWorkspace)}>
    <Route index element={<Navigate to={AMBULANCE_ROUTES.FLEET_DISPATCH} replace />} />
    <Route path="overview" element={tablePage(FleetAdminDashboard)} />
    <Route path="dispatch" element={tablePage(FleetDispatchHub)} />
    <Route path="assets" element={tablePage(FleetAssetsHub)} />
    <Route path="analytics" element={tablePage(AmbulanceAnalytics)} />
    <Route path="dispatch/active-board" element={<Navigate to={AMBULANCE_ROUTES.FLEET_DISPATCH} replace />} />
    <Route path="dispatch/trip-history" element={<Navigate to={AMBULANCE_ROUTES.FLEET_DISPATCH} replace />} />
    <Route path="dispatch/new-trip" element={<Navigate to={AMBULANCE_ROUTES.FLEET_DISPATCH} replace />} />
    <Route path="vehicles" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ASSETS} replace />} />
    <Route path="vehicles/all" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ASSETS} replace />} />
    <Route path="vehicles/create" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ASSETS} replace />} />
    <Route path="vehicles/service-schedule" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ASSETS} replace />} />
    <Route path="vehicles/:uuid" element={tablePage(VehicleDetail)} />
    <Route path="vehicles/:uuid/edit" element={tablePage(VehicleEdit)} />
    <Route path="crew" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ASSETS} replace />} />
    <Route path="crew/by-vehicle" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ASSETS} replace />} />
    <Route path="crew/by-staff" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ASSETS} replace />} />
    <Route path="crew/assign" element={<Navigate to={AMBULANCE_ROUTES.FLEET_ASSETS} replace />} />
  </Route>,

  <Route key="ambulance-receipts" path="receipts" element={tablePage(MRBillingReview)} />,

  <Route key="ambulance-legacy-dispatch" path="dispatch/*" element={<Navigate to={AMBULANCE_ROUTES.FLEET_DISPATCH} replace />} />,
  <Route key="ambulance-legacy-admin" path="admin/*" element={<Navigate to={AMBULANCE_ROUTES.FLEET} replace />} />,
  <Route
    key="ambulance-legacy-trip-workspace"
    path="trip-workspace/*"
    element={<Navigate to={AMBULANCE_ROUTES.ACTION_CENTER_TRANSPORT} replace />}
  />,
];
