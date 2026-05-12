// ProtectedRoutes.tsx
import React from 'react';
import { Route } from 'react-router-dom';
import { SuspenseWrapper } from "./routeUtils";
import { ROUTES } from "../../routeConstants";
import PatientPortalModule from '../../../../modules/patient-portal/ui/PatientPortalModule';
import { patientPortalRoutes } from "../patient-portal";
const Dashboard = React.lazy(() => import('../../../../shared/pages/Dashboard'));
const FacilityOnboardingModule = React.lazy(
  () => import('../../../../shared/features/facilities/FacilityOnboardingModule'));
  import { WithThemeProp } from './routeUtils';

/**
 * Core Application Routes Configuration
 */
export const onboardingAndDashboardRoutes = [
  <Route
    key="dashboard"
    path={ROUTES.DASHBOARD}
    element={
      <SuspenseWrapper variant="dashboard">
        <WithThemeProp Component={Dashboard}></WithThemeProp>
      </SuspenseWrapper>
    }
  />,
  <Route
    key="patient-dashboard"
    path={ROUTES.PATIENT_DASHBOARD}
    element={
      <SuspenseWrapper variant="dashboard">
        <PatientPortalModule />
      </SuspenseWrapper>
    }
  >
    {patientPortalRoutes}
  </Route>,
  <Route
    key="facilities"
    path={ROUTES.FACILITIES}
    element={
      <SuspenseWrapper variant="dashboard">
        <FacilityOnboardingModule />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="facility-onboarding"
    path={ROUTES.FACILITY_ONBOARDING}
    element={
      <SuspenseWrapper variant="dashboard">
        <FacilityOnboardingModule />
      </SuspenseWrapper>
    }
  />
];