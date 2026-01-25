// ProtectedRoutes.tsx
import React, { Suspense } from 'react';
import { Navigate, Outlet, Route, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';

import AuthMiddlewareRoute from './AuthMiddlwareRoute';
import Layout from '../../shared/components/Navigation/Layout';
import { ROUTES, PHARMACY_ROUTES, ACCOUNT_ROUTES, MEDICAL_RECORDS_ROUTES } from './routeConstants';
import type { RootState } from '../store/store';

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
const LoadingSkeleton = React.lazy(
  () => import('../../shared/components/Loading/LoadingSkeletons')
);

// ============================================================================
// EAGERLY IMPORTED MODULES (Non-lazy for better initial load)
// ============================================================================

import PharmacyModule from '../../modules/pharmacy/ui/PharmacyModule';
import NursingModule from '../../modules/nursing/ui/NursingModule';
import ClinicalModule from '../../modules/clinical/ui/ClinicalModule';
import LaboratoryModule from '../../modules/laboratory/ui/LaboratoryModule';
import BillingModule from '../../modules/billling/ui/BillingModule';
import PatientPortalModule from '../../modules/patient-portal/ui/PatientPortalModule';

// ============================================================================
// PHARMACY MODULE COMPONENTS
// ============================================================================

// Pharmacy Overview & Prescriptions
import PharmacyOverview from '../../modules/pharmacy/ui/overview/PharmacyOverview';
import Prescriptions from '../../modules/pharmacy/ui/precriptions/Prescriptions';
import PharmacyBilling from '../../modules/pharmacy/ui/billing/Billing';

// Pharmacy Inventory
import Inventory from '../../modules/pharmacy/ui/inventory/Inventory';
import AddStock from '../../modules/pharmacy/ui/inventory/AddStock';
import SearchStock from '../../modules/pharmacy/ui/inventory/views/SearchStock';

// Pharmacy Dispensing
import Dispensing from '../../modules/pharmacy/ui/dispensing/Dispensing';
import DispenseMedication from '../../modules/pharmacy/ui/dispensing/dispensing-medication/DispenseMedication';
import ValidatePrescription from '../../modules/pharmacy/ui/dispensing/ValidatePrescription';
import SearchPrescription from '../../modules/pharmacy/ui/dispensing/SearchPrescription';
import DispensingHistory from '../../modules/pharmacy/ui/dispensing/DispensingHistory';
import IssuesQueue from '../../modules/pharmacy/ui/dispensing/IssuesQueue';

// Pharmacy Dispensing Sub-components
import CustomerWalkIn from '../../modules/pharmacy/ui/dispensing/dispensing-medication/views/CustomerWalkIn';
import PatientSearch from '../../modules/pharmacy/ui/dispensing/dispensing-medication/views/PhamarcyPatientSearch';
import QuickPatientCreate from '../../modules/pharmacy/ui/dispensing/dispensing-medication/views/QuickPatientCreate';
import DispensingQueue from '../../modules/pharmacy/ui/dispensing/dispensing-medication/views/DispensingQueue';

// ============================================================================
// ACCOUNT MODULE COMPONENTS
// ============================================================================

import Profile from '../../modules/account/profile/Profile';
import Security from '../../modules/account/security/Security';
import MyInvitations from '../../modules/account/invitations/MyInvitations';
import Message from '../../modules/account/message/Message';
import Appearance from '../../modules/account/apearance/Appearance';
import FrontDesk from '../../modules/medical-records/ui/patients/FrontDesk';
import MedicalRecordsOverView from '../../modules/medical-records/ui/overview/MedicalRecordsOverView';
import MRVisitActionCenter from '../../modules/medical-records/ui/visit-action-center/MRVisitActionCenter';
import MRPatientSearch from '../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientCreate from '../../modules/medical-records/ui/patients/views/MRPatientCreate';
import MRPatientQueue from '../../modules/medical-records/ui/patients/views/MRPatientQueue';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ThemeMode = 'light' | 'dark';

export interface ProtectedOutletContext {
  readonly theme: ThemeMode;
}

interface ThemeProp {
  theme: ThemeMode;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Placeholder panel for unimplemented features
 */
const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);

/**
 * Theme Context Provider
 * 
 * Reads theme from Redux store and provides it to all child routes
 * via React Router Outlet context.
 */
const ProtectedThemeOutlet: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme as ThemeMode);
  return <Outlet context={{ theme } satisfies ProtectedOutletContext} />;
};

