import { Routes} from 'react-router-dom';
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