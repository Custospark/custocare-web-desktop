import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface NavigationGuardOptions {
  delay?: number;
  cooldown?: number;
  cancelQueries?: boolean;
}

export interface NavigationGuardReturn {
  navigate: (to: string | number) => void;
  isNavigating: boolean;
}

export function useNavigationGuard(options?: NavigationGuardOptions): NavigationGuardReturn {
  const { delay = 300, cooldown = 500, cancelQueries = false } = options ?? {};
  const reactNavigate = useNavigate();

  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNavRef = useRef(0);
  const isNavigatingRef = useRef(false);
  const navigateRef = useRef(reactNavigate);
  navigateRef.current = reactNavigate;

  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useCallback((to: string | number) => {
    if (!mountedRef.current) return;
    if (isNavigatingRef.current) return;

    const now = Date.now();
    if (now - lastNavRef.current < cooldown) return;
    lastNavRef.current = now;

    isNavigatingRef.current = true;
    setIsNavigating(true);

    if (cancelQueries) {
      import('../../app/api/axiosConfig').then((mod) => mod.cancelAllPendingQueries()).catch(() => {});
    }

    timerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        navigateRef.current(to);
      }
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }, delay);
  }, [delay, cooldown, cancelQueries]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { navigate, isNavigating };
}
