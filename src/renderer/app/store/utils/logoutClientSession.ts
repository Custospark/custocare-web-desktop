import type { AppDispatch } from '../store';
import { queryClient } from '../../api/axiosConfig';
import { logout } from '../slices/authSlice';
import { clearActiveContext } from '../slices/activeContextSlice';
import { resetVisitsState, emergencyClearVisit } from '../slices/visitSlice';
import { resetPatientState } from '../slices/patientSlice';
import { clearNotifications } from '../slices/notificationSlice';
import { resetQueueState } from '../slices/queueSlice';
import { clearPendingForwarding } from '../slices/forwardPatientSlice';

/**
 * Clears ALL client-side session data — Redux slices, localStorage, and
 * React Query cache — so no stale authenticated state persists after logout.
 *
 * UI preferences (theme, sidebar) are preserved across logins.
 */
export function logoutClientSession(dispatch: AppDispatch): void {
  // Reset slices
  dispatch(logout());
  dispatch(clearActiveContext());
  dispatch(resetVisitsState());
  dispatch(emergencyClearVisit());
  dispatch(resetPatientState());
  dispatch(clearNotifications());
  dispatch(resetQueueState());
  dispatch(clearPendingForwarding());

  // Clear ALL localStorage except UI preferences (theme, sidebar, etc.)
  const uiPrefs = localStorage.getItem('custocare_ui_preferences');
  try { localStorage.clear(); } catch { /* ignore */ }
  if (uiPrefs) localStorage.setItem('custocare_ui_preferences', uiPrefs);

  // Clear React Query cache
  queryClient.clear();
}
