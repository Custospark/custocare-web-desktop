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

const REMINDER_AFTER_MS = 10 * 60 * 1000;
// const REMINDER_AFTER_MS = 2 * 60 * 1000;

const CHECK_INTERVAL_MS = 30 * 1000;
const DUTY_STATES = [StaffPresenceStatus.ON_DUTY, StaffPresenceStatus.BUSY];

function dismissKey(facilityId: number) { return `spaceReminderDismissed_${facilityId}`; }

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

  // Stable refs to avoid interval restarts
  const presenceRef = useRef(presenceRes);
  presenceRef.current = presenceRes;
  const hasRoom = !!occupancyRes?.data;
  const hasRoomRef = useRef(hasRoom);
  hasRoomRef.current = hasRoom;

  const remindedRef = useRef(false);
  const baselineRef = useRef<number | null>(null);

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

    baselineRef.current = null;

    const check = setInterval(() => {
      if (hasRoomRef.current) return;
      if (remindedRef.current) return;
      if (localStorage.getItem(dismissKey(facilityId)) === '1') return;

      const status = presenceRef.current?.data?.status;
      if (!status || !DUTY_STATES.includes(status as StaffPresenceStatus)) {
        baselineRef.current = null;
        return;
      }

      // First detection of ON_DUTY / BUSY — set baseline
      if (baselineRef.current === null) {
        baselineRef.current = Date.now();
        return;
      }

      // Check elapsed
      if (Date.now() - baselineRef.current >= REMINDER_AFTER_MS) {
        showReminder();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
    // Intentionally stable — only restart when auth/staff context changes
  }, [isAuthenticated, isStaff, facilityId, staffId, showReminder]);
};
