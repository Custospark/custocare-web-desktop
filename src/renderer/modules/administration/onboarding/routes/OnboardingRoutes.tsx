// src/routes/AuthRoutes.tsx
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons'; 
import LoadingScreen from '../../../../shared/components/Loading/LoadingScreen';
import { ROUTES } from './onboardingRouteConstants';
import { PublicRoute } from '../../../../app/routes/PublicRoute';

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
  // Wrap ALL routes that should redirect authenticated users
  <Route key="public-wrapper" element={<PublicRoute />}>
    <Route 
      key="home"
      path={ROUTES.HOME}
      element={
        <Suspense fallback={<LoadingScreen />}>
          <Landing />
        </Suspense>
      } 
    />
    
    <Route 
      key="landing"
      path={ROUTES.LANDING} 
      element={
        <Suspense fallback={<LoadingScreen />}>
          <Landing />
        </Suspense>
      } 
    />
    
    <Route 
      key="signup"
      path={ROUTES.SIGNUP} 
      element={
        <Suspense fallback={<LoadingSkeleton />}>
          <SignUpPage />
        </Suspense>
      } 
    />
    
    <Route 
    key="login"
    path={ROUTES.LOGIN} 
    element={
      <Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </Suspense>
    } 
  />
  </Route>,
  
  
  // Forgot password
  <Route 
    key="forgot-password"
    path={ROUTES.FORGOT_PASSWORD} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <ForgotPasswordPage />
      </Suspense>
    } 
  />,
  
  // Reset password
  <Route 
    key="reset-password"
    path={ROUTES.RESET_PASSWORD} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <ResetPasswordPage />
      </Suspense>
    } 
  />,
  
  // Two factor auth
  <Route 
    key="two-factor-auth"
    path={ROUTES.TWO_FACTOR_AUTH} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <TwoFactorAuthPage />
      </Suspense>
    } 
  />,
  
  // Password reset success
  <Route 
    key="password-reset-success"
    path={ROUTES.RESET_PASSWORD_SUCCESS} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <PasswordResetSuccess />
      </Suspense>
    } 
  />,
  
  // Portal selector
  <Route 
    key="portal-selector"
    path={ROUTES.PORTAL_SELECTOR} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <PortalSelector />
      </Suspense>
    } 
  />,
  
  // Role selection
  <Route 
    key="role-selection"
    path={ROUTES.ROLE_SELECTION} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <RoleSelectionScreen />
      </Suspense>
    } 
  />,
  
  // Patient onboarding
  <Route 
    key="patient-onboarding"
    path={ROUTES.PATIENT_ONBOARDING} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <PatientOnboarding />
      </Suspense>
    } 
  />,
  
  // Medical professional onboarding
  <Route 
    key="medical-professional-onboarding"
    path={ROUTES.STAFF_ONBOARDING} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <MedicalProfessionalOnboarding />
      </Suspense>
    } 
  />,
  
  // Healthcare facility onboarding
  <Route 
    key="healthcare-onboarding"
    path={ROUTES.HEALTHCARE_ONBOARDING} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <HealthcareFacilityOnboarding />
      </Suspense>
    } 
  />,
  
  // Dashboard routes - protected by ProtectedRoutes
  <Route key="dashboard-layout" element={<Layout />}>
    <Route
      key="patient-dashboard"
      path={ROUTES.PATIENT_DASHBOARD}
      element={
        <Suspense fallback={<LoadingSkeleton />}>
          <PatientPortalModule />
        </Suspense>
      }
    />
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