// AppRoutes.tsx
import { Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { OnboardingRoutes } from '../../modules/administration/onboarding/routes/OnboardingRoutes';
import { ProtectedRoutes } from './ProtectedRoutes';
import { ErrorRoutes } from './ErrorRoutes';
import { selectTheme } from '../store/slices/uiSlice';
import { selectActivePatient } from '../store/slices/visitSlice';

/**
 * Main Application Routes Configuration
 * 
 * Architecture:
 * 1. Public routes (AuthRoutes)
 * 2. Protected routes (ProtectedRoutes)
 * 3. Error routes (ErrorRoutes)
 *
 * Focus mode routes live inside ProtectedRoutes (auth + module access, no Layout).
 */
function AppRoutes() {
  // Get theme from Redux store
  const theme = useSelector(selectTheme);
  const activePatient = useSelector(selectActivePatient);

  return (
    <Routes>
      {/* Authentication Routes */}
      {...OnboardingRoutes()}
      
      {/* Protected Routes (includes focus mode + main layout) */}
      {...ProtectedRoutes({ theme, patientName: activePatient?.name ?? null })}
      
      {/* Error Routes */}
      {...ErrorRoutes()}
    </Routes>
  );
}

export default AppRoutes;