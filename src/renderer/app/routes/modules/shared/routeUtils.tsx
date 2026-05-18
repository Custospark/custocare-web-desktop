import React, { Suspense } from 'react';
import { useOutletContext, Outlet, Navigate } from 'react-router-dom';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import type { RootState } from '../../../store/store';
import { useSelector } from "react-redux";
import { selectUser } from '../../../store/slices/authSlice';

/**
 * Shared utility components and functions for route configurations
 */

export type ThemeMode = 'light' | 'dark';

export interface ProtectedOutletContext {
  readonly theme: ThemeMode;
}

export interface ThemeProp {
  theme: ThemeMode;
}

/**
 * Props for components that require a user ID from auth
 */
export interface WithAuthProp {
  userId: number | string;
}

/**
 * Placeholder panel for unimplemented features
 */
export const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);

/**
 * Theme Prop Injector HOC
 */
export function WithThemeProp<P extends ThemeProp>({
  Component,
  props,
}: {
  Component: React.ComponentType<P>;
  props?: Omit<P, keyof ThemeProp>;
}): React.ReactElement {
  const { theme } = useOutletContext<ProtectedOutletContext>();
  const mergedProps = { ...(props ?? {}), theme } as P;
  return <Component {...mergedProps} />;
}

/**
 * Auth Prop Injector HOC
 * Wraps a component that needs the authenticated user's ID
 */
export function WithAuthProp<P extends WithAuthProp>({
  Component,
  props,
  redirectTo = '/login',
}: {
  Component: React.ComponentType<P>;
  props?: Omit<P, keyof WithAuthProp>;
  redirectTo?: string;
}): React.ReactElement {
  const user = useSelector(selectUser);
  const userId = user?.id;
  
  if (!userId) {
    return <Navigate to={redirectTo} replace />;
  }
  
  const mergedProps = { ...(props ?? {}), userId } as P;
  return <Component {...mergedProps} />;
}

/**
 * Suspense Wrapper
 */
export const SuspenseWrapper: React.FC<{
  children: React.ReactNode;
  variant?: 'dashboard' | 'table' | 'detail';
  message?: string;
}> = ({ children, variant = 'dashboard', message }) => {
  const theme = useSelector((state: RootState) => state.ui.theme as ThemeMode);

  return (
    <Suspense
      fallback={
        <div
          className={`min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
        >
          <LoadingSkeleton
            variant={variant}
            theme={theme}
            message={message}
            className="min-h-screen"
          />
        </div>
      }
    >
      {children}
    </Suspense>
  );
};

/**
 * Protected Theme Outlet - provides theme context to child routes
 */
export const ProtectedThemeOutlet: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme as ThemeMode);
  return <Outlet context={{ theme } satisfies ProtectedOutletContext} />;
};

/**
 * Re-exposes {@link ProtectedOutletContext} to nested routes when a path segment uses its own `<Outlet />`.
 * A child `<Outlet />` without `context` does not inherit the parent workspace outlet context, so
 * `useOutletContext()` would be undefined under that segment (e.g. patient portal `appointments/*`).
 */
export function ForwardThemeOutlet(): React.ReactElement {
  const ctx = useOutletContext<ProtectedOutletContext>();
  const theme = ctx?.theme ?? 'light';
  return <Outlet context={{ theme } satisfies ProtectedOutletContext} />;
}