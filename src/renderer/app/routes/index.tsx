// AppRoutes.tsx
import { Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { OnboardingRoutes } from '../../modules/administration/onboarding/routes/OnboardingRoutes';
import { ProtectedRoutes } from './ProtectedRoutes';
import { ErrorRoutes } from './ErrorRoutes';
import { FocusModeRoutes } from '../../modules/administration/onboarding/routes/FocusModeRoutes';
import { selectTheme } from '../store/slices/uiSlice';

/**
 * Main Application Routes Configuration
 * 
 * Architecture:
 * 1. Public routes (AuthRoutes)
 * 2. Protected routes (ProtectedRoutes)
 * 3. Focus Mode routes (outside main layout)
 * 4. Error routes (ErrorRoutes)
 */
function AppRoutes() {
  // Get theme from Redux store
  const theme = useSelector(selectTheme);

  return (
    <Routes>
      {/* Authentication Routes */}
      {...OnboardingRoutes()}
      
      {/* Focus Mode Routes - Outside main layout, independent */}
      {...FocusModeRoutes({ theme })}
      
      {/* Protected Routes - With main layout */}
      {...ProtectedRoutes()}
      
      {/* Error Routes */}
      {...ErrorRoutes()}
    </Routes>
  );
}

export default AppRoutes;