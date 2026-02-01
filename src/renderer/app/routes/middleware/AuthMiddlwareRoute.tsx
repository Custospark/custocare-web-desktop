import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks/useApp';
import { initializeAuth } from '../../store/slices/authSlice';
import { ROUTES } from '../routeConstants';
import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';

/**
 * AuthMiddlewareRoute Component
 * Proper authentication middleware with initialization handling
 */
function AuthMiddlewareRoute() {
  const dispatch = useAppDispatch();
  const theme=useAppSelector((state)=>state.ui.theme);
  const { isAuthenticated, token, user, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initialize auth from localStorage on component mount
    if (!isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <LoadingSkeleton message='Checking authentication...' variant='detail' theme={theme}></LoadingSkeleton>
    );
  }

  // Check authentication only after initialization
  // Require both token and user data for complete auth
  const isFullyAuthenticated = isAuthenticated && token && user;

  if (!isFullyAuthenticated) {
    // Clear any stale localStorage data if Redux says we're not authenticated
    if (localStorage.getItem('authToken')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
   
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}

export default AuthMiddlewareRoute;