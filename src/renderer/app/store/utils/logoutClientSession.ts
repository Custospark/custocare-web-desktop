import type { AppDispatch } from '../store';
import { queryClient } from '../../api/axiosConfig';
import { logout } from '../slices/authSlice';
import { clearActiveContext } from '../slices/activeContextSlice';
import { resetVisitsState, emergencyClearVisit } from '../slices/visitSlice';
import { resetPatientState } from '../slices/patientSlice';
import { clearNotifications } from '../slices/notificationSlice';
import { resetQueueState } from '../slices/queueSlice';
import { clearPendingForwarding } from '../slices/forwardPatientSlice';

/** All known localStorage keys — cleared on logout. */
const LS_KEYS = [
  // Auth
  'authToken', 'authUser', 'authVerification', 'authSessionStartedAt',
  // Active context
  'userContext', 'activeCapability', 'activeFacilityId',
  'patientPortalFacilityId', 'patientPortalVisitId', 'patientPortalFacilityJson',
  // Visit
  'custocare_active_visit', 'custocare_previous_visit',
  'custocare_visit_context', 'custocare_visit_ui_state',
  // Staff presence
  'staffPresenceDismissedFacilities',
];

/**
 * Clears ALL client-side session data — Redux slices, localStorage, and
 * React Query cache — so no stale authenticated state persists after logout.
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

  // Clear known localStorage keys
  LS_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });

  // Wipe any facility-scoped presence tracking keys
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('staffPresenceStatus_') || k.startsWith('staffPresenceSeen_'))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }

  // Clear React Query cache
  queryClient.clear();
}
