// hooks/useNetworkStatus.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { SystemStatus } from '../../../shared/components/Navigation/StatusBar';

interface NetworkStatusResult {
  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  retryConnection: () => void;
}

const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const TIMEOUT_MS = 10000; // 10 second timeout
const SLOW_THRESHOLD_MS = 1000; // >1s is considered slow

// Multiple endpoints for redundancy
const CONNECTIVITY_ENDPOINTS = [
  'https://www.google.com/favicon.ico',
  'https://www.cloudflare.com/favicon.ico',
  'https://www.github.com/favicon.ico',
];

/**
 * Real internet connectivity check hook
 * Tests actual network connectivity with latency measurement
 */
export const useNetworkStatus = (): NetworkStatusResult => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('online');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  /**
   * Perform real connectivity check by attempting to fetch a resource
   */
  const checkConnectivity = useCallback(async (): Promise<void> => {
    const startTime = performance.now();

    try {
      // Try first endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      await fetch(CONNECTIVITY_ENDPOINTS[0], {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const endTime = performance.now();
      const measuredLatency = Math.round(endTime - startTime);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLatency(measuredLatency);
        setLastChecked(new Date());
        setIsOnline(true);

        // Determine status based on latency
        if (measuredLatency > SLOW_THRESHOLD_MS) {
          setSystemStatus('slow');
        } else {
          setSystemStatus('online');
        }
      }
    } catch (error) {
      // Check if it's a timeout or network error
      if (error instanceof Error && error.name === 'AbortError') {
        // Timeout - still might be connected but very slow
        if (isMountedRef.current) {
          setSystemStatus('slow');
          setLatency(TIMEOUT_MS);
          setIsOnline(true);
        }
      } else {
        // Complete failure - try backup endpoints
        let anySuccess = false;

        for (let i = 1; i < CONNECTIVITY_ENDPOINTS.length; i++) {
          try {
            const backupController = new AbortController();
            const backupTimeoutId = setTimeout(() => backupController.abort(), TIMEOUT_MS);

            await fetch(CONNECTIVITY_ENDPOINTS[i], {
              method: 'HEAD',
              mode: 'no-cors',
              cache: 'no-cache',
              signal: backupController.signal,
            });

            clearTimeout(backupTimeoutId);

            const endTime = performance.now();
            const measuredLatency = Math.round(endTime - startTime);

            if (isMountedRef.current) {
              setLatency(measuredLatency);
              setIsOnline(true);
              setSystemStatus(measuredLatency > SLOW_THRESHOLD_MS ? 'slow' : 'online');
            }
            anySuccess = true;
            break;
          } catch {
            // Continue to next endpoint
            continue;
          }
        }

        if (!anySuccess && isMountedRef.current) {
          // All endpoints failed
          setSystemStatus('offline');
          setIsOnline(false);
          setLatency(null);
        }
      }

      if (isMountedRef.current) {
        setLastChecked(new Date());
      }
    }
  }, []);

  /**
   * Manual retry connection check
   */
  const retryConnection = useCallback(() => {
    checkConnectivity();
  }, [checkConnectivity]);

  /**
   * Handle browser online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      if (isMountedRef.current) {
        setIsOnline(true);
        checkConnectivity();
      }
    };

    const handleOffline = () => {
      if (isMountedRef.current) {
        setIsOnline(false);
        setSystemStatus('offline');
        setLatency(null);
        setLastChecked(new Date());
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity]);

  /**
   * Initial check and periodic monitoring
   */
  useEffect(() => {
    // Set mounted ref
    isMountedRef.current = true;
    
    // Use a microtask or setTimeout to defer the initial check
    // This avoids the synchronous setState warning
    const initialCheckId = setTimeout(() => {
      if (isMountedRef.current) {
        checkConnectivity();
      }
    }, 0);

    // Set up periodic checks
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        checkConnectivity();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialCheckId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [checkConnectivity]);

  return {
    systemStatus,
    isOnline,
    latency,
    lastChecked,
    retryConnection,
  };
};