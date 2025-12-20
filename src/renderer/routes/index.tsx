import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSkeleton from '../components/Loading/LoadingSkeletons';
import { ROUTES } from './routeConstants';
import Layout from '../components/Navigation/Layout';

// Lazy load pages for code splitting and performance optimization

// Authentication Pages
const LoginPage = React.lazy(() => import('../features/auth/Login'));
const SignUpPage = React.lazy(() => import('../features/auth/SignUp'));
const ForgotPasswordPage = React.lazy(() => import('../features/auth/ForgotPassword'));
const ResetPasswordPage = React.lazy(() => import('../features/auth/ResetPassword'));
const TwoFactorAuthPage = React.lazy(() => import('../features/auth/TwoFactorAuthPage'));

// Dashboard & Main Pages
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const PatientList = React.lazy(() => import('../features/patients/PatientList'));
const PatientDetail = React.lazy(() => import('../features/patients/PatientDetail'));

// Error Pages
const NotFound = React.lazy(() => import('../components/Errors/NotFound'));

/**
 * ============================================================================
 * APPLICATION ROUTES CONFIGURATION
 * ============================================================================
 * 
 * Enterprise-Grade Routing Strategy:
 * - Lazy loading for optimal bundle size and performance
 * - Persistent layout across protected routes (no re-initialization)
 * - Loading skeletons for smooth transitions and perceived performance
 * - Clear separation of public/protected routes
 * - Centralized route management via constants
 * - Suspense boundaries for error handling
 * 
 * Route Architecture:
 * 
 * 1. Public Routes (No Authentication Required):
 *    - Login, Sign Up, Forgot Password, Reset Password
 *    - 2FA Verification
 *    - These routes render without the main application layout
 * 
 * 2. Protected Routes (Authentication Required):
 *    - Dashboard, Patients, Encounters, etc.
 *    - Wrapped in persistent Layout component
 *    - Layout includes sidebar, header, and navigation
 *    - Shared layout prevents full app re-initialization
 * 
 * 3. Loading Strategy:
 *    - Suspense with LoadingSkeleton for lazy-loaded components
 *    - Variant-specific skeletons match page type
 *    - Provides instant visual feedback during loading
 * 
 * Security Considerations:
 * - Protected routes should implement authentication guards
 * - Redirect unauthenticated users to login
 * - Preserve intended destination for post-login redirect
 * - Session validation on route changes
 * 
 * @returns {JSX.Element} Application routing configuration
 */
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        {/* 
          ======================================================================
          PUBLIC ROUTES - No Layout, No Authentication Required
          ======================================================================
          These routes are accessible to all users and render without the
          main application layout. Ideal for authentication flows and
          public-facing pages.
        */}
        
        {/* Authentication Routes */}
        <Route 
          path={ROUTES.LOGIN} 
          element={
            <Suspense fallback={<LoadingSkeleton  />}>
              <LoginPage />
            </Suspense>
          } 
        />
        
        <Route 
          path={ROUTES.SIGNUP} 
          element={
            <Suspense fallback={<LoadingSkeleton/>}>
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
            <Suspense fallback={<LoadingSkeleton  />}>
              <TwoFactorAuthPage />
            </Suspense>
          } 
        />

        {/* 
          ======================================================================
          PROTECTED ROUTES - With Persistent Layout
          ======================================================================
          These routes require authentication and render within the main
          application layout. The Layout component persists across route
          changes, preventing unnecessary re-initialization.
          
          TODO: Implement authentication guard/middleware
          - Check authentication status
          - Redirect to login if not authenticated
          - Preserve intended route for post-login redirect
        */}
        
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
          
          {/* Patient Management */}
          <Route 
            path={ROUTES.PATIENTS} 
            element={
              <Suspense fallback={<LoadingSkeleton variant="table" />}>
                <PatientList />
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
          
          {/* Clinical Modules - Placeholder Pages */}
          <Route 
            path={ROUTES.ENCOUNTERS} 
            element={
              <Suspense fallback={<LoadingSkeleton variant="table" />}>
                <div className="p-8">
                  <h1 className="text-3xl font-bold text-white">Encounters</h1>
                  <p className="text-gray-400 mt-2">Clinical encounters management coming soon...</p>
                </div>
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

        {/* 
          ======================================================================
          SPECIAL ROUTES
          ======================================================================
        */}
        
        {/* Root redirect to dashboard (or login if not authenticated) */}
        <Route 
          path={ROUTES.HOME} 
          element={<Navigate to={ROUTES.DASHBOARD} replace />} 
        />

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