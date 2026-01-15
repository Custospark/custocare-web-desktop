// ProtectedRoutes.tsx
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import AuthMiddlewareRoute from './AuthMiddlwareRoute';
import Layout from '../../shared/components/Navigation/Layout';
import { ROUTES } from './routeConstants';
// Lazy load protected components
const Dashboard = React.lazy(() => import('../../shared/pages/Dashboard'));
const FacilityOnboardingModule = React.lazy(() => import('../../shared/features/facilities/FacilityOnboardingModule'));
const PatientModule = React.lazy(() => import('../../shared/features/patients/PatientModule'));
const MedicalRecordsModule = React.lazy(() => import('../../modules/medical-records/ui/MedicalRecordsModule'));
const HospitalBillReceipt = React.lazy(() => import('../../shared/features/billing/HospitalBillReceipt'));
const AccountModule= React.lazy(() => import('../../modules/account/AccountModule'));
const AdminModule= React.lazy(() => import('../../modules/administration/admin-module/ui/AdminModule'));
const LoadingSkeleton= React.lazy(() => import('../../shared/components/Loading/LoadingSkeletons'));
// const PharmacyModule= React.lazy(() => import('../../modules/pharmacy/ui/PharmacyModule'));
import PharmacyModule from '../../modules/pharmacy/ui/PharmacyModule';
import NursingModule from '../../modules/nursing/ui/NursingModule';
import ClinicalModule from '../../modules/clinical/ui/ClinicalModule';
import LaboratoryModule from '../../modules/laboratory/ui/LaboratoryModule';

/**
 * Protected Routes Configuration
 * All routes require authentication
 */
export const ProtectedRoutes = () => [
    

  <Route 
    element={
      <AuthMiddlewareRoute />
    }
    key="protected-routes"
  >
    <Route element={<Layout />} key="layout">
      {/* Dashboard - Available to all authenticated users */}
      <Route 
        path={ROUTES.DASHBOARD} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" theme='light'/>}>
            <Dashboard />
          </Suspense>
        } 
        key="dashboard"
      />
      
      {/* Facility Management - Admin/Supervisor roles only */}
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
      
      {/* Patient Management - Clinical/Admin roles */}
      <Route 
        path={ROUTES.PATIENTS} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <PatientModule />
          </Suspense>
        } 
        key="patients"
      />
      
      <Route 
        path={ROUTES.MEDICAL_RECORDS} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="detail" />}>
              <MedicalRecordsModule />
          </Suspense>
        } 
        key="patient-detail"
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
      
      {/* Clinical Modules - Doctor/Nurse roles */}
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
      {/**Pharmacy Module */}
      <Route 
        path={ROUTES.PHARMACY} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <PharmacyModule />
          </Suspense>
        } 
        key="encounters"
      />

      {/* Billing - Billing/Admin roles */}
      <Route
        path={ROUTES.BILLING}
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <HospitalBillReceipt />
          </Suspense>
        }
        key="billing"
      />

      {/* Administration - Admin only */}
      <Route
        path={ROUTES.ADMINISTRATION}
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
             <AdminModule/>
          </Suspense>
        }
        key="administration"
      />
      
      {/* Common routes for all authenticated users */}
      <Route 
        path={ROUTES.SETTINGS} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="detail" />}>
            <div className="p-8">
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400 mt-2">User settings and preferences coming soon...</p>
            </div>
          </Suspense>
        } 
        key="settings"
      />
      
      <Route 
        path={ROUTES.HELP} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="detail" />}>
            <div className="p-8">
              <h1 className="text-3xl font-bold text-white">Help & Support</h1>
              <p className="text-gray-400 mt-2">Documentation and support resources coming soon...</p>
            </div>
          </Suspense>
        } 
        key="help"
      />
    </Route>
  </Route>
];