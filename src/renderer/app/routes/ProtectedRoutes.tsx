// ProtectedRoutes.tsx
import React from 'react';
import { Navigate, Route } from 'react-router-dom';

import AuthMiddlewareRoute from './AuthMiddlwareRoute';
import Layout from '../../shared/components/Navigation/Layout';
import { ROUTES, ACCOUNT_ROUTES } from './routeConstants';
import { ProtectedThemeOutlet } from './modules/routeUtils';
import { accountRoutes } from './modules/account';

// ============================================================================
// LAZY LOADED COMPONENTS - CORE MODULES
// ============================================================================

const Dashboard = React.lazy(() => import('../../shared/pages/Dashboard'));
const FacilityOnboardingModule = React.lazy(
  () => import('../../shared/features/facilities/FacilityOnboardingModule')
);
const MedicalRecordsModule = React.lazy(
  () => import('../../modules/medical-records/ui/MedicalRecordsModule')
);
const AccountModule = React.lazy(() => import('../../modules/account/AccountModule'));
const AdminModule = React.lazy(
  () => import('../../modules/administration/admin-module/ui/AdminModule')
);
import { pharmacyRoutes } from './modules/pharmacy';

import PharmacyModule from '../../modules/pharmacy/ui/PharmacyModule';
import NursingModule from '../../modules/nursing/ui/NursingModule';
import ClinicalModule from '../../modules/clinical/ui/ClinicalModule';
import LaboratoryModule from '../../modules/laboratory/ui/LaboratoryModule';
import BillingModule from '../../modules/billling/ui/BillingModule';
import PatientPortalModule from '../../modules/patient-portal/ui/PatientPortalModule';



import { medicalRecordsRoutes } from './modules/medical-records';

import { SuspenseWrapper } from './modules/routeUtils';
import { WithThemeProp } from './modules/routeUtils';


/**
 * Core Application Routes Configuration
 */
const coreRoutes = [
  <Route
    key="dashboard"
    path={ROUTES.DASHBOARD}
    element={
      <SuspenseWrapper variant="dashboard">
        <Dashboard />
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
  />,
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
  />,
  <Route
    key="nursing"
    path={ROUTES.NURSING}
    element={
      <SuspenseWrapper variant="detail">
        <NursingModule />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="clinical"
    path={ROUTES.CLINICAL}
    element={
      <SuspenseWrapper variant="dashboard">
        <ClinicalModule />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="laboratory"
    path={ROUTES.LABORATORY}
    element={
      <SuspenseWrapper variant="dashboard">
      <WithThemeProp Component={LaboratoryModule} />
     </SuspenseWrapper>
    }
  />,
];



/**
 * Specialized Module Routes
 */
const specializedModuleRoutes = [
  <Route
    key="billing-module"
    path={ROUTES.BILLING}
    element={
      <SuspenseWrapper variant="dashboard">
        <BillingModule />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="administration-module"
    path={ROUTES.ADMINISTRATION}
    element={
      <SuspenseWrapper variant="dashboard">
        <AdminModule />
      </SuspenseWrapper>
    }
  />,
];

export const ProtectedRoutes = () => [
  <Route
    key="protected-routes"
    element={<AuthMiddlewareRoute />}
  >
      <Route
        key="layout"
        element={<Layout />}
      >
          <Route
            key="protected-theme"
            element={<ProtectedThemeOutlet />}
          >
            {/* Core Application Routes */}
            {coreRoutes}
            <Route
              key="account"
              path={ROUTES.ACCOUNT}
              element={
                <SuspenseWrapper variant="table">
                  <AccountModule />
                </SuspenseWrapper>
              }
            >
              <Route 
                index 
                element={<Navigate to={ACCOUNT_ROUTES.PROFILE} replace />} 
              />
              {accountRoutes}
            </Route>
            <Route
              key="medical-records"
              path={ROUTES.MEDICAL_RECORDS}
              element={
                <SuspenseWrapper variant="table">
                  <MedicalRecordsModule />
                </SuspenseWrapper>
              }
            >
              <Route 
                index 
                element={<Navigate to={ROUTES.MEDICAL_RECORDS} replace />} 
              />
              {medicalRecordsRoutes}
            </Route>
            <Route
              key="pharmacy"
              path={ROUTES.PHARMACY}
              element={
                <SuspenseWrapper variant="table">
                  <PharmacyModule />
                </SuspenseWrapper>
              }
            >
              {pharmacyRoutes}
            </Route>

            {/* Specialized Module Routes */}
            {specializedModuleRoutes}
          </Route>
      </Route>
  </Route>,
];
