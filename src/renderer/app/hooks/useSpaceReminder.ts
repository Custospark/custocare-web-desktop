// app/hooks/useSpaceReminder.ts
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

// ─── Testing (uncomment, comment out the line above) ─────────────────
// const REMINDER_AFTER_MS = 2 * 60 * 1000;

const CHECK_INTERVAL_MS = 30 * 1000;
const DUTY_STATES = [StaffPresenceStatus.ON_DUTY, StaffPresenceStatus.BUSY];

function dismissKey(facilityId: number) { return `spaceReminderDismissed_${facilityId}`; }
function baselineKey(facilityId: number) { return `spaceDutySince_${facilityId}`; }

export const useSpaceReminder = (onSetRoom?: () => void) => {
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const theme = useSelector(selectTheme);
  const firstName = useSelector((s: RootState) => s.activeContext.user?.first_name ?? 'There');
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const activeCapability = useSelector((s: RootState) => s.activeContext.activeCapability);
  const isStaff = activeCapability === 'staff';
  const { confirm } = useConfirm();

  // Hooks — called unconditionally (safe because MySpace only renders in staff mode)
  const { data: presenceRes } = useGetMyPresence();
  const { data: occupancyRes } = useGetCurrentOccupancy(
    { facility_id: facilityId ?? 0 },
    { enabled: isStaff && !!facilityId },
  );

  // Refs — stable references that don't trigger effect restarts
  const presenceRef = useRef(presenceRes);
  presenceRef.current = presenceRes;

  const hasRoom = !!occupancyRes?.data;
  const hasRoomRef = useRef(hasRoom);
  hasRoomRef.current = hasRoom;

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
      // Guards — using refs to avoid effect restarts on data changes
      if (hasRoomRef.current) return;
      if (remindedRef.current) return;
      if (localStorage.getItem(dismissKey(facilityId)) === '1') return;

      const status = presenceRef.current?.data?.status;
      if (!status || !DUTY_STATES.includes(status as StaffPresenceStatus)) return;

      // First detection of ON_DUTY / BUSY — store baseline in localStorage
      const bKey = baselineKey(facilityId);
      const stored = localStorage.getItem(bKey);
      if (!stored) {
        localStorage.setItem(bKey, String(Date.now()));
        return;
      }

      // Check elapsed time since baseline
      const since = parseInt(stored, 10);
      if (Date.now() - since < REMINDER_AFTER_MS) return;

      // Threshold crossed — fire reminder once, then clear baseline
      localStorage.removeItem(bKey);
      showReminder();
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
    // Stable deps — only restart when auth/staff context changes
  }, [isAuthenticated, isStaff, facilityId, staffId, showReminder]);
};
