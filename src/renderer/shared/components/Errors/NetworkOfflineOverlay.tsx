/**
 * Global offline gate — mounts at app root; shows Offline only when networkSlice is offline.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { useNetworkStatusMonitor } from '../../../app/store/hooks/useNetworkStatusMonitor';
import { selectIsCompletelyOffline } from '../../../app/store/slices/networkSlice';
import Offline from './Offline';

const NetworkOfflineOverlay: React.FC = () => {
  useNetworkStatusMonitor();

  const isCompletelyOffline = useSelector(selectIsCompletelyOffline);

  if (!isCompletelyOffline) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] overflow-auto"
      role="alertdialog"
      aria-modal="true"
      aria-label="You are offline"
    >
      <Offline />
    </div>
  );
};

export default NetworkOfflineOverlay;