/**
 * Theme Prop Injector HOC
 * 
 * Injects theme prop from Outlet context into components that require it.
 * This allows legacy components to receive theme prop without prop drilling.
 */
function WithThemeProp<P extends ThemeProp>({
  Component,
  props,
}: {
  Component: React.ComponentType<P>;
  props?: Omit<P, keyof ThemeProp>;
}): React.ReactElement {
  const { theme } = useOutletContext<ProtectedOutletContext>();
  const mergedProps = { ...(props ?? {}), theme } as P;
  return <Component {...mergedProps} />;
}

/**
 * Suspense Wrapper
 * 
 * Standardized loading wrapper for lazy-loaded components
 */
const SuspenseWrapper: React.FC<{
  children: React.ReactNode;
  variant?: 'dashboard' | 'table' | 'detail';
}> = ({ children, variant = 'dashboard' }) => (
  <Suspense fallback={<LoadingSkeleton variant={variant} />}>
    {children}
  </Suspense>
);

// ============================================================================
// ROUTE CONFIGURATIONS
// ============================================================================

/**
 * Account Module Routes Configuration
 */
const accountRoutes = [
  <Route
    key="account-profile"
    path="profile"
    element={
      <SuspenseWrapper variant="table">
        <Profile />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="account-security"
    path="security"
    element={
      <SuspenseWrapper variant="table">
        <Security />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="account-invitations"
    path="invitations"
    element={
      <SuspenseWrapper variant="table">
        <MyInvitations />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="account-messages"
    path="messages"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Message} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={ACCOUNT_ROUTES.MESSAGES_INBOX} replace />} />
    <Route path="inbox" element={<PlaceholderPanel title="Inbox Messages" />} />
    <Route path="sent" element={<PlaceholderPanel title="Sent Messages" />} />
    <Route path="draft" element={<PlaceholderPanel title="Draft Messages" />} />
    <Route path="trash" element={<PlaceholderPanel title="Trash Messages" />} />
    <Route path="spam" element={<PlaceholderPanel title="Spam Messages" />} />
  </Route>,
  <Route
    key="account-appearance"
    path="appearance"
    element={
      <SuspenseWrapper variant="table">
        <Appearance />
      </SuspenseWrapper>
    }
  />,
];
const medicalRecordsRoutes = [
  <Route
    key="overview"
    path={MEDICAL_RECORDS_ROUTES.OVERVIEW}
    element={
      <SuspenseWrapper variant="table">
        <MedicalRecordsOverView />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="visit-action-center"
    path={MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER}
    element={
      <SuspenseWrapper variant="table">
        <MRVisitActionCenter />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="medical-records-frontdesk"
    path="patients"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FrontDesk} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH} replace />} />
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientSearch} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientCreate} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientQueue} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.WALKIN_PATIENT} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={CustomerWalkIn} />
        </SuspenseWrapper>
      } />
  </Route>,
  <Route
    key="account-appearance"
    path="appearance"
    element={
      <SuspenseWrapper variant="table">
        <Appearance />
      </SuspenseWrapper>
    }
  />,
];

/**
 * Pharmacy Inventory Routes Configuration
 */
const pharmacyInventoryRoutes = [
  <Route
    key="inventory-overview"
    path="overview"
    element={<PlaceholderPanel title="Inventory Stock Overview" />}
  />,
  <Route
    key="inventory-add-stock"
    path="add-stock"
    element={<WithThemeProp Component={AddStock} />}
  />,
  <Route
    key="inventory-search-item"
    path="search-item"
    element={<WithThemeProp Component={SearchStock} />}
  />,
  <Route
    key="inventory-adjust-stock"
    path="adjust-stock"
    element={<PlaceholderPanel title="Adjust Existing Stock" />}
  />,
  <Route
    key="inventory-expired-items"
    path="expired-items"
    element={<PlaceholderPanel title="Expired / Near-Expiry Items" />}
  />,
];

/**
 * Pharmacy Dispensing Routes Configuration
 */
