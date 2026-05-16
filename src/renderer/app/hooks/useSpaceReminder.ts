// app/hooks/useSpaceReminder.ts
/**
 * Reminds staff to set their workspace room 10 minutes after going ON_DUTY or BUSY.
 *
 * The duty/busy start time is stored in localStorage scoped by facility ID,
 * set only when the API confirms a status change to ON_DUTY or BUSY (detected
 * via presence query data transitioning).
 *
 * == Testing ==
 * Uncomment the TEST line and comment out the PRODUCTION line.
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
const REMINDER_AFTER_MS = 2 * 60 * 1000;

// ─── Testing (uncomment, comment out the line above) ─────────────────
// const REMINDER_AFTER_MS = 1 * 60 * 1000;

const CHECK_INTERVAL_MS = 30 * 1000;

const DUTY_STATES = [StaffPresenceStatus.ON_DUTY, StaffPresenceStatus.BUSY];

function baselineKey(facilityId: number) { return `spaceDutySince_${facilityId}`; }
function dismissKey(facilityId: number) { return `spaceReminderDismissed_${facilityId}`; }
function lastStatusKey(facilityId: number) { return `spaceLastStoredStatus_${facilityId}`; }

export const useSpaceReminder = (onSetRoom?: () => void) => {
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const theme = useSelector(selectTheme);
  const firstName = useSelector((s: RootState) => s.activeContext.user?.first_name ?? 'There');
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const activeCapability = useSelector((s: RootState) => s.activeContext.activeCapability);
  const isStaff = activeCapability === 'staff';
  const { confirm } = useConfirm();

  const { data: presenceRes } = useGetMyPresence();

  const { data: occupancyRes } = useGetCurrentOccupancy(
    { facility_id: facilityId ?? 0 },
    { enabled: isStaff && !!facilityId },
  );
  const hasRoom = !!occupancyRes?.data?.some(
    (space) => space.current_assignment?.staff_id === staffId,
  );

  const remindedRef = useRef(false);

  const showReminder = useCallback(async () => {
    if (remindedRef.current || !facilityId) return;
    remindedRef.current = true;

    if (localStorage.getItem(dismissKey(facilityId)) === '1') {
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
      localStorage.setItem(dismissKey(facilityId), '1');
    } else if (result === true) {
      onSetRoom?.();
    }

    remindedRef.current = false;
  }, [confirm, firstName, theme, facilityId, onSetRoom]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff || !facilityId || !staffId) return;

    const check = setInterval(() => {
      if (hasRoom) return;
      if (remindedRef.current) return;
      if (localStorage.getItem(dismissKey(facilityId)) === '1') return;

      const status = presenceRes?.data?.status;
      const isDuty = DUTY_STATES.includes(status as StaffPresenceStatus);

      const bKey = baselineKey(facilityId);
      const lsKey = lastStatusKey(facilityId);
      const prevStatus = localStorage.getItem(lsKey);

      if (isDuty) {
        // Status transitioned INTO on_duty or busy — store the current wall time once
        if (prevStatus !== status) {
          localStorage.setItem(lsKey, status!);
          localStorage.setItem(bKey, String(Date.now()));
          return;
        }

        // Timer already running — check elapsed from the stored baseline
        const stored = localStorage.getItem(bKey);
        if (!stored) return;

        const since = parseInt(stored, 10);
        if (Date.now() - since < REMINDER_AFTER_MS) return;

        showReminder();
      } else {
        // Not in a duty state — clear tracking so timer resets next time
        if (localStorage.getItem(bKey)) localStorage.removeItem(bKey);
        if (localStorage.getItem(lsKey)) localStorage.removeItem(lsKey);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
  }, [isAuthenticated, isStaff, facilityId, staffId, hasRoom, presenceRes, showReminder]);
};
