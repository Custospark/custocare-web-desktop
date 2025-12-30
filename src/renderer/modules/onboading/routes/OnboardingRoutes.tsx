// src/routes/AuthRoutes.tsx
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons'; 
import LoadingScreen from '../../../shared/components/Loading/LoadingScreen';
import { ROUTES } from './onboardingRouteConstants';

// Lazy load auth pages
const LoginPage = React.lazy(() => import('../ui/auth/Login'));
const SignUpPage = React.lazy(() => import('../ui/auth/SignUp'));
const ForgotPasswordPage = React.lazy(() => import('../ui/auth/ForgotPassword'));
const ResetPasswordPage = React.lazy(() => import('../ui/auth/ResetPassword'));
const TwoFactorAuthPage = React.lazy(() => import('../ui/auth/TwoFactorAuthPage'));
const RoleSelectionScreen = React.lazy(() => import('../ui/role-selection/RoelSelectionScreen'));
const PatientOnboarding = React.lazy(() => import('../ui/role-selection/PatientOnboarding'));
const MedicalProfessionalOnboarding = React.lazy(() => import('../ui/role-selection/MedicalProfessionalOnboarding'));
const HealthcareFacilityOnboarding = React.lazy(() => import('../ui/role-selection/HealthcareFacilityOnboarding'));
const Landing = React.lazy(() => import('../ui/role-selection/Landing'));
const PortalSelector = React.lazy(() => import('../ui/role-selection/PortalSelector'));

/**
 * Authentication Routes Configuration
 * Returns an array of Route components
 */
export const OnboardingRoutes = () => [
  <Route 
    key="landing"
    path={ROUTES.LANDING} 
    element={
      <Suspense fallback={<LoadingScreen />}>
        <Landing />
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
    key="signup"
    path={ROUTES.SIGNUP} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <SignUpPage />
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
  />
 ,
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
    key="role-selection"
    path={ROUTES.HEALTHCARE_ONBOARDING} 
    element={
      <Suspense fallback={<LoadingSkeleton />}>
        <HealthcareFacilityOnboarding />
      </Suspense>
    } 
  />
];