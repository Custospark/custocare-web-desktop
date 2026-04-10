// ProtectedRoutes.tsx
import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import AuthMiddlewareRoute from './middleware/AuthMiddlwareRoute';
import Layout from '../../shared/components/Navigation/Layout';
import { ROUTES, ACCOUNT_ROUTES } from './routeConstants';
import { PLATFORM_ADMIN_ROUTES } from './constants/platform-administration.paths';
import { ProtectedThemeOutlet, SuspenseWrapper, WithThemeProp } from './modules/shared/routeUtils';
import { accountRoutes } from './modules/account';
import { onboardingAndDashboardRoutes } from './modules/shared/OnboardingAndDashboard';
import { pharmacyRoutes } from './modules/pharmacy';
import { medicalRecordsRoutes } from './modules/medical-records';
import { clinicalSpaceManagementRoutes } from './modules/adminstration/clinicalspace';
import { facilitySettingsRoutes } from './modules/adminstration/facility-settings';
import { platformAdminRoutes } from './modules/PlatformAdministration';
import { plansSubscriptionsRoutes } from './modules/adminstration/plans-and-subscriptions';
import { adminRoutes } from './modules/adminstration/admin.routes';
import PlansAndSubscriptions from '../../modules/administration/admin-module/ui/plans-and-subscriptions/PlansAndSubscriptions';
import FacilitySettings from '../../modules/administration/admin-module/ui/facility-settings/FacilitySettings';
import ClinicalSpaceManagement from '../../modules/administration/admin-module/ui/clinical-space/ClinicalSpaceManagement';
import { ADMIN_ROUTES, ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES } from './constants/administration.paths';


// Lazy load modules
const MedicalRecordsModule = React.lazy(
  () => import('../../modules/medical-records/ui/MedicalRecordsModule')
);
const AccountModule = React.lazy(() => import('../../modules/account/AccountModule'));
const AdminModule = React.lazy(
  () => import('../../modules/administration/admin-module/ui/AdminModule')
);
const PharmacyModule = React.lazy(() => import('../../modules/pharmacy/ui/PharmacyModule'));
const NursingModule = React.lazy(() => import('../../modules/nursing/ui/NursingModule'));
const ClinicalModule = React.lazy(() => import('../../modules/clinical/ui/ClinicalModule'));
const LaboratoryModule = React.lazy(() => import('../../modules/laboratory/ui/LaboratoryModule'));
const BillingModule = React.lazy(() => import('../../modules/billling/ui/BillingModule'));
const ModuleAccessMiddleware = React.lazy(() => import('./middleware/ModuleAccessMiddleware'));
const PlatformAdministrationModule = React.lazy(() => import('../../modules/platform-administration/PlatformAdministrationModule'));
import { MEDICAL_RECORDS_ROUTES } from './routeConstants';
import FacilityAdminBillingCycle from '../../modules/billling/ui/billling/FacilityAdminBillingCycle';
import { facilityAdminBillingCycleRoutes } from './modules/adminstration/billing-cycle.routes';
export const ProtectedRoutes = () => [
  <Route key="protected-routes" element={<AuthMiddlewareRoute />}>
    <Route key="restricted-module-codes" element={<ModuleAccessMiddleware />}>
      <Route key="layout" element={<Layout />}>
        <Route key="protected-theme" element={<ProtectedThemeOutlet />}>
          {onboardingAndDashboardRoutes}

          <Route
            key="medical-records"
            path={ROUTES.MEDICAL_RECORDS}
            element={
              <SuspenseWrapper variant="table">
                <MedicalRecordsModule />
              </SuspenseWrapper>
            }
          >
            {/* <Route index element={<Navigate to={ROUTES.MEDICAL_RECORDS} replace />} /> */}
            <Route index element={<Navigate to={MEDICAL_RECORDS_ROUTES.OVERVIEW} replace />} />
            {medicalRecordsRoutes}
          </Route>

          <Route
            key="nursing"
            path={ROUTES.NURSING}
            element={
              <SuspenseWrapper variant="detail">
                <WithThemeProp Component={NursingModule} />
              </SuspenseWrapper>
            }
          />

          <Route
            key="clinical"
            path={ROUTES.CLINICAL}
            element={
              <SuspenseWrapper variant="dashboard">
                <WithThemeProp Component={ClinicalModule} />
              </SuspenseWrapper>
            }
          />

          <Route
            key="laboratory"
            path={ROUTES.LABORATORY}
            element={
              <SuspenseWrapper variant="dashboard">
                <WithThemeProp Component={LaboratoryModule} />
              </SuspenseWrapper>
            }
          />

          <Route
            key="pharmacy"
            path={ROUTES.PHARMACY}
            element={
              <SuspenseWrapper variant="table">
                <WithThemeProp Component={PharmacyModule} />
              </SuspenseWrapper>
            }
          >
            {pharmacyRoutes}
          </Route>

          <Route
            key="billing-module"
            path={ROUTES.BILLING}
            element={
              <SuspenseWrapper variant="dashboard">
                <WithThemeProp Component={BillingModule} />
              </SuspenseWrapper>
            }
          />

          <Route
            key="administration-module"
            path={ROUTES.ADMINISTRATION}
            element={
              <SuspenseWrapper variant="dashboard">
                <WithThemeProp Component={AdminModule} />
              </SuspenseWrapper>
            }
          >
            {adminRoutes}
          <Route
            path={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.ROOT}
            element={
              <SuspenseWrapper variant="detail">
                <WithThemeProp Component={ClinicalSpaceManagement} />
              </SuspenseWrapper>
            }
          >
              {clinicalSpaceManagementRoutes}
          </Route>      
          <Route
            path={ADMIN_ROUTES.BILLING_CYCLE}
            element={
              <SuspenseWrapper variant="detail">
                <WithThemeProp Component={FacilityAdminBillingCycle} />
              </SuspenseWrapper>
            }
          >
              {facilityAdminBillingCycleRoutes}
          </Route>      
          <Route
            path="settings"
            element={
              <SuspenseWrapper variant="detail">
                <WithThemeProp Component={FacilitySettings} />
              </SuspenseWrapper>
            }
          >
              {facilitySettingsRoutes}
          </Route>      
          <Route
            path="plans-subscriptions"
            element={
              <SuspenseWrapper variant="detail">
                <WithThemeProp Component={PlansAndSubscriptions} />
              </SuspenseWrapper>
            }
          >
            {plansSubscriptionsRoutes}
          </Route>      

          </Route>

          <Route
            key="account"
            path={ROUTES.ACCOUNT}
            element={
              <SuspenseWrapper variant="table">
                <WithThemeProp Component={AccountModule} />
              </SuspenseWrapper>
            }
          >
            <Route index element={<Navigate to={ACCOUNT_ROUTES.SETTINGS_PROFILE} replace />} />
            {accountRoutes}
          </Route>

          <Route
            key="platform-administration"
            path={ROUTES.PLATFORM_ADMINISTRATION}
            element={
              <SuspenseWrapper variant="table">
                <WithThemeProp Component={PlatformAdministrationModule} />
              </SuspenseWrapper>
            }
          >
            <Route index element={<Navigate to={PLATFORM_ADMIN_ROUTES.FACILITIES} replace />} />
            {platformAdminRoutes}
          </Route>
        </Route>
      </Route>
    </Route>
  </Route>,
];
