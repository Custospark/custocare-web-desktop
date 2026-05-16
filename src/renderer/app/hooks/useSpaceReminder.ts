// app/hooks/useSpaceReminder.ts
/**
 * Reminds staff to set their workspace room 10 minutes after going ON_DUTY.
 *
 * The duty start time is stored in localStorage scoped by facility ID,
 * set when the API confirms a status change to ON_DUTY (detected via
 * presence query data transitioning).
 *
 * The interval uses refs to read latest presence/occupancy data without
 * re-creating the timer on every react-query refetch.
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

// ─── Production: 2 minutes ──────────────────────────────────────────
const REMINDER_AFTER_MS = 2 * 60 * 1000;

// ─── Testing (uncomment, comment out the line above) ─────────────────
// const REMINDER_AFTER_MS = 1 * 60 * 1000;

const CHECK_INTERVAL_MS = 60 * 1000;
const SNOOZE_DURATION_MS = 10 * 60 * 1000;

/** Only ON_DUTY triggers the room reminder (BUSY implies they are already in a room). */
const DUTY_STATES = [StaffPresenceStatus.ON_DUTY];

function baselineKey(facilityId: number) { return `spaceDutySince_${facilityId}`; }
function dismissKey(facilityId: number) { return `spaceReminderDismissed_${facilityId}`; }
function lastStatusKey(facilityId: number) { return `spaceLastStoredStatus_${facilityId}`; }
function snoozeUntilKey(facilityId: number) { return `spaceReminderSnoozedUntil_${facilityId}`; }

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

  // ── Refs decouple the interval from react-query data churn ──────────
  const presenceRef = useRef(presenceRes);
  presenceRef.current = presenceRes;

  const hasRoom = !!occupancyRes?.data?.some(
    (space) => space.current_assignment?.staff_id === staffId,
  );
  const hasRoomRef = useRef(hasRoom);
  hasRoomRef.current = hasRoom;

  const remindedRef = useRef(false);

  const showReminder = useCallback(async () => {
    if (remindedRef.current || !facilityId) return;
    if (localStorage.getItem(dismissKey(facilityId)) === '1') return;

    const snoozedUntil = localStorage.getItem(snoozeUntilKey(facilityId));
    if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) return;

    remindedRef.current = true;

    const result = await confirm({
      title: 'Set your workspace?',
      message: `${firstName}, let your team know where you're working from.`,
      confirmText: 'Set room',
      cancelText: 'Remind me later',
      extraActionText: "Don't ask again for this facility",
      variant: 'info',
      theme,
    });

    if (result === 'extra') {
      localStorage.setItem(dismissKey(facilityId), '1');
    } else if (result === true) {
      onSetRoom?.();
    } else {
      // 'Not now' / cancel → snooze for 10 minutes
      localStorage.setItem(snoozeUntilKey(facilityId), String(Date.now() + SNOOZE_DURATION_MS));
    }

    remindedRef.current = false;
  }, [confirm, firstName, theme, facilityId, onSetRoom]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff || !facilityId || !staffId) return;

    // ── Hydrate baseline on mount ──────────────────────────────────────
    // If already ON_DUTY and no baseline stored (e.g. after page refresh),
    // start the timer from now so it doesn't get stuck waiting forever.
    const currentStatus = presenceRes?.data?.status;
    if (currentStatus === StaffPresenceStatus.ON_DUTY) {
      const bKey = baselineKey(facilityId);
      const lsKey = lastStatusKey(facilityId);
      if (!localStorage.getItem(bKey)) {
        localStorage.setItem(lsKey, currentStatus);
        localStorage.setItem(bKey, String(Date.now()));
      }
    }

    const check = setInterval(() => {
      if (hasRoomRef.current) return;
      if (remindedRef.current) return;
      if (localStorage.getItem(dismissKey(facilityId)) === '1') return;

      const snoozedUntil = localStorage.getItem(snoozeUntilKey(facilityId));
      if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) return;

      const p = presenceRef.current?.data;
      if (!p) return;

      const status = p.status;
      const isDuty = DUTY_STATES.includes(status as StaffPresenceStatus);

      const bKey = baselineKey(facilityId);
      const lsKey = lastStatusKey(facilityId);
      const prevStatus = localStorage.getItem(lsKey);

      if (isDuty) {
        // Status transitioned INTO on_duty — store the current wall time once
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
        // Not in a duty state — clear all tracking so timer resets next time
        if (localStorage.getItem(bKey)) localStorage.removeItem(bKey);
        if (localStorage.getItem(lsKey)) localStorage.removeItem(lsKey);
        if (localStorage.getItem(snoozeUntilKey(facilityId))) localStorage.removeItem(snoozeUntilKey(facilityId));
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
  }, [isAuthenticated, isStaff, facilityId, staffId, showReminder]);
};