const pharmacyDispensingRoutes = [
    <Route
      key="dispense-medication"
      path="dispense-medication"
      element={<WithThemeProp Component={DispenseMedication} />}
            >
              <Route index element={<Navigate to={PHARMACY_ROUTES.DISPENSING_WALK_IN} replace />} />
              <Route
                key="walk-in"
                path="walk-in"
                element={<WithThemeProp Component={CustomerWalkIn} />}
              />
              <Route
                key="patient-search"
                path="patient-search"
                element={<WithThemeProp Component={PatientSearch} />}
              />
              <Route
                key="quick-create"
                path="quick-create"
                element={<WithThemeProp Component={QuickPatientCreate} />}
              />
              <Route
                key="queue"
                path="queue"
                element={<WithThemeProp Component={DispensingQueue} />}
              />
    </Route>,
    <Route
      key="validate-prescription"
      path="validate-prescription"
      element={<WithThemeProp Component={ValidatePrescription} />}
    />,
    <Route
      key="search-prescription"
      path="search-prescription"
      element={<WithThemeProp Component={SearchPrescription} />}
    />,
    <Route
      key="history"
      path="history"
      element={<WithThemeProp Component={DispensingHistory} />}
    />,
    <Route
      key="issues-queue"
      path="issues-queue"
      element={<WithThemeProp Component={IssuesQueue} />}
    />,
];



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

// ============================================================================
// MAIN PROTECTED ROUTES CONFIGURATION
// ============================================================================

/**
 * Protected Routes Configuration
 * 
 * All routes within this configuration require authentication.
 * The structure follows this hierarchy:
 * 
 * 1. AuthMiddlewareRoute (authentication check)
 * 2. Layout (main application layout)
 * 3. ProtectedThemeOutlet (theme context provider)
 * 4. Individual module routes
 */
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

            {/* =========================
                ACCOUNT MODULE ROUTES
              ========================= */}
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

            {/* =========================
                PHARMACY MODULE ROUTES
              ========================= */}
            <Route
              key="pharmacy"
              path={ROUTES.PHARMACY}
              element={
                <SuspenseWrapper variant="table">
                  <PharmacyModule />
                </SuspenseWrapper>
              }
            >
              <Route 
                index 
                element={<Navigate to={PHARMACY_ROUTES.OVERVIEW} replace />} 
              />

              {/* Pharmacy Overview */}
              <Route
                key="pharmacy-overview"
                path="overview"
                element={
                  <SuspenseWrapper variant="table">
                    <WithThemeProp Component={PharmacyOverview} />
                  </SuspenseWrapper>
                }
              />

              {/* Pharmacy Prescriptions */}
              <Route
                key="pharmacy-prescriptions"
                path="prescriptions"
                element={
                  <SuspenseWrapper variant="table">
                    <WithThemeProp Component={Prescriptions} />
                  </SuspenseWrapper>
                }
              />

              {/* Pharmacy Inventory */}
              <Route
                key="pharmacy-inventory"
                path="inventory"
                element={
                  <SuspenseWrapper variant="table">
                    <WithThemeProp Component={Inventory} />
                  </SuspenseWrapper>
                }
              >
                <Route 
                  index 
                  element={<Navigate to={PHARMACY_ROUTES.INVENTORY_OVERVIEW} replace />} 
                />
                {pharmacyInventoryRoutes}
              </Route>

              {/* Pharmacy Dispensing */}
              <Route
                key="pharmacy-dispensing"
                path="dispensing"
                element={
                  <SuspenseWrapper variant="table">
                    <WithThemeProp Component={Dispensing} />
                  </SuspenseWrapper>
                }
              >
                <Route 
                  index 
                  element={<Navigate to={PHARMACY_ROUTES.DISPENSING_DISPENSE_MEDICATION} replace />} 
                />
                {pharmacyDispensingRoutes}
              </Route>

              {/* Pharmacy Billing */}
              <Route
                key="pharmacy-billing"
                path="billing"
                element={
                  <SuspenseWrapper variant="table">
                    <WithThemeProp Component={PharmacyBilling} />
                  </SuspenseWrapper>
                }
              />
            </Route>

            {/* Specialized Module Routes */}
            {specializedModuleRoutes}
          </Route>
      </Route>
  </Route>,
];
