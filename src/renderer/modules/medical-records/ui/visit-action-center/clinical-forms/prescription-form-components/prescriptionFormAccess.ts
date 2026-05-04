import { PrescriptionStatus } from '../../../../api/prescription/PrescriptionTypes';

/**
 * Whether clinical/pharmacy users may change prescription header fields, medications, and submit updates.
 * Locked after dispensing has started or when the Rx is terminal.
 */
export function canEditPrescriptionForm(status: PrescriptionStatus | undefined | null): boolean {
  if (status == null) return true;

  if (
    status === PrescriptionStatus.PARTIALLY_DISPENSED ||
    status === PrescriptionStatus.FULLY_DISPENSED ||
    status === PrescriptionStatus.CANCELLED ||
    status === PrescriptionStatus.EXPIRED
  ) {
    return false;
  }

  return true;
}

/**
 * Delete is only allowed while the prescription is still a draft (not released to dispensing).
 * Active / on-hold / any post-draft status cannot be removed from here.
 */
export function canDeletePrescriptionForm(status: PrescriptionStatus | undefined | null): boolean {
  return status === PrescriptionStatus.DRAFT;
}

export function prescriptionReadOnlyReason(status: PrescriptionStatus | undefined | null): string | null {
  if (status == null) return null;
  if (status === PrescriptionStatus.PARTIALLY_DISPENSED || status === PrescriptionStatus.FULLY_DISPENSED) {
    return 'This prescription has dispensing activity — it cannot be edited or deleted.';
  }
  if (status === PrescriptionStatus.CANCELLED) return 'This prescription is cancelled — view only.';
  if (status === PrescriptionStatus.EXPIRED) return 'This prescription has expired — view only.';
  return null;
}
