import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks/useApp';
import { initializeAuth } from '../../store/slices/authSlice';
import { ROUTES } from '../routeConstants';
import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';

/**
 * AuthMiddlewareRoute Component
 * 
 * Protects routes that require a fully authenticated user.
 * - Uses `initializeAuth` to hydrate auth state from localStorage on mount.
 * - Shows a loading skeleton until initialization is complete.
 * - After initialization, checks for both token and user data.
 * - If not fully authenticated, redirects to login (does not delete a valid
 *   auth token when only cached profile JSON is missing — avoids wiping sessions).
 * 
 * Note: This middleware does NOT handle partial authentication states
 * (e.g., email verification or MFA flows) – those are managed by dedicated
 * routes that read verification context from the slice.
 */
function AuthMiddlewareRoute() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const { isAuthenticated, token, user, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initialize auth from localStorage on component mount (only once)
    if (!isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <LoadingSkeleton message="Checking authentication..." variant="detail" theme={theme} />
    );
  }

  // Require both Redux auth flag AND actual token/user data.
  // This ensures we don't consider a partially hydrated state as authenticated.
  const isFullyAuthenticated = isAuthenticated && token && user;

  if (!isFullyAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}

export default AuthMiddlewareRoute;