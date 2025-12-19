import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import LoadingScreen from '../components/Loading/LoadingScreen';
import ProtectedRoute from './ProtectedRoute'
import { ROUTES } from './routeConstants'

// Lazy load pages
const LoginPage = React.lazy(() => import('../components/Features/Auth/LoginPage'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const PatientList = React.lazy(() => import('../components/Features/Patients/PatientList'));
const PatientDetail = React.lazy(() => import('../components/Features/Patients/PatientDetail'));
const NotFound = React.lazy(() => import('../components/Errors/NotFound'));

function AppRoutes() {
  const { isInitialized } = useAppSelector((state) => state.ui);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.PATIENTS} element={<PatientList />} />
          <Route path={ROUTES.PATIENT_DETAIL} element={<PatientDetail />} />
        </Route>

        {/* Redirect and 404 */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;