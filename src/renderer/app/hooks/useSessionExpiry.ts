// app/hooks/useSessionExpiry.ts
/**
 * Monitors session duration and prompts the user to extend after 8 hours.
 *
 * == Testing ==
 * To test with a shorter window, uncomment the TEST_OVERRIDE line below
 * and set the desired duration in milliseconds.
 *
 * Example — prompt after 3 minutes:
 *   const SESSION_DURATION_MS = 3 * 60 * 1000;  // 3 minutes
 *
 * Example — prompt immediately (useful for verifying the dialog renders):
 *   const SESSION_DURATION_MS = 0;
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { logout, extendSession, selectSessionStartedAt } from '../store/slices/authSlice';
import type { RootState } from '../store/rootReducer';

// ─── Production: 8 hours ─────────────────────────────────────────────
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// ─── Testing: uncomment one of the lines below ──────────────────────
// const SESSION_DURATION_MS = 3 * 60 * 1000;       // 3 minutes
// const SESSION_DURATION_MS = 0;                     // immediate (dialog shows on next tick)

const CHECK_INTERVAL_MS = 60 * 1000; // check every 60s

export const useSessionExpiry = () => {
  const dispatch = useDispatch();
  const { confirm } = useConfirm();
  const sessionStartedAt = useSelector(selectSessionStartedAt);
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const dialogShownRef = useRef(false);

  const handleExtend = useCallback(() => {
    dispatch(extendSession());
    dialogShownRef.current = false;
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    dialogShownRef.current = false;
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !sessionStartedAt) return;

    const check = setInterval(async () => {
      // If we already showed the dialog, wait for user action
      if (dialogShownRef.current) return;

      const elapsed = Date.now() - sessionStartedAt;
      if (elapsed < SESSION_DURATION_MS) return;

      // Session expired — show dialog
      dialogShownRef.current = true;
      clearInterval(check);

      const extended = await confirm({
        title: 'Session Expired',
        message:
          'Your session has been active for over 8 hours. For security, please extend or log out.',
        confirmText: 'Extend Session',
        cancelText: 'Log Out',
        variant: 'warning',
      });

      if (extended) {
        handleExtend();
      } else {
        handleLogout();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
  }, [isAuthenticated, sessionStartedAt, confirm, handleExtend, handleLogout]);
};
