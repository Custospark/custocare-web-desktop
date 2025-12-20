import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks/useApp';
import LoadingScreen from '../components/Loading/LoadingScreen';
import { ROUTES } from './routeConstants';
import Layout from '../components/Navigation/Layout';

// Lazy load pages
const LoginPage = React.lazy(() => import('../features/auth/Login'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const PatientList = React.lazy(() => import('../features/patients/PatientList'));
const PatientDetail = React.lazy(() => import('../features/patients/PatientDetail'));
const NotFound = React.lazy(() => import('../components/Errors/NotFound'));

function AppRoutes() {
  const { isInitialized } = useAppSelector((state) => state.ui);

  if (!isInitialized) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        {/* Redirect root to login */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Protected / Layout Routes */}
        <Route element={<Layout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.PATIENTS} element={<PatientList />} />
          <Route path={ROUTES.PATIENT_DETAIL} element={<PatientDetail />} />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
