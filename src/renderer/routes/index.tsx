// src/routes/AppRoutes.tsx
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSkeleton from '../components/Loading/LoadingSkeletons';
import { ROUTES } from './routeConstants';
import Layout from '../components/Navigation/Layout';

// Lazy load pages for code splitting
const LoginPage = React.lazy(() => import('../features/auth/Login'));
const SignUpPage = React.lazy(() => import('../features/auth/SignUp'));
const ForgotPasswordPage = React.lazy(() => import('../features/auth/ForgotPassword'));
const ResetPasswordPage = React.lazy(() => import('../features/auth/ResetPassword'));
const TwoFactorAuthPage = React.lazy(() => import('../features/auth/TwoFactorAuthPage'));
const FacilityOnboardingModule = React.lazy(() => import('../features/facilities/FacilityOnboardingModule'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const PatientModule = React.lazy(() => import('../features/patients/PatientModule'));
const PatientDetail = React.lazy(() => import('../features/patients/PatientDetail'));
const ClinicalEncounterModule = React.lazy(() => import('../features/clinical/ClinicalEncounterModule'));
const NotFound = React.lazy(() => import('../components/Errors/NotFound'));

/**
 * Application Routes Configuration
 * 
 * Architecture:
 * 1. Public routes (no authentication, no layout)
 * 2. Protected routes (authentication required, with layout)
 * 3. Catch-all 404 route
 * 
 * Note: All routes use HashRouter syntax (#/path)
 */
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        {/* ============================================= */}
        {/* PUBLIC ROUTES - No Authentication Required */}
        {/* ============================================= */}
        
        {/* Default route - redirects to login or dashboard based on auth state */}
        <Route 
          path={ROUTES.HOME} 
          element={<Navigate to={ROUTES.LOGIN} replace />}
        />
        
        <Route 
          path={ROUTES.LOGIN} 
          element={
            <Suspense fallback={<LoadingSkeleton />}>
              <LoginPage />
            </Suspense>
          } 
        />
        
        <Route 
          path={ROUTES.SIGNUP} 
          element={
            <Suspense fallback={<LoadingSkeleton />}>
              <SignUpPage />
            </Suspense>
          } 
        />
        
        <Route 
          path={ROUTES.FORGOT_PASSWORD} 
          element={
            <Suspense fallback={<LoadingSkeleton />}>
              <ForgotPasswordPage />
            </Suspense>
          } 
        />
        
        <Route 
          path={ROUTES.RESET_PASSWORD} 
          element={
            <Suspense fallback={<LoadingSkeleton />}>
              <ResetPasswordPage />
            </Suspense>
          } 
        />
        
        <Route 
          path={ROUTES.TWO_FACTOR_AUTH} 
          element={
            <Suspense fallback={<LoadingSkeleton />}>
              <TwoFactorAuthPage />
            </Suspense>
          } 
        />

        {/* ============================================= */}
        {/* PROTECTED ROUTES - With Layout & Authentication */}
        {/* ============================================= */}
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

        {/* ============================================= */}
        {/* ERROR & CATCH-ALL ROUTES */}
        {/* ============================================= */}
        
        {/* 404 Not Found - Catch all unmatched routes */}
        <Route 
          path="*" 
          element={
            <Suspense fallback={<LoadingSkeleton />}>
              <NotFound />
            </Suspense>
          } 
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;