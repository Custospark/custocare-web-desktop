import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import {
  checkNetworkConnectivity,
  setBrowserOffline,
} from '../slices/networkSlice';

const CHECK_INTERVAL_MS = 30_000;

/**
 * Mount once at app root — syncs browser events + periodic probes into networkSlice.
 */
export function useNetworkStatusMonitor(): void {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleOffline = () => {
      dispatch(setBrowserOffline());
    };

    const handleOnline = () => {
      void dispatch(checkNetworkConnectivity());
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [dispatch]);

  useEffect(() => {
    const initialId = window.setTimeout(() => {
      void dispatch(checkNetworkConnectivity());
    }, 0);

    const intervalId = window.setInterval(() => {
      void dispatch(checkNetworkConnectivity());
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
    };
  }, [dispatch]);
}
