/**
 * NavigationBridge
 * ────────────────
 * Must be rendered inside <Router> so useNavigate() is available.
 * Registers the navigate function into the imperativeNavigate singleton
 * so non-React code (e.g. axios interceptors) can trigger navigation.
 *
 * Usage: drop <NavigationBridge /> anywhere inside your <Router> tree.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { imperativeNavigate } from './imperativeNavigate';

export function NavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    imperativeNavigate.register(navigate);
    return () => imperativeNavigate.unregister(); // clean up on unmount / HMR
  }, [navigate]);

  return null; // renders nothing
}