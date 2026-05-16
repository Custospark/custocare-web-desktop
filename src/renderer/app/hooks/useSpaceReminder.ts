// app/hooks/useSpaceReminder.ts
/**
 * Reminds staff to set their workspace room 10 minutes after going ON_DUTY or BUSY.
 *
 * When accepted, it triggers a callback (opens MySpace dropdown to occupy a room).
 *
 * Tracks the ON_DUTY/BUSY start time in localStorage per facility so the timer
 * is accurate even after page refresh.
 *
 * == Testing ==
 * Uncomment the test line below.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useConfirm } from '../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { selectTheme } from '../store/slices/uiSlice';
import { useGetMyPresence } from '../../modules/administration/admin-module/api/staff-presence/StaffPresenceQueries';
import { StaffPresenceStatus } from '../../modules/administration/admin-module/api/staff-presence/StaffPresenceTypes';
import { useGetCurrentOccupancy } from '../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentQueries';
import { getActiveFacilityId, getStaffId } from '../store/utils/contextSelectors';
import type { RootState } from '../store/rootReducer';

// ─── Production: 10 minutes ──────────────────────────────────────────
const REMINDER_AFTER_MS = 10 * 60 * 1000;

// ─── Testing (uncomment) ─────────────────────────────────────────────
// const REMINDER_AFTER_MS = 2 * 60 * 1000;

const CHECK_INTERVAL_MS = 30 * 1000;

const DUTY_STATES = [StaffPresenceStatus.ON_DUTY, StaffPresenceStatus.BUSY];

function getBaselineKey(facilityId: number) { return `spaceDutySince_${facilityId}`; }
function getDismissKey(facilityId: number) { return `spaceReminderDismissed_${facilityId}`; }

export const useSpaceReminder = (onSetRoom?: () => void) => {
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const theme = useSelector(selectTheme);
  const firstName = useSelector((s: RootState) => s.activeContext.user?.first_name ?? 'There');
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const activeCapability = useSelector((s: RootState) => s.activeContext.activeCapability);
  const isStaff = activeCapability === 'staff';
  const { confirm } = useConfirm();

  // Presence — to detect ON_DUTY / BUSY transitions
  const { data: presenceRes } = useGetMyPresence();

  // Current occupancy — to check if already in a room
  const { data: occupancyRes } = useGetCurrentOccupancy(
    { facility_id: facilityId ?? 0 },
    { enabled: isStaff && !!facilityId },
  );
  const hasRoom = !!occupancyRes?.data;

  const remindedRef = useRef(false);

  const showReminder = useCallback(async () => {
    if (remindedRef.current || !facilityId) return;
    remindedRef.current = true;

    if (localStorage.getItem(getDismissKey(facilityId)) === '1') {
      remindedRef.current = false;
      return;
    }

    const result = await confirm({
      title: 'Set your workspace?',
      message: `${firstName}, let your team know where you're working from.`,
      confirmText: 'Set room',
      cancelText: 'Not now',
      extraActionText: "Don't ask again for this facility",
      variant: 'info',
      theme,
    });

    if (result === 'extra') {
      localStorage.setItem(getDismissKey(facilityId), '1');
    } else if (result === true) {
      onSetRoom?.();
    }

    remindedRef.current = false;
  }, [confirm, firstName, theme, facilityId, onSetRoom]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff || !facilityId || !staffId) return;

    const check = setInterval(() => {
      // Already has a room — skip entirely
      if (hasRoom) return;

      if (remindedRef.current) return;
      if (localStorage.getItem(getDismissKey(facilityId)) === '1') return;

      // Current presence status
      const status = presenceRes?.data?.status;
      const isDuty = DUTY_STATES.includes(status as StaffPresenceStatus);

      const baselineKey = getBaselineKey(facilityId);
      const stored = localStorage.getItem(baselineKey);

      if (isDuty) {
        if (!stored) {
          // Just entered ON_DUTY or BUSY — set baseline
          localStorage.setItem(baselineKey, String(Date.now()));
          return;
        }

        // Check elapsed time since baseline
        const since = parseInt(stored, 10);
        if (Date.now() - since < REMINDER_AFTER_MS) return;

        showReminder();
      } else {
        // Not ON_DUTY or BUSY — clear baseline so timer resets next time
        if (stored) localStorage.removeItem(baselineKey);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
  }, [isAuthenticated, isStaff, facilityId, staffId, hasRoom, presenceRes, showReminder]);
};
