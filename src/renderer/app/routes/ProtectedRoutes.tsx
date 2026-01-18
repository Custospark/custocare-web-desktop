// ProtectedRoutes.tsx
import React, { Suspense } from 'react';
import { Navigate, Outlet, Route, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';

import AuthMiddlewareRoute from './AuthMiddlwareRoute';
import Layout from '../../shared/components/Navigation/Layout';
import { ROUTES, PHARMACY_ROUTES } from './routeConstants';
import type { RootState } from '../store/store';

// Lazy load protected components
const Dashboard = React.lazy(() => import('../../shared/pages/Dashboard'));
const FacilityOnboardingModule = React.lazy(
  () => import('../../shared/features/facilities/FacilityOnboardingModule')
);
const MedicalRecordsModule = React.lazy(() => import('../../modules/medical-records/ui/MedicalRecordsModule'));
const AccountModule = React.lazy(() => import('../../modules/account/AccountModule'));
const AdminModule = React.lazy(() => import('../../modules/administration/admin-module/ui/AdminModule'));
const LoadingSkeleton = React.lazy(() => import('../../shared/components/Loading/LoadingSkeletons'));

import PharmacyModule from '../../modules/pharmacy/ui/PharmacyModule';
import NursingModule from '../../modules/nursing/ui/NursingModule';
import ClinicalModule from '../../modules/clinical/ui/ClinicalModule';
import LaboratoryModule from '../../modules/laboratory/ui/LaboratoryModule';
import BillingModule from '../../modules/billling/ui/BillingModule';
import PatientPortalModule from '../../modules/patient-portal/ui/PatientPortalModule';

// Pharmacy operation screens
import PharmacyOverview from '../../modules/pharmacy/ui/overview/PharmacyOverview';
import Prescriptions from '../../modules/pharmacy/ui/precriptions/Prescriptions';
import Inventory from '../../modules/pharmacy/ui/inventory/Inventory';
import Dispensing from '../../modules/pharmacy/ui/dispensing/Dispensing';
import PharmacyBilling from '../../modules/pharmacy/ui/billing/Billing';

// Inventory action screens
import AddStock from '../../modules/pharmacy/ui/inventory/AddStock';
import SearchStock from '../../modules/pharmacy/ui/inventory/views/SearchStock';

/**
 * ============================================================================
 * Outlet Context (Type Safe)
 * ============================================================================
 * Any nested route component can access theme by:
 *   const { theme } = useOutletContext<ProtectedOutletContext>();
 */
export type ThemeMode = 'light' | 'dark';

export type ProtectedOutletContext = Readonly<{
  theme: ThemeMode;
}>;

/**
 * ============================================================================
 * High-level Theme Provider for Protected Routes
 * ============================================================================
 * - Reads theme from Redux ONCE
 * - Provides it via Outlet context to all nested protected routes
 * - Avoids prop drilling and avoids hardcoding theme="light"
 */
const ProtectedThemeOutlet: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme) as ThemeMode;
  return <Outlet context={{ theme } satisfies ProtectedOutletContext} />;
};

/**
 * ============================================================================
 * Small helpers for screens that currently require `theme` prop
 * ============================================================================
 * We keep this inside the same file (no new files) and keep everything clean.
 */
const useThemeFromProtectedOutlet = (): ThemeMode => {
  const { theme } = useOutletContext<ProtectedOutletContext>();
  return theme;
};

const PharmacyOverviewRoute: React.FC = () => {
  const theme = useThemeFromProtectedOutlet();
  return <PharmacyOverview theme={theme} />;
};

const PrescriptionsRoute: React.FC = () => {
  const theme = useThemeFromProtectedOutlet();
  return <Prescriptions theme={theme} />;
};

const DispensingRoute: React.FC = () => {
  const theme = useThemeFromProtectedOutlet();
  return <Dispensing theme={theme} />;
};

const PharmacyBillingRoute: React.FC = () => {
  const theme = useThemeFromProtectedOutlet();
  return <PharmacyBilling theme={theme} />;
};

const InventoryRoute: React.FC = () => {
  const theme = useThemeFromProtectedOutlet();
  return <Inventory theme={theme} />;
};

const AddStockRoute: React.FC = () => {
  const theme = useThemeFromProtectedOutlet();
  return <AddStock theme={theme} />;
};

const SearchStockRoute: React.FC = () => {
  const theme = useThemeFromProtectedOutlet();
  return <SearchStock theme={theme} />;
};

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);

