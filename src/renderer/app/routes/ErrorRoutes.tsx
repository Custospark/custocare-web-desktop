// src/routes/ErrorRoutes.tsx
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import LoadingSkeleton from '../../shared/components/Loading/LoadingSkeletons';
import { ROUTES } from './routeConstants';

const NotFound = React.lazy(() => import('../../shared/components/Errors/NotFound'));
const Offline = React.lazy(() => import('../../shared/components/Errors/Offline'));

/**
 * Error & Catch-All Routes
 */
export const ErrorRoutes = () => [
  <>
    {/* Offline — preview route; wire to navigator.onLine later */}
    <Route
      path={ROUTES.OFFLINE}
      element={
        <Suspense fallback={<LoadingSkeleton />}>
          <Offline />
        </Suspense>
      }
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
  </>
];