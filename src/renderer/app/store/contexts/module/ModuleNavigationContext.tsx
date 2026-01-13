/**
 * ============================================================================
 * MODULE NAVIGATION CONTEXT
 * ============================================================================
 *
 * Provides:
 * - Cross-operation navigation
 * - Action-level navigation
 * - History stack (back support)
 * - Payload passing between views
 */

import React, { createContext, useState } from 'react';

interface NavigationState {
  operation: string;
  action?: string;
  payload?: unknown;
}

interface ModuleNavigationContextValue {
  current: NavigationState;
  navigate: (state: NavigationState) => void;
  back: () => void;
}

const ModuleNavigationContext =
  createContext<ModuleNavigationContextValue | null>(null);

export const ModuleNavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [, setHistory] = useState<NavigationState[]>([]);
  const [current, setCurrent] = useState<NavigationState>({
    operation: 'overview',
  });

  const navigate = (next: NavigationState) => {
    setHistory(prev => [...prev, current]);
    setCurrent(next);
  };

  const back = () => {
    setHistory(prev => {
      const last = prev[prev.length - 1];
      if (!last) return prev;

      setCurrent(last);
      return prev.slice(0, -1);
    });
  };

  return (
    <ModuleNavigationContext.Provider value={{ current, navigate, back }}>
      {children}
    </ModuleNavigationContext.Provider>
  );
};

// export const useModuleNavigation = () => {
//   const ctx = useContext(ModuleNavigationContext);
//   if (!ctx) {
//     throw new Error('useModuleNavigation must be used within ModuleNavigationProvider');
//   }
//   return ctx;
// };