/**
 * ============================================================================
 * Protected Routes Configuration
 * ============================================================================
 * - AuthMiddlewareRoute protects everything below
 * - Layout provides global navigation UI
 * - ProtectedThemeOutlet applies theme context at a high nesting level
 * - Pharmacy uses nested routes for scalable, deep-linkable navigation
 */
export const ProtectedRoutes = () => [
  <Route element={<AuthMiddlewareRoute />} key="protected-routes">
    <Route element={<Layout />} key="layout">
      {/* Theme is applied at this level for everything under Layout */}
      <Route element={<ProtectedThemeOutlet />} key="protected-theme-outlet">
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <Dashboard />
            </Suspense>
          }
          key="dashboard"
        />

        <Route
          path={ROUTES.PATIENT_DASHBOARD}
          element={
            <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <PatientPortalModule />
            </Suspense>
          }
          key="patient-portal-dashboard"
        />

        <Route
          path={ROUTES.FACILITIES}
          element={
            <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <FacilityOnboardingModule />
            </Suspense>
          }
          key="facilities"
        />

        <Route
          path={ROUTES.FACILITY_ONBOARDING}
          element={
            <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <FacilityOnboardingModule />
            </Suspense>
          }
          key="facility-onboarding"
        />

        <Route
          path={ROUTES.MEDICAL_RECORDS}
          element={
            <Suspense fallback={<LoadingSkeleton variant="detail" />}>
              <MedicalRecordsModule />
            </Suspense>
          }
          key="medical-records"
        />

        <Route
          path={ROUTES.NURSING}
          element={
            <Suspense fallback={<LoadingSkeleton variant="detail" />}>
              <NursingModule />
            </Suspense>
          }
          key="nursing"
        />

        <Route
          path={ROUTES.CLINICAL}
          element={
            <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <ClinicalModule />
            </Suspense>
          }
          key="clinical"
        />

        <Route
          path={ROUTES.LABORATORY}
          element={
            <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <LaboratoryModule />
            </Suspense>
          }
          key="laboratory"
        />

        <Route
          path={ROUTES.ACCOUNT}
          element={
            <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <AccountModule />
            </Suspense>
          }
          key="account"
        />

        {/* =========================
            Pharmacy (nested routes)
           ========================= */}
        <Route
          path={ROUTES.PHARMACY}
          element={
            <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <PharmacyModule />
            </Suspense>
          }
          key="pharmacy"
        >
          {/* Default pharmacy route */}
          <Route index element={<Navigate to={PHARMACY_ROUTES.OVERVIEW} replace />} />

          <Route
            path="overview"
            element={
              <Suspense fallback={<LoadingSkeleton variant="table" />}>
                <PharmacyOverviewRoute />
              </Suspense>
            }
          />

          <Route
            path="prescriptions"
            element={
              <Suspense fallback={<LoadingSkeleton variant="table" />}>
                <PrescriptionsRoute />
              </Suspense>
            }
          />

          <Route
            path="inventory"
            element={
              <Suspense fallback={<LoadingSkeleton variant="table" />}>
                <InventoryRoute />
              </Suspense>
            }
          >
            <Route index element={<Navigate to={PHARMACY_ROUTES.INVENTORY_OVERVIEW} replace />} />
            <Route path="overview" element={<PlaceholderPanel title="Inventory Stock Overview" />} />
            <Route path="add-stock" element={<AddStockRoute />} />
            <Route path="search-item" element={<SearchStockRoute />} />
            <Route path="adjust-stock" element={<PlaceholderPanel title="Adjust Existing Stock" />} />
            <Route path="expired-items" element={<PlaceholderPanel title="Expired / Near-Expiry Items" />} />
          </Route>

          <Route
            path="dispensing"
            element={
              <Suspense fallback={<LoadingSkeleton variant="table" />}>
                <DispensingRoute />
              </Suspense>
            }
          />

          <Route
            path="billing"
            element={
              <Suspense fallback={<LoadingSkeleton variant="table" />}>
                <PharmacyBillingRoute />
              </Suspense>
            }
          />
        </Route>

        <Route
          path={ROUTES.BILLING}
          element={
            <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <BillingModule />
            </Suspense>
          }
          key="billing"
        />

        <Route
          path={ROUTES.ADMINISTRATION}
          element={
            <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <AdminModule />
            </Suspense>
          }
          key="administration"
        />
      </Route>
    </Route>
  </Route>,
];
