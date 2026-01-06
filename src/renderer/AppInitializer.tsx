// AppInitializer.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './app/store/hooks/useApp';
import { initializeAuth } from './app/store/slices/authSlice';
import { useUserContext } from './app/store/hooks/useUserContext';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * AppInitializer
 * - Restores auth state
 * - Fetches user context when authenticated
 * - Active context is derived inside activeContextSlice
 */
const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.activeContext);
  const { refetch } = useUserContext();

  // 1️⃣ Restore auth once
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // 2️⃣ Fetch backend context if needed
  useEffect(() => {
    if (isAuthenticated && !user ) {
      refetch();
    }
  }, [isAuthenticated, user, refetch]);

  return <>{children}</>;
};

export default AppInitializer;
