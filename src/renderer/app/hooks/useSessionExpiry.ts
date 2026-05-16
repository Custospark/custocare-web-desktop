// app/hooks/useSessionExpiry.ts
/**
 * Monitors session duration and prompts the user to extend after 8 hours.
 *
 * If the user does not respond to the dialog within 2 minutes, they are
 * automatically logged out.
 *
 * == Testing ==
 * Uncomment one of the TEST lines below and comment out the production value:
 *   const SESSION_DURATION_MS = 3 * 60 * 1000;       // 3 minutes
 *   const SESSION_DURATION_MS = 0;                     // immediate
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { logout, extendSession, selectSessionStartedAt } from '../store/slices/authSlice';
import type { RootState } from '../store/rootReducer';

// ─── Production: 8 hours ─────────────────────────────────────────────
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// ─── Testing (uncomment one) ─────────────────────────────────────────
// const SESSION_DURATION_MS = 3 * 60 * 1000;       // 3 minutes
// const SESSION_DURATION_MS = 0;                     // immediate

const CHECK_INTERVAL_MS = 60 * 1000;        // check every 60s
const DIALOG_TIMEOUT_MS  = 2 * 60 * 1000;   // auto-logout after 2 min of no response

export const useSessionExpiry = () => {
  const dispatch = useDispatch();
  const { confirm } = useConfirm();
  const sessionStartedAt = useSelector(selectSessionStartedAt);
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const dialogShownRef = useRef(false);
  const autoLogoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoLogout = useCallback(() => {
    if (autoLogoutTimer.current) {
      clearTimeout(autoLogoutTimer.current);
      autoLogoutTimer.current = null;
    }
  }, []);

  const forceLogout = useCallback(() => {
    clearAutoLogout();
    dialogShownRef.current = false;
    dispatch(logout());
  }, [dispatch, clearAutoLogout]);

  const handleExtend = useCallback(() => {
    clearAutoLogout();
    dispatch(extendSession());
    dialogShownRef.current = false;
  }, [dispatch, clearAutoLogout]);

  const handleLogout = useCallback(() => {
    clearAutoLogout();
    dispatch(logout());
    dialogShownRef.current = false;
  }, [dispatch, clearAutoLogout]);

  useEffect(() => {
    if (!isAuthenticated || !sessionStartedAt) return;

    const check = setInterval(async () => {
      if (dialogShownRef.current) return;

      const elapsed = Date.now() - sessionStartedAt;
      if (elapsed < SESSION_DURATION_MS) return;

      // Session expired — stop the interval and show dialog
      clearInterval(check);
      dialogShownRef.current = true;

      // Auto-logout after 2 minutes if no response
      autoLogoutTimer.current = setTimeout(() => {
        forceLogout();
      }, DIALOG_TIMEOUT_MS);

      const extended = await confirm({
        title: 'Session Expired',
        message:
          'Your session has been active for over 8 hours. For security, please extend or log out.',
        confirmText: 'Extend Session',
        cancelText: 'Log Out',
        variant: 'warning',
      });

      clearAutoLogout();

      if (extended) {
        handleExtend();
      } else {
        handleLogout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(check);
      clearAutoLogout();
    };
  }, [isAuthenticated, sessionStartedAt, confirm, handleExtend, handleLogout, forceLogout, clearAutoLogout]);
};
