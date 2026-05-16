// app/hooks/useStaffPresenceReminder.ts
/**
 * Periodically checks the current staff presence status and reminds the user
 * to update it if they've been in a non-ON_DUTY status past the threshold.
 *
 * Only activates when the user is in staff mode (capability === 'staff').
 * When the user switches modes via the context switcher, the capability
 * change is detected and the reminder enables/disables automatically.
 *
 * == Testing ==
 * Uncomment the TEST block below and comment out the production block.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useConfirm } from '../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { selectTheme } from '../store/slices/uiSlice';
import { useGetMyPresence, useSetMyPresence } from '../../modules/administration/admin-module/api/staff-presence/StaffPresenceQueries';
import { StaffPresenceStatus } from '../../modules/administration/admin-module/api/staff-presence/StaffPresenceTypes';
import { getActiveFacilityId, getStaffId } from '../store/utils/contextSelectors';
import type { RootState } from '../store/rootReducer';

// ─── Production: per-status thresholds (ms) ───────────────────────────
const THRESHOLDS: Record<string, number> = {
  [StaffPresenceStatus.BUSY]:        15 * 60 * 1000,
  [StaffPresenceStatus.ON_BREAK]:    15 * 60 * 1000,
  [StaffPresenceStatus.UNAVAILABLE]: 3 * 60 * 1000,
  [StaffPresenceStatus.OFF_DUTY]:    3 * 60 * 1000,
};

// ─── Testing: uncomment THESE and comment out the block above ────────
const THRESHOLDS: Record<string, number> = {
  [StaffPresenceStatus.BUSY]:        1 * 60 * 1000,
  [StaffPresenceStatus.ON_BREAK]:    1 * 60 * 1000,
  [StaffPresenceStatus.UNAVAILABLE]: 1 * 60 * 1000,
  [StaffPresenceStatus.OFF_DUTY]:    1 * 60 * 1000,
};

const CHECK_INTERVAL_MS = 30 * 1000;


function pluralize(minutes: number): string {
  return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
}

function getDismissedFacilities(): number[] {
  try {
    const raw = localStorage.getItem('staffPresenceDismissedFacilities');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function dismissFacility(facilityId: number) {
  const list = getDismissedFacilities();
  if (!list.includes(facilityId)) {
    list.push(facilityId);
    localStorage.setItem('staffPresenceDismissedFacilities', JSON.stringify(list));
  }
}

function isFacilityDismissed(facilityId: number): boolean {
  return getDismissedFacilities().includes(facilityId);
}

const DIALOG_CONFIG: Record<string, {
  title: string;
  message: (name: string, mins: number) => string;
  confirmText: string;
  cancelText: string;
}> = {
  [StaffPresenceStatus.BUSY]: {
    title: 'Still busy?',
    message: (name, mins) => `${name}, you've been busy for ${pluralize(mins)}. Mark yourself as available?`,
    confirmText: "Yes, I'm free",
    cancelText: 'Still busy',
  },
  [StaffPresenceStatus.ON_BREAK]: {
    title: 'Still on break?',
    message: (name, mins) => `${name}, you've been on break for ${pluralize(mins)}. Back at work?`,
    confirmText: "Yes, I'm back",
    cancelText: 'Still on break',
  },
  [StaffPresenceStatus.UNAVAILABLE]: {
    title: 'Still unavailable?',
    message: (name, mins) => `${name}, you've been unavailable for ${pluralize(mins)}. Available now?`,
    confirmText: "Yes, I'm available",
    cancelText: 'Still unavailable',
  },
  [StaffPresenceStatus.OFF_DUTY]: {
    title: 'Start your shift?',
    message: (name, mins) => `${name}, you've been off duty for ${pluralize(mins)}. Starting work?`,
    confirmText: 'Start shift',
    cancelText: 'Dismiss',
  },
};

export const useStaffPresenceReminder = () => {
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const theme = useSelector(selectTheme);
  const firstName = useSelector((s: RootState) => s.activeContext.user?.first_name ?? 'There');
  const activeCapability = useSelector((s: RootState) => s.activeContext.activeCapability);
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const isStaff = activeCapability === 'staff';
  const { confirm } = useConfirm();

  const { data: presenceResponse } = useGetMyPresence();
  const setPresence = useSetMyPresence();

  const setOnDuty = useCallback(async () => {
    try { await setPresence.mutateAsync({ status: StaffPresenceStatus.ON_DUTY }); }
    catch { /* toast handles error */ }
  }, [setPresence]);

  const remindedRef = useRef(false);

  const showReminder = useCallback(async (status: string, elapsedMs: number) => {
    if (remindedRef.current || !facilityId) return;
    if (isFacilityDismissed(facilityId)) return;

    remindedRef.current = true;

    const cfg = DIALOG_CONFIG[status];
    if (!cfg) { remindedRef.current = false; return; }

    const elapsedMin = Math.round(elapsedMs / 60000);

    const result = await confirm({
      title: cfg.title,
      message: cfg.message(firstName, elapsedMin),
      confirmText: cfg.confirmText,
      cancelText: cfg.cancelText,
      extraActionText: "Don't show again for this facility",
      variant: 'info',
      theme,
    });

    if (result === 'extra') {
      dismissFacility(facilityId);
    } else if (result === true) {
      await setOnDuty();
    }
    // false = cancel, do nothing

    remindedRef.current = false;
  }, [confirm, firstName, theme, setOnDuty, facilityId]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff || !facilityId || !staffId) return;

    const check = setInterval(() => {
      const p = presenceResponse?.data;
      if (!p) return;

      const status = p.status;
      if (!status || status === StaffPresenceStatus.ON_DUTY) return;

      if (isFacilityDismissed(facilityId)) return;

      // Use the presence record's updated_at as the reference time
      const refTime = p.updated_at ? new Date(p.updated_at).getTime() : Date.now();
      const elapsed = Date.now() - refTime;
      const threshold = THRESHOLDS[status];
      if (!threshold || elapsed < threshold) return;

      if (!remindedRef.current) showReminder(status, elapsed);
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
  }, [isAuthenticated, isStaff, facilityId, staffId, presenceResponse, showReminder]);
};
