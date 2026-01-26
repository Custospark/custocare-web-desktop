// routeUtils.ts
import React, { Suspense } from 'react';
import { useOutletContext,Outlet } from 'react-router-dom';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import type { RootState } from '../../../store/store';
import { useSelector } from 'react-redux';

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
 * Suspense Wrapper
 */
export const SuspenseWrapper: React.FC<{
  children: React.ReactNode;
  variant?: 'dashboard' | 'table' | 'detail';
}> = ({ children, variant = 'dashboard' }) => (
  <Suspense fallback={<LoadingSkeleton variant={variant} />}>
    {children}
  </Suspense>
);

export const ProtectedThemeOutlet: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme as ThemeMode);
  return <Outlet context={{ theme } satisfies ProtectedOutletContext} />;
};