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
 * Uncomment the TEST_DURATION block below to shorten all thresholds.
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
// const THRESHOLDS: Record<string, number> = {
//   [StaffPresenceStatus.BUSY]:        25 * 60 * 1000,
//   [StaffPresenceStatus.ON_BREAK]:    25 * 60 * 1000,
//   [StaffPresenceStatus.UNAVAILABLE]: 25 * 60 * 1000,
//   [StaffPresenceStatus.OFF_DUTY]:    25 * 60 * 1000,
// };

// ─── Testing: uncomment THESE lines and comment out the block above ──
const THRESHOLDS: Record<string, number> = {
  [StaffPresenceStatus.BUSY]:        1 * 60 * 1000,
  [StaffPresenceStatus.ON_BREAK]:    1 * 60 * 1000,
  [StaffPresenceStatus.UNAVAILABLE]: 1 * 60 * 1000,
  [StaffPresenceStatus.OFF_DUTY]:    1 * 60 * 1000,
};

const CHECK_INTERVAL_MS = 30 * 1000;
const STORAGE_PREFIX = 'staffPresenceStatus';

interface StatusRecord {
  status: string;
  changedAt: number;
}

function readRecord(facilityId: number): StatusRecord | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}_${facilityId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeRecord(facilityId: number, rec: StatusRecord) {
  localStorage.setItem(`${STORAGE_PREFIX}_${facilityId}`, JSON.stringify(rec));
}

function removeRecord(facilityId: number) {
  localStorage.removeItem(`${STORAGE_PREFIX}_${facilityId}`);
}

const DIALOG_CONFIG: Record<string, {
  title: string;
  message: (name: string, mins: number) => string;
  confirmText: string;
  cancelText: string;
}> = {
  [StaffPresenceStatus.BUSY]: {
    title: 'Still busy?',
    message: (name, mins) => `${name}, you've been busy for ${mins} min. Mark yourself as available?`,
    confirmText: "Yes, I'm free",
    cancelText: 'Still busy',
  },
  [StaffPresenceStatus.ON_BREAK]: {
    title: 'Still on break?',
    message: (name, mins) => `${name}, you've been on break for ${mins} min. Back at work?`,
    confirmText: "Yes, I'm back",
    cancelText: 'Still on break',
  },
  [StaffPresenceStatus.UNAVAILABLE]: {
    title: 'Still unavailable?',
    message: (name, mins) => `${name}, you've been unavailable for ${mins} min. Available now?`,
    confirmText: "Yes, I'm available",
    cancelText: 'Still unavailable',
  },
  [StaffPresenceStatus.OFF_DUTY]: {
    title: 'Start your shift?',
    message: (name, mins) => `${name}, you've been off duty for ${mins} min. Starting work?`,
    confirmText: 'Start shift',
    cancelText: 'Dismiss',
  },
};

/** Fetch presence directly — safe to call even when not in staff mode (query is disabled). */

export const useStaffPresenceReminder = () => {
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const theme = useSelector(selectTheme);
  const firstName = useSelector((s: RootState) => s.activeContext.user?.first_name ?? 'There');
  const activeCapability = useSelector((s: RootState) => s.activeContext.activeCapability);
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const isStaff = activeCapability === 'staff';
  const { confirm } = useConfirm();

  const { data: presence } = useGetMyPresence();
  const setPresence = useSetMyPresence();

  const setOnDuty = useCallback(async () => {
    try {
      await setPresence.mutateAsync({ status: StaffPresenceStatus.ON_DUTY });
    } catch { /* toast handles error */ }
  }, [setPresence]);

  const remindedRef = useRef(false);

  const showReminder = useCallback(async (status: string, elapsedMs: number) => {
    if (remindedRef.current) return;
    remindedRef.current = true;

    const cfg = DIALOG_CONFIG[status];
    if (!cfg) { remindedRef.current = false; return; }

    const elapsedMin = Math.round(elapsedMs / 60000);

    const ok = await confirm({
      title: cfg.title,
      message: cfg.message(firstName, elapsedMin),
      confirmText: cfg.confirmText,
      cancelText: cfg.cancelText,
      variant: 'info',
      theme,
    });

    if (ok) await setOnDuty();
    remindedRef.current = false;
  }, [confirm, firstName, theme, setOnDuty]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff || !facilityId || !staffId) return;

    const check = setInterval(() => {
      if (!presence) return;

      const status = presence?.status;
      if (!status || status === StaffPresenceStatus.ON_DUTY) {
        removeRecord(facilityId);
        return;
      }

      const recorded = readRecord(facilityId);
      const now = Date.now();

      if (!recorded || recorded.status !== status) {
        writeRecord(facilityId, { status, changedAt: now });
        return;
      }

      const elapsed = now - recorded.changedAt;
      const threshold = THRESHOLDS[status];
      if (!threshold || elapsed < threshold) return;

      if (!remindedRef.current) showReminder(status, elapsed);
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
  }, [isAuthenticated, isStaff, facilityId, staffId, presence, showReminder]);
};
