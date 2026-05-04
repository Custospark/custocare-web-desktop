import React from 'react';
import { cn } from '../../../../shared/utils/classNameUtils';
import PrescriptionWorkbench from '../precriptions/views/PrescriptionWorkbench';

export interface PharmacyDispensingPanelProps {
  theme: 'light' | 'dark';
  className?: string;
}

/**
 * Visit-scoped dispensing workbench for Pharmacy Action Center (outlet content).
 */
const PharmacyDispensingPanel: React.FC<PharmacyDispensingPanelProps> = ({
  theme,
  className = '',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'rounded-lg border p-3 text-sm',
          isDark ? 'border-amber-800/50 bg-amber-950/40 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'
        )}
      >
        <strong className="font-semibold">Dispensing & billing:</strong> use the billing tray to search billable
        items and add dispensed medications to this visit. When fulfillment is complete, mark the prescription
        dispensed so inventory and clinical status stay aligned.
      </div>

      <PrescriptionWorkbench theme={theme} mode="queue" scope="activeVisit" />
    </div>
  );
};

PharmacyDispensingPanel.displayName = 'PharmacyDispensingPanel';

export default PharmacyDispensingPanel;
