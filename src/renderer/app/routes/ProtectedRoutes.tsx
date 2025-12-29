// src/routes/ProtectedRoutes.tsx
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import Layout from '../../shared/components/Navigation/Layout';
import LoadingSkeleton from '../../shared/components/Loading/LoadingSkeletons';
import { ROUTES } from './routeConstants';

// Lazy load protected components
const Dashboard = React.lazy(() => import('../../shared/pages/Dashboard'));
const FacilityOnboardingModule = React.lazy(() => import('../../shared/features/facilities/FacilityOnboardingModule'));
const PatientModule = React.lazy(() => import('../../shared/features/patients/PatientModule'));
const PatientDetail = React.lazy(() => import('../../shared/features/patients/PatientDetail'));
const ClinicalEncounterModule = React.lazy(() => import('../../shared/features/clinical/ClinicalEncounterModule'));
const ReceptionistDashboard = React.lazy(() => import('../../shared/features/receptionist/ReceptionistDashboard'));
const HospitalBillReceipt = React.lazy(() => import('../../shared/features/billing/HospitalBillReceipt'));
// Import other lazy-loaded components...

/**
 * Protected Routes Configuration
 * 
 * All routes in this file are PROTECTED (authentication required)
 * They all use the Layout component as a wrapper
 */
export const ProtectedRoutes = () => (
  <Route element={<Layout />}>
    {/* Dashboard */}
    <Route 
      path={ROUTES.DASHBOARD} 
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <Dashboard />
        </Suspense>
      } 
    />
    
    {/* Facility Management */}
    <Route 
      path={ROUTES.FACILITIES} 
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <FacilityOnboardingModule />
        </Suspense>
      } 
    />

    <Route 
      path={ROUTES.FACILITY_ONBOARDING} 
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <FacilityOnboardingModule />
        </Suspense>
      } 
    />
    
    {/* Patient Management */}
    <Route 
      path={ROUTES.PATIENTS} 
      element={
        <Suspense fallback={<LoadingSkeleton variant="table" />}>
          <PatientModule />
        </Suspense>
      } 
    />
    
    <Route 
      path={ROUTES.PATIENT_DETAIL} 
      element={
        <Suspense fallback={<LoadingSkeleton variant="detail" />}>
          <PatientDetail />
        </Suspense>
      } 
    />
    
    {/* Clinical Modules */}
    <Route 
      path={ROUTES.ENCOUNTERS} 
      element={
        <Suspense fallback={<LoadingSkeleton variant="table" />}>
          <ClinicalEncounterModule />
        </Suspense>
      } 
    />
    
    {/* Analytics & Reporting */}
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
    />
    
    {/* System & Administration */}
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
    />
    
    {/* Role-Based Modules */}
    <Route
      path={ROUTES.FRONT_DESK}
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <ReceptionistDashboard />
        </Suspense>
      }
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
    />

    <Route
      path={ROUTES.LABORATORY}
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white">Laboratory</h1>
            <p className="text-gray-400 mt-2">Lab orders, tests & results under development.</p>
          </div>
        </Suspense>
      }
    />

    <Route
      path={ROUTES.PHARMACY}
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white">Pharmacy</h1>
            <p className="text-gray-400 mt-2">Medication dispensing workflows coming soon.</p>
          </div>
        </Suspense>
      }
    />

    <Route
      path={ROUTES.BILLING}
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <HospitalBillReceipt />
        </Suspense>
      }
    />

    <Route
      path={ROUTES.CLINICAL_SERVICES}
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white">Clinical Services</h1>
            <p className="text-gray-400 mt-2">Radiology & specialized services coming soon.</p>
          </div>
        </Suspense>
      }
    />

    <Route
      path={ROUTES.ADMINISTRATION}
      element={
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white">Administration</h1>
            <p className="text-gray-400 mt-2">User management, roles & system governance.</p>
          </div>
        </Suspense>
      }
    />
    
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
    />
    
    <Route 
      path={ROUTES.SECURITY} 
      element={
        <Suspense fallback={<LoadingSkeleton variant="detail" />}>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white">Security</h1>
            <p className="text-gray-400 mt-2">Security settings and audit logs coming soon...</p>
          </div>
        </Suspense>
      } 
    />
    
    {/* Support & Help */}
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
    />
  </Route>
);