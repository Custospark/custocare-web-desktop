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

import type { NavigateFunction, To } from 'react-router-dom';

let _navigate: NavigateFunction | null = null;

type NavigateOptions = {
  replace?: boolean;
  state?: any;
  relative?: 'route' | 'path';
};

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
  to(to: To, options?: NavigateOptions): void {
    if (_navigate) {
      _navigate(to, options);
    } else {
      console.warn(
        `[imperativeNavigate] No handler registered — navigation dropped: ${JSON.stringify(to)}`,
      );
    }
  },

  /** Convenience method for replace navigation */
  replace(to: To, state?: any): void {
    imperativeNavigate.to(to, { replace: true, state });
  },

  /** Go back in history */
  back(): void {
    if (_navigate) {
      _navigate(-1);
    } else {
      console.warn('[imperativeNavigate] No handler registered — cannot go back');
    }
  },

  /** Go forward in history */
  forward(): void {
    if (_navigate) {
      _navigate(1);
    } else {
      console.warn('[imperativeNavigate] No handler registered — cannot go forward');
    }
  }
};