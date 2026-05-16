// AppInitializer.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './app/store/hooks/useApp';
import { initializeAuth } from './app/store/slices/authSlice';
import { useUserContext } from './app/store/hooks/useUserContext';
import { useSessionExpiry } from './app/hooks/useSessionExpiry';
import { useStaffPresenceReminder } from './app/hooks/useStaffPresenceReminder';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.activeContext);
  const { refetch } = useUserContext();

  useSessionExpiry();
  useStaffPresenceReminder();

  useEffect(() => { dispatch(initializeAuth()); }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && !user) {
      refetch();
    }
  }, [isAuthenticated, user, refetch]);

  return <>{children}</>;
};

export default AppInitializer;
