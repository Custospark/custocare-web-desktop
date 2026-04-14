import {
  type ForwardingStaff,
  StaffPresenceStatus,
} from  '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import type {
  ForwardPatientFormData,
  StaffFilterStatus,
} from './schema';
import { statusOrder } from './constants';

export interface PendingForwardingLike {
  visitId?: string | number | null;
  patientId?: string | number | null;
  patientName?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  note?: string;
  hasProvidedServices?: boolean | null;
}

export const getDerivedPatientName = (activeVisit: unknown): string => {
  const visit = activeVisit as any;
  return visit?.patient?.name ?? visit?.patientName ?? visit?.patient_name ?? '';
};

export const getDerivedPatientId = (activeVisit: unknown): number | string | null => {
  const visit = activeVisit as any;
  return visit?.patient_id ?? visit?.patient?.id ?? null;
};

export const getDisplayVisitId = (
  visitId: number | string | null | undefined,
  pendingForwarding?: PendingForwardingLike | null
): string | undefined => {
  if (visitId != null) return String(visitId);
  if (pendingForwarding?.visitId != null) return String(pendingForwarding.visitId);
  return undefined;
};

export const getDisplayPatientId = (
  derivedPatientId: number | string | null | undefined,
  pendingForwarding?: PendingForwardingLike | null
): string | undefined => {
  if (derivedPatientId != null) return String(derivedPatientId);
  if (pendingForwarding?.patientId != null) return String(pendingForwarding.patientId);
  return undefined;
};

export const getDisplayPatientName = (
  derivedPatientName: string,
  pendingForwarding?: PendingForwardingLike | null
): string | undefined => {
  return derivedPatientName || pendingForwarding?.patientName || undefined;
};

export const filterAndSortStaff = ({
  staffMembers,
  searchTerm,
  filterStatus,
}: {
  staffMembers: ForwardingStaff[];
  searchTerm: string;
  filterStatus: StaffFilterStatus;
}) => {
  let staff = staffMembers;

  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();

    staff = staff.filter(
      (member) =>
        member.full_name?.toLowerCase().includes(searchLower) ||
        member.employee_id?.toLowerCase().includes(searchLower) ||
        member.staff_uuid?.toLowerCase().includes(searchLower) ||
        member.role_code?.toLowerCase().includes(searchLower)
    );
  }

  if (filterStatus === 'available') {
    staff = staff.filter((member) => member.is_available);
  } else if (filterStatus === 'on_duty') {
    staff = staff.filter(
      (member) => member.presence_status === StaffPresenceStatus.ON_DUTY
    );
  } else if (filterStatus === 'busy') {
    staff = staff.filter(
      (member) => member.presence_status === StaffPresenceStatus.BUSY
    );
  }

  return [...staff].sort((a, b) => {
    if (a.is_available !== b.is_available) {
      return a.is_available ? -1 : 1;
    }

    const aOrder = statusOrder[a.presence_status] ?? 99;
    const bOrder = statusOrder[b.presence_status] ?? 99;

    if (aOrder !== bOrder) return aOrder - bOrder;

    return a.workload_percentage - b.workload_percentage;
  });
};

export const buildStaffSummary = (staffMembers: ForwardingStaff[]) => {
  if (staffMembers.length === 0) return null;

  const available = staffMembers.filter((staff) => staff.is_available).length;
  const busy = staffMembers.filter(
    (staff) => staff.presence_status === StaffPresenceStatus.BUSY
  ).length;
  const total = staffMembers.length;

  return { available, busy, total };
};

export const buildForwardingPayload = ({
  visitId,
  derivedPatientId,
  derivedPatientName,
  selectedStaff,
  pendingForwarding,
  formData,
  effectiveHasProvidedServices,
}: {
  visitId: number | string | null | undefined;
  derivedPatientId: number | string | null;
  derivedPatientName: string;
  selectedStaff?: ForwardingStaff;
  pendingForwarding?: PendingForwardingLike | null;
  formData: ForwardPatientFormData;
  effectiveHasProvidedServices: boolean;
}) => ({
  visitId,
  patientId: derivedPatientId,
  patientName: derivedPatientName || '',
  assignedStaffId: formData.assigned_staff_id,
  assignedStaffName:
    selectedStaff?.full_name || pendingForwarding?.assignedStaffName || '',
  note: formData.note?.trim() || '',
  hasProvidedServices: effectiveHasProvidedServices,
});
