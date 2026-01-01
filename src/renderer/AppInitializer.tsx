// AppInitializer.tsx
import { useEffect } from 'react';
import { useAppDispatch } from './app/store/hooks/useApp';
import { initializeAuth } from './app/store/slices/authSlice';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * Component that initializes auth state on app load
 * Place this at the root of your app
 */
function AppInitializer({ children }: AppInitializerProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth once when app loads
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export default AppInitializer;