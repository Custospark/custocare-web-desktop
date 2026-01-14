import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routeConstants';
import { OnboardingRoutes } from '../../modules/administration/onboarding/routes/OnboardingRoutes';
import { ProtectedRoutes } from './ProtectedRoutes';
import { ErrorRoutes } from './ErrorRoutes';

/**
 * Main Application Routes Configuration
 * 
 * Architecture:
 * 1. Public routes (AuthRoutes)
 * 2. Protected routes (ProtectedRoutes)
 * 3. Error routes (ErrorRoutes)
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Default route - redirects to login */}
      <Route 
        path={ROUTES.HOME} 
        element={<Navigate to={ROUTES.LANDING} replace />} 
      />
      
      {/* Authentication Routes */}
        {...OnboardingRoutes()}
      
      {/* Protected Routes */}
      {...ProtectedRoutes()}

      
      {/* Error Routes */}
      {...ErrorRoutes()}
    </Routes>
  );
}

export default AppRoutes;