/**
 * ============================================================================
 * HOSPITAL BILLING SYSTEM - MAIN INTEGRATION
 * ============================================================================
 * 
 * Complete hospital-friendly billing workflow with:
 * - Compact always-visible BillingSpace control
 * - Single overlay with step switching (no stacked overlays)
 * - Dirty state protection against accidental closure
 * - Session persistence for draft protection
 * - Theme-aware styling
 * 
 * USAGE:
 * 
 * import { HospitalBilling } from './hospital-billing';
 * 
 * function PatientVisitPage() {
 *   const theme = useAppSelector(state => state.theme.mode);
 *   const activeVisit = useAppSelector(state => state.activeContext.activeVisit);
 *   const confirmDialog = useConfirm();
 * 
 *   return (
 *     <div className="patient-layout">
 *       <div className="sidebar">
 *         <HospitalBilling
 *           theme={theme}
 *           visitId={activeVisit?.id || null}
 *           patientName={activeVisit?.patient?.full_name}
 *           patientNumber={activeVisit?.patient?.patient_number}
 *           confirm={confirmDialog.confirm}
 *         />
 *       </div>
 *       <div className="main-content">
 *         ...
 *       </div>
 *     </div>
 *   );
 * }
 */

import React, { useCallback } from 'react';
import { BillingProvider } from './BillingContext';
import { BillingSpace } from './BillingSpace';
import { BillingTrayOverlay } from './BillingTrayOverlay';
import { DEFAULT_TAXES, DEFAULT_DISCOUNT } from './billing.types';
import type { ConfirmOptions } from './billing.types';

// ============================================================================
// TYPES
// ============================================================================

interface HospitalBillingProps {
  theme: 'light' | 'dark';
  visitId: number | null;
  patientName?: string;
  patientNumber?: string;
  confirm?: (options: Omit<ConfirmOptions, 'theme'>) => Promise<boolean>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HospitalBilling: React.FC<HospitalBillingProps> = ({
  theme,
  visitId,
  patientName,
  patientNumber,
  confirm,
}) => {
  // Confirm close handler
  const handleConfirmClose = useCallback(async (): Promise<boolean> => {
    if (!confirm) return true;

    return await confirm({
      title: 'Discard billing changes?',
      message: 'You have unsaved billing changes. Closing will discard them.',
      confirmText: 'Discard',
      cancelText: 'Cancel',
      variant: 'warning',
    });
  }, [confirm]);

  return (
    <BillingProvider
      visitId={visitId}
      defaultTaxes={DEFAULT_TAXES}
      defaultDiscount={DEFAULT_DISCOUNT}
    >
      {/* Always-visible compact control */}
      <BillingSpace
        theme={theme}
        patientName={patientName}
        patientNumber={patientNumber}
      />

      {/* Single overlay - switches between steps */}
      <BillingTrayOverlay
        theme={theme}
        patientName={patientName}
        patientNumber={patientNumber}
        onConfirmClose={handleConfirmClose}
      />
    </BillingProvider>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { BillingProvider, useBilling } from './BillingContext';
export { BillingSpace } from './BillingSpace';
export { BillingTrayOverlay } from './BillingTrayOverlay';
export { ChargeEntry } from './ChargeEntry';
export { BillingSummary } from './BillingSummary';
export * from './billing.types';