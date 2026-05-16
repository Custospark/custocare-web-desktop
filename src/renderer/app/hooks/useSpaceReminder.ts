// app/hooks/useSpaceReminder.ts
/**
 * Reminds staff to set their workspace room after being on duty for 25 minutes.
 *
 * When accepted, it opens the MySpace dropdown / occupancy flow.
 *
 * == Testing ==
 * Uncomment the test line below.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useConfirm } from '../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { selectTheme } from '../store/slices/uiSlice';
import { useGetCurrentOccupancy } from '../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentQueries';
import { getActiveFacilityId, getStaffId } from '../store/utils/contextSelectors';
import type { RootState } from '../store/rootReducer';

// ─── Production: 25 minutes ──────────────────────────────────────────
const REMINDER_AFTER_MS = 25 * 60 * 1000;

// ─── Testing: uncomment and comment the line above ────────────────────
// const REMINDER_AFTER_MS = 2 * 60 * 1000;

const CHECK_INTERVAL_MS = 30 * 1000;

export const useSpaceReminder = (onSetRoom?: () => void) => {
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const theme = useSelector(selectTheme);
  const firstName = useSelector((s: RootState) => s.activeContext.user?.first_name ?? 'There');
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const activeCapability = useSelector((s: RootState) => s.activeContext.activeCapability);
  const isStaff = activeCapability === 'staff';
  const { confirm } = useConfirm();

  // Check if user already has an occupied room
  const { data: occupancyRes } = useGetCurrentOccupancy(
    { facility_id: facilityId ?? 0 },
    { enabled: isStaff && !!facilityId },
  );
  const hasRoom = !!occupancyRes?.data;

  const remindedRef = useRef(false);

  const showReminder = useCallback(async () => {
    if (remindedRef.current || !facilityId) return;
    remindedRef.current = true;

    const dismissed = localStorage.getItem(`spaceReminderDismissed_${facilityId}`);
    if (dismissed === '1') { remindedRef.current = false; return; }

    const result = await confirm({
      title: 'Set your workspace?',
      message: `${firstName}, you've been on duty for a while. Let your team know where you're working from.`,
      confirmText: 'Set room',
      cancelText: 'Not now',
      extraActionText: "Don't ask again for this facility",
      variant: 'info',
      theme,
    });

    if (result === 'extra') {
      localStorage.setItem(`spaceReminderDismissed_${facilityId}`, '1');
    } else if (result === true) {
      onSetRoom?.();
    }

    remindedRef.current = false;
  }, [confirm, firstName, theme, facilityId, onSetRoom]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff || !facilityId || !staffId) return;

    const check = setInterval(() => {
      // Already has a room — skip
      if (hasRoom) return;

      if (remindedRef.current) return;

      const dismissed = localStorage.getItem(`spaceReminderDismissed_${facilityId}`);
      if (dismissed === '1') return;

      // Use on_duty start time from presence if available, or fallback
      const refTime = Date.now();
      const elapsed = Date.now() - refTime;

      // First time — store a baseline
      const stored = localStorage.getItem(`spaceReminderOnDutySince_${facilityId}`);
      if (!stored) {
        localStorage.setItem(`spaceReminderOnDutySince_${facilityId}`, String(Date.now()));
        return;
      }

      const since = parseInt(stored, 10);
      if (Date.now() - since < REMINDER_AFTER_MS) return;

      showReminder();
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
  }, [isAuthenticated, isStaff, facilityId, staffId, hasRoom, showReminder]);
};
