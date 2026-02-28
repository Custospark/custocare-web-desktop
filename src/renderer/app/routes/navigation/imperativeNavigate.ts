/**
 * imperativeNavigate
 * ──────────────────
 * A module-level singleton that lets non-React code (axios interceptors,
 * Redux middleware, etc.) trigger navigation without needing a hook.
 *
 * Flow:
 *  1. A component inside <Router> calls `imperativeNavigate.register(navigate)` on mount.
 *  2. axiosConfig (or anything outside React) calls `imperativeNavigate.to('/login')`.
 */

import type { NavigateFunction } from 'react-router-dom';

let _navigate: NavigateFunction | null = null;

export const imperativeNavigate = {
  /** Called once by the NavigationBridge component to wire up the real navigate fn. */
  register(fn: NavigateFunction): void {
    _navigate = fn;
  },

  /** Called on unmount (HMR / StrictMode safety). */
  unregister(): void {
    _navigate = null;
  },

  /** Navigate from anywhere — inside or outside React. */
  to(path: string, options?: Parameters<NavigateFunction>[1]): void {
    if (_navigate) {
      _navigate(path, options);
    } else {
      console.warn(
        `[imperativeNavigate] No handler registered — navigation dropped: ${path}`,
      );
    }
  },
};
