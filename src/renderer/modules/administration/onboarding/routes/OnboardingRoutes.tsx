// src/routes/AuthRoutes.tsx
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons'; 
import LoadingScreen from '../../../../shared/components/Loading/LoadingScreen';
import { ROUTES } from './onboardingRouteConstants';
import { patientPortalRoutes } from '../../../../app/routes/modules/patient-portal';

// Lazy load auth pages
const LoginPage = React.lazy(() => import('../ui/auth/Login'));
const SignUpPage = React.lazy(() => import('../ui/auth/SignUp'));
const ForgotPasswordPage = React.lazy(() => import('../ui/auth/ForgotPassword'));
const ResetPasswordPage = React.lazy(() => import('../ui/auth/ResetPassword'));
const TwoFactorAuthPage = React.lazy(() => import('../ui/auth/TwoFactorAuthPage'));
const RoleSelectionScreen = React.lazy(() => import('../ui/role-based-ui/RoelSelectionScreen'));
const PatientOnboarding = React.lazy(() => import('../ui/role-based-ui/PatientOnboarding'));
const MedicalProfessionalOnboarding = React.lazy(() => import('../ui/role-based-ui/MedicalProfessionalOnboarding'));
const HealthcareFacilityOnboarding = React.lazy(() => import('../ui/role-based-ui/HealthcareFacilityOnboarding'));
const PortalSelector = React.lazy(() => import('../ui/role-based-ui/PortalSelector'));
const Dashboard = React.lazy(() => import('../../../../shared/pages/Dashboard'));
import Layout from '../../../../shared/components/Navigation/Layout';
import Landing from '../ui/role-based-ui/Landing';
import PatientPortalModule from '../../../patient-portal/ui/PatientPortalModule';
import PasswordResetSuccess from '../ui/auth/PasswordResetSuccess';

/**
 * Authentication Routes Configuration
 * Returns an array of Route components
 */
export const OnboardingRoutes = () => [
  // Home/Landing routes
  <Route 
    key="home"
    path={ROUTES.HOME}
    element={
      <Suspense fallback={<LoadingScreen />}>
        <Landing />
      </Suspense>
    } 
  />,
  
  <Route 
    key="landing"
    path={ROUTES.LANDING} 
    element={
      <Suspense fallback={<LoadingScreen />}>
        <Landing />
      </Suspense>
    } 
  />,
  
  // Auth routes
  <Route 
    key="signup"
    path={ROUTES.SIGNUP} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <SignUpPage />
      </Suspense>
    } 
  />,
  
  <Route 
    key="login"
    path={ROUTES.LOGIN} 
    element={
      <Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </Suspense>
    } 
  />,
  
  <Route 
    key="forgot-password"
    path={ROUTES.FORGOT_PASSWORD} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <ForgotPasswordPage />
      </Suspense>
    } 
  />,
  
  <Route 
    key="reset-password"
    path={ROUTES.RESET_PASSWORD} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <ResetPasswordPage />
      </Suspense>
    } 
  />,
  
  <Route 
    key="two-factor-auth"
    path={ROUTES.TWO_FACTOR_AUTH} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <TwoFactorAuthPage />
      </Suspense>
    } 
  />,
  
  <Route 
    key="password-reset-success"
    path={ROUTES.RESET_PASSWORD_SUCCESS} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <PasswordResetSuccess />
      </Suspense>
    } 
  />,
  
  // Protected routes (these will be handled by ProtectedRoute in main router)
  <Route 
    key="portal-selector"
    path={ROUTES.PORTAL_SELECTOR} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <PortalSelector />
      </Suspense>
    } 
  />,
  
  <Route 
    key="role-selection"
    path={ROUTES.ROLE_SELECTION} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <RoleSelectionScreen />
      </Suspense>
    } 
  />,
  
  <Route 
    key="patient-onboarding"
    path={ROUTES.PATIENT_ONBOARDING} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <PatientOnboarding />
      </Suspense>
    } 
  />,
  
  <Route 
    key="medical-professional-onboarding"
    path={ROUTES.STAFF_ONBOARDING} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <MedicalProfessionalOnboarding />
      </Suspense>
    } 
  />,
  
  <Route 
    key="healthcare-onboarding"
    path={ROUTES.HEALTHCARE_ONBOARDING} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <HealthcareFacilityOnboarding />
      </Suspense>
    } 
  />,
  
  // Dashboard routes
  <Route key="dashboard-layout" element={<Layout />}>
    <Route
      key="patient-dashboard"
      path={ROUTES.PATIENT_DASHBOARD}
      element={
        <Suspense fallback={<LoadingSkeleton />}>
          <PatientPortalModule />
        </Suspense>
      }
    >
      {patientPortalRoutes}
    </Route>
    <Route
      key="staff-dashboard"
      path={ROUTES.STAFF_DASHBOARD}
      element={
        <Suspense fallback={<LoadingSkeleton />}>
          <Dashboard />
        </Suspense>
      }
    />
  </Route>,
];