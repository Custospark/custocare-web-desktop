// AppInitializer.tsx
import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './app/store/hooks/useApp';
import { initializeAuth } from './app/store/slices/authSlice';
import { useUserContext } from './app/store/hooks/useUserContext';
import { useSessionExpiry } from './app/hooks/useSessionExpiry';

interface AppInitializerProps {
  children: React.ReactNode;
}

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.activeContext);
  const { refresh } = useUserContext();

  useSessionExpiry();

  // Restore auth once
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Fetch context once after login, then periodically
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isAuthenticated && !user) {
      refresh();
    }

    if (isAuthenticated) {
      // Periodic refresh every 15 minutes
      intervalRef.current = setInterval(() => {
        refresh();
      }, REFRESH_INTERVAL_MS);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isAuthenticated, user]); // intentionally NOT including refresh — stable via useCallback, but no need to re-run

  return <>{children}</>;
};

export default AppInitializer;
