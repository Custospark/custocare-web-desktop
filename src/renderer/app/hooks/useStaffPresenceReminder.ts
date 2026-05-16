// app/hooks/useStaffPresenceReminder.ts
/**
 * Periodically checks the current staff presence status and reminds the user
 * to update it if they've been in a non-ON_DUTY status past the threshold.
 *
 * On confirm the status is changed to ON_DUTY. Dismiss closes the dialog.
 *
 * == Testing ==
 * Uncomment the TEST_DURATION line below to shorten all thresholds.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useConfirm } from '../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { selectTheme } from '../store/slices/uiSlice';
import { useGetMyPresence, useSetMyPresence } from '../../modules/administration/admin-module/api/staff-presence/StaffPresenceQueries';
import { getActiveFacilityId, getStaffId } from '../store/utils/contextSelectors';
import { StaffPresenceStatus } from '../../modules/administration/admin-module/api/staff-presence/StaffPresenceTypes';
import type { RootState } from '../store/rootReducer';

// ─── Production: per-status thresholds (ms) ───────────────────────────
// const THRESHOLDS: Record<string, number> = {
//   [StaffPresenceStatus.BUSY]:        25 * 60 * 1000,
//   [StaffPresenceStatus.ON_BREAK]:    25 * 60 * 1000,
//   [StaffPresenceStatus.UNAVAILABLE]: 25 * 60 * 1000,
//   [StaffPresenceStatus.OFF_DUTY]:    25 * 60 * 1000,
// };

// ─── Testing: uncomment to override all thresholds ────────────────────
const THRESHOLDS: Record<string, number> = {
  [StaffPresenceStatus.BUSY]:        1 * 60 * 1000,
  [StaffPresenceStatus.ON_BREAK]:    1 * 60 * 1000,
  [StaffPresenceStatus.UNAVAILABLE]: 1 * 60 * 1000,
  [StaffPresenceStatus.OFF_DUTY]:    1 * 60 * 1000,
};

const CHECK_INTERVAL_MS = 30 * 1000; // check every 30s

const STORAGE_PREFIX = 'staffPresenceStatus';

interface StatusRecord {
  status: string;
  changedAt: number; // ms timestamp
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

/** Map status → dialog config */
const DIALOG_CONFIG: Record<string, {
  title: string;
  message: (name: string, mins: number) => string;
  confirmText: string;
  cancelText: string;
}> = {
  [StaffPresenceStatus.BUSY]: {
    title: 'Still busy?',
    message: (name, mins) => `${name}, you've been busy for ${mins} mins. Mark yourself as available?`,
    confirmText: "Yes, I'm free",
    cancelText: 'Still busy',
  },
  [StaffPresenceStatus.ON_BREAK]: {
    title: 'Still on break?',
    message: (name, mins) => `${name}, you've been on break for ${mins} mins. Back at work?`,
    confirmText: "Yes, I'm back",
    cancelText: 'Still on break',
  },
  [StaffPresenceStatus.UNAVAILABLE]: {
    title: 'Still unavailable?',
    message: (name, mins) => `${name}, you've been unavailable for ${mins} mins. Available now?`,
    confirmText: "Yes, I'm available",
    cancelText: 'Still unavailable',
  },
  [StaffPresenceStatus.OFF_DUTY]: {
    title: 'Start your shift?',
    message: (name, mins) => `${name}, you've been off duty for ${mins} mins. Starting work?`,
    confirmText: 'Start shift',
    cancelText: 'Dismiss',
  },
};

export const useStaffPresenceReminder = () => {
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const theme = useSelector(selectTheme);
  const firstName = useSelector((s: RootState) => s.activeContext.user?.first_name ?? 'There');
  const isStaff = useSelector((s: RootState) => s.activeContext.activeCapability === 'staff');
  const { confirm } = useConfirm();

  const { data: presenceData } = useGetMyPresence();
  const setPresence = useSetMyPresence();

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

    if (ok) {
      try {
        await setPresence.mutateAsync({ status: StaffPresenceStatus.ON_DUTY });
      } catch { /* user will see toast from mutation */ }
    }

    remindedRef.current = false;
  }, [confirm, firstName, theme, setPresence]);

  useEffect(() => {
    if (!facilityId || !staffId || !isStaff) return;

    const check = setInterval(() => {
      const presence = presenceData?.data;
      if (!presence) return;

      const status = presence.status;
      // Skip ON_DUTY — no reminder needed
      if (status === StaffPresenceStatus.ON_DUTY) {
        removeRecord(facilityId);
        return;
      }

      // Build or update the tracked record
      const recorded = readRecord(facilityId);
      const now = Date.now();

      if (!recorded || recorded.status !== status) {
        // Status changed — record the new state with current time
        writeRecord(facilityId, { status, changedAt: now });
        return;
      }

      // Same status — check elapsed time
      const elapsed = now - recorded.changedAt;
      const threshold = THRESHOLDS[status];
      if (!threshold || elapsed < threshold) return;

      // Past threshold — show reminder once
      if (!remindedRef.current) {
        showReminder(status, elapsed);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(check);
  }, [facilityId, staffId, presenceData, showReminder]);
};
