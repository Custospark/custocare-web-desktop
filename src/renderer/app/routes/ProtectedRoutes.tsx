// ProtectedRoutes.tsx
import React, { Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import AuthMiddlewareRoute from './AuthMiddlwareRoute';
import Layout from '../../shared/components/Navigation/Layout';
import { ROUTES, PHARMACY_ROUTES } from './routeConstants';

// Lazy load protected components
const Dashboard = React.lazy(() => import('../../shared/pages/Dashboard'));
const FacilityOnboardingModule = React.lazy(() => import('../../shared/features/facilities/FacilityOnboardingModule'));
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

// Pharmacy operation screens (these were previously rendered via switch)
import PharmacyOverview from '../../modules/pharmacy/ui/overview/PharmacyOverview';
import Prescriptions from '../../modules/pharmacy/ui/precriptions/Prescriptions';
import Inventory from '../../modules/pharmacy/ui/inventory/Inventory';
import Dispensing from '../../modules/pharmacy/ui/dispensing/Dispensing';
import PharmacyBilling from '../../modules/pharmacy/ui/billing/Billing';

// Inventory action screens (previously in Inventory switch)
import AddStock from '../../modules/pharmacy/ui/inventory/AddStock';
import SearchStock from '../../modules/pharmacy/ui/inventory/views/SearchStock';

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">Temporary placeholder. Replace with real implementation.</p>
  </div>
);

export const ProtectedRoutes = () => [
  <Route element={<AuthMiddlewareRoute />} key="protected-routes">
    <Route element={<Layout />} key="layout">
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" theme="light" />}>
            <Dashboard />
          </Suspense>
        }
        key="dashboard"
      />

      <Route
        path={ROUTES.PATIENT_DASHBOARD}
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" theme="light" />}>
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
        key="medical_records"
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
              <PharmacyOverview theme="light" />
            </Suspense>
          }
        />

        <Route
          path="prescriptions"
          element={
            <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <Prescriptions theme="light" />
            </Suspense>
          }
        />

        {/* Inventory becomes a nested layout */}
        <Route
          path="inventory"
          element={
            <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <Inventory theme="light" />
            </Suspense>
          }
        >
          <Route index element={<Navigate to={PHARMACY_ROUTES.INVENTORY_OVERVIEW} replace />} />
          <Route path="overview" element={<PlaceholderPanel title="Inventory Stock Overview" />} />
          <Route path="add-stock" element={<AddStock theme="light" />} />
          <Route path="search-item" element={<SearchStock theme="light" />} />
          <Route path="adjust-stock" element={<PlaceholderPanel title="Adjust Existing Stock" />} />
          <Route path="expired-items" element={<PlaceholderPanel title="Expired / Near-Expiry Items" />} />
        </Route>

        <Route
          path="dispensing"
          element={
            <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <Dispensing theme="light" />
            </Suspense>
          }
        />

        <Route
          path="billing"
          element={
            <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <PharmacyBilling theme="light" />
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
  </Route>,
];
