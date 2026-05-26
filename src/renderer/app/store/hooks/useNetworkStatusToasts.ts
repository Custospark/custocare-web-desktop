import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { SystemStatus } from '../../../shared/components/Navigation/status-bar-components/StatusBarTypes';
import { getUserFirstName } from '../../../shared/utils/userGreeting';
import { useToast } from '../contexts/toast/useToast';
import {
  buildOfflineToastMessage,
  buildOnlineToastMessage,
} from '../network/networkStatusToasts';
import { selectSystemStatus } from '../slices/networkSlice';
import { selectUser } from '../slices/authSlice';

/** Connectivity toasts — top-center, above offline overlay (z-index 10001). */
const NETWORK_TOAST_POSITION = 'top-center' as const;
const NETWORK_TOAST_ELEVATED = true;
const NETWORK_TOAST_DURATION_MS = 8000;

/**
 * Fires info when entering offline; success when leaving offline.
 * Skips the first render (no toast on cold load).
 */
export function useNetworkStatusToasts(): void {
  const { showToast } = useToast();
  const systemStatus = useSelector(selectSystemStatus);
  const user = useSelector(selectUser);
  const firstName = useMemo(() => getUserFirstName(user), [user]);
  const previousStatusRef = useRef<SystemStatus | null>(null);

  useEffect(() => {
    const previous = previousStatusRef.current;

    if (previous === null) {
      previousStatusRef.current = systemStatus;
      return;
    }

    if (previous !== 'offline' && systemStatus === 'offline') {
      showToast(
        'info',
        buildOfflineToastMessage(firstName),
        NETWORK_TOAST_DURATION_MS,
        NETWORK_TOAST_POSITION,
        NETWORK_TOAST_ELEVATED,
      );
    }

    if (previous === 'offline' && systemStatus !== 'offline') {
      showToast(
        'success',
        buildOnlineToastMessage(firstName),
        NETWORK_TOAST_DURATION_MS,
        NETWORK_TOAST_POSITION,
        NETWORK_TOAST_ELEVATED,
      );
    }

    previousStatusRef.current = systemStatus;
  }, [systemStatus, firstName, showToast]);
}
