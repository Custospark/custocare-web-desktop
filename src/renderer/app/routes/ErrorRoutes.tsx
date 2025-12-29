// src/routes/ErrorRoutes.tsx
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import LoadingSkeleton from '../../shared/components/Loading/LoadingSkeletons';

const NotFound = React.lazy(() => import('../../shared/components/Errors/NotFound'));

/**
 * Error & Catch-All Routes
 */
export const ErrorRoutes = () => [
  <>
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