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
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../api/axiosConfig';
import { useConfirm } from '../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { selectTheme } from '../store/slices/uiSlice';
import { getActiveFacilityId, getStaffId } from '../store/utils/contextSelectors';
import { StaffPresenceStatus } from '../../modules/administration/admin-module/api/staff-presence/StaffPresenceTypes';
import type { RootState } from '../store/rootReducer';

// ─── Production: per-status thresholds (ms) ───────────────────────────
const THRESHOLDS: Record<string, number> = {
  [StaffPresenceStatus.BUSY]:        25 * 60 * 1000,
  [StaffPresenceStatus.ON_BREAK]:    25 * 60 * 1000,
  [StaffPresenceStatus.UNAVAILABLE]: 25 * 60 * 1000,
  [StaffPresenceStatus.OFF_DUTY]:    25 * 60 * 1000,
};

// ─── Testing: uncomment to override all thresholds ────────────────────
// const THRESHOLDS: Record<string, number> = {
//   [StaffPresenceStatus.BUSY]:        2 * 60 * 1000,
//   [StaffPresenceStatus.ON_BREAK]:    2 * 60 * 1000,
//   [StaffPresenceStatus.UNAVAILABLE]: 2 * 60 * 1000,
//   [StaffPresenceStatus.OFF_DUTY]:    2 * 60 * 1000,
// };

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
const fetchMyPresence = async (facilityId: number, staffId: number) => {
  const { data } = await axiosInstance.get('/staff/presence/facility', {
    params: { facility_id: facilityId, staff_id: staffId },
  });
  return data?.data ?? null;
};

export const useStaffPresenceReminder = () => {
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const theme = useSelector(selectTheme);
  const firstName = useSelector((s: RootState) => s.activeContext.user?.first_name ?? 'There');
  const activeCapability = useSelector((s: RootState) => s.activeContext.activeCapability);
  const isStaff = activeCapability === 'staff';
  const { confirm } = useConfirm();

  // Only query presence when in staff mode with valid IDs
  const { data: presence } = useQuery({
    queryKey: ['staff-presence', 'my-presence', facilityId, staffId],
    queryFn: () => fetchMyPresence(facilityId!, staffId!),
    enabled: isStaff && !!facilityId && !!staffId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const setOnDuty = useCallback(async () => {
    if (!facilityId || !staffId) return;
    try {
      await axiosInstance.post('/staff/presence/facility', {
        facility_id: facilityId,
        status: StaffPresenceStatus.ON_DUTY,
        updated_by: 'staff',
      });
    } catch { /* silently fail — toast may not be available */ }
  }, [facilityId, staffId]);

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
    if (!isStaff || !facilityId || !staffId) return;

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
  }, [isStaff, facilityId, staffId, presence, showReminder]);
};
