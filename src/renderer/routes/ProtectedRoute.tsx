import React from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/Navigation/Layout';
import { useAppSelector } from '../store/hooks/useApp';
import { ROUTES } from './routeConstants';

/**
 * ProtectedRoute Component
 * Wraps protected routes and ensures user is authenticated
 * Only authenticated users can access routes using this component
 */
function ProtectedRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // If authenticated, render the layout with the requested component
  return (
    <Layout>
    </Layout>
  );
}

export default ProtectedRoute;