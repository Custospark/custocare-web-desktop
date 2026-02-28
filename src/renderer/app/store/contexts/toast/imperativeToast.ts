/**
 * imperativeToast
 * ───────────────
 * A module-level singleton that lets non-React code (axios interceptors,
 * Redux middleware, etc.) fire toasts without needing a hook.
 *
 * Flow:
 *  1. ToastProvider calls `imperativeToast.register(showToast)` on mount.
 *  2. axiosConfig (or anything outside React) calls `imperativeToast.show(...)`.
 */

import type { ToastVariant } from './useToast';

type ShowToastFn = (variant: ToastVariant, message: string, duration?: number) => void;

let _handler: ShowToastFn | null = null;

export const imperativeToast = {
  /** Called once by ToastProvider to wire up the real implementation. */
  register(fn: ShowToastFn): void {
    _handler = fn;
  },

  /** Called by ToastProvider on unmount (HMR / StrictMode safety). */
  unregister(): void {
    _handler = null;
  },

  /** Fire a toast from anywhere — inside or outside React. */
  show(variant: ToastVariant, message: string, duration = 6000): void {
    if (_handler) {
      _handler(variant, message, duration);
    } else {
      // Provider not mounted yet (early boot edge-case)
      console.warn(
        `[imperativeToast] No handler registered — toast dropped: [${variant}] ${message}`,
      );
    }
  },
};
