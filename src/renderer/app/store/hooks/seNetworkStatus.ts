import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { SystemStatus } from '../../../shared/components/Navigation/status-bar-components/StatusBarTypes';
import type { AppDispatch } from '../store';
import {
  checkNetworkConnectivity,
  selectIsOnline,
  selectLastCheckedAt,
  selectNetworkLatency,
  selectSystemStatus,
} from '../slices/networkSlice';

interface NetworkStatusResult {
  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  retryConnection: () => void;
}

/** Read network status from Redux (monitor runs at app root). */
export const useNetworkStatus = (): NetworkStatusResult => {
  const dispatch = useDispatch<AppDispatch>();
  const systemStatus = useSelector(selectSystemStatus);
  const isOnline = useSelector(selectIsOnline);
  const latency = useSelector(selectNetworkLatency);
  const lastChecked = useSelector(selectLastCheckedAt);

  const retryConnection = useCallback(() => {
    void dispatch(checkNetworkConnectivity());
  }, [dispatch]);

  return {
    systemStatus,
    isOnline,
    latency,
    lastChecked,
    retryConnection,
  };
};
