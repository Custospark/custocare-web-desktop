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
const ClinicalEncounterModule = React.lazy(() => import('../../shared/features/clinical/ClinicalEncounterModule'));
const ReceptionistDashboard = React.lazy(() => import('../../shared/features/receptionist/ReceptionistDashboard'));
const HospitalBillReceipt = React.lazy(() => import('../../shared/features/billing/HospitalBillReceipt'));
const AccountModule= React.lazy(() => import('../../modules/account/AccountModule'));
const AdminModule= React.lazy(() => import('../../modules/administration/admin-module/ui/AdminModule'));
const LoadingSkeleton= React.lazy(() => import('../../shared/components/Loading/LoadingSkeletons'));
// const PharmacyModule= React.lazy(() => import('../../modules/pharmacy/ui/PharmacyModule'));
import PharmacyModule from '../../modules/pharmacy/ui/PharmacyModule';

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
      
      {/* Clinical Modules - Doctor/Nurse roles */}
      <Route 
        path={ROUTES.ENCOUNTERS} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
              <ClinicalEncounterModule />
          </Suspense>
        } 
        key="encounters"
      />
      {/* Account Modules - For all system users. */}
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
      
      {/* Analytics & Reporting - Admin/Supervisor roles */}
      <Route 
        path={ROUTES.REPORTS} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <div className="p-8">
                <h1 className="text-3xl font-bold text-white">Reports</h1>
                <p className="text-gray-400 mt-2">Clinical reports and analytics coming soon...</p>
              </div>
          </Suspense>
        } 
        key="reports"
      />
      
      <Route 
        path={ROUTES.ANALYTICS} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <div className="p-8">
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="text-gray-400 mt-2">Advanced analytics dashboard coming soon...</p>
              </div>
          </Suspense>
        } 
        key="analytics"
      />
      
      {/* System - Admin only */}
      <Route 
        path={ROUTES.SYSTEM} 
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <div className="p-8">
                <h1 className="text-3xl font-bold text-white">System</h1>
                <p className="text-gray-400 mt-2">System configuration and management coming soon...</p>
              </div>
          </Suspense>
        } 
        key="system"
      />
      
      {/* Role-Based Modules */}
      <Route
        path={ROUTES.FRONT_DESK}
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <ReceptionistDashboard />
          </Suspense>
        }
        key="front-desk"
      />

      <Route
        path={ROUTES.NURSING}
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <div className="p-8">
                <h1 className="text-3xl font-bold text-white">Nursing Station</h1>
                <p className="text-gray-400 mt-2">Vitals, triage & ward workflows coming soon.</p>
              </div>
          </Suspense>
        }
        key="nursing"
      />

      <Route
        path={ROUTES.CLINICAL_WORKSPACE}
        element={
          <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
              <div className="p-8">
                <h1 className="text-3xl font-bold text-white">Clinical Workspace</h1>
                <p className="text-gray-400 mt-2">Doctor consultations & AI-assisted diagnosis coming soon.</p>
              </div>
          </Suspense>
        }
        key="clinical-workspace"
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