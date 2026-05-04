import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle2, ClipboardList, Search, ShieldAlert, XCircle } from 'lucide-react';
import {
  useCancelPrescription,
  useGetPrescriptions,
  useGetPatientPrescriptions,
  useMarkPrescriptionDispensed,
} from '../../../../medical-records/api/prescription/PrescriptionQueries';
import {
  CancellationReason,
  PrescriptionStatus,
  canBeDispensed,
  type Prescription,
} from '../../../../medical-records/api/prescription/PrescriptionTypes';
import {
  selectActivePatient,
  selectActiveVisitId,
  selectActiveVisitPatientId,
} from '../../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../../app/store/store';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';

type WorkbenchMode = 'queue' | 'search' | 'review' | 'flagged' | 'approved' | 'create';

export type PrescriptionWorkbenchScope = 'facility' | 'activeVisit';

interface PrescriptionWorkbenchProps {
  theme: 'light' | 'dark';
  mode: WorkbenchMode;
  /** Facility lists (default) vs current visit from visitSlice (pharmacy workstation). */
  scope?: PrescriptionWorkbenchScope;
}

const statusTone = (status: string): string => {
  if (status === PrescriptionStatus.ACTIVE || status === PrescriptionStatus.FULLY_DISPENSED) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (status === PrescriptionStatus.ON_HOLD || status === PrescriptionStatus.PARTIALLY_DISPENSED) {
    return 'bg-amber-100 text-amber-700';
  }
  if (status === PrescriptionStatus.CANCELLED) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-slate-100 text-slate-700';
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const modeTitle: Record<WorkbenchMode, string> = {
  queue: 'Prescription Queue',
  search: 'Search Prescriptions',
  review: 'Review Prescriptions',
  flagged: 'Flagged Prescriptions',
  approved: 'Approved Prescriptions',
  create: 'New Prescription',
};

export const PrescriptionWorkbench: React.FC<PrescriptionWorkbenchProps> = ({
  theme,
  mode,
  scope = 'facility',
}) => {
  const isDark = theme === 'dark';
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const activePatient = useSelector(selectActivePatient);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activeFacilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);

  const patientNumericId = activePatientId ? Number(activePatientId) : 0;

  const patientPrescriptionsQuery = useGetPatientPrescriptions(patientNumericId, [], {
    enabled: !!patientNumericId && mode === 'create',
    refetchOnMount: true,
  });
  const facilityPrescriptionsQuery = useGetPrescriptions(
    {
      facility_id: activeFacilityId ?? undefined,
      ...(mode === 'queue' ? { status: PrescriptionStatus.ACTIVE } : {}),
    },
    {
      enabled: scope === 'facility' && !!activeFacilityId && mode !== 'create',
      refetchOnMount: true,
    }
  );
  const activeVisitPrescriptionsQuery = useGetPatientPrescriptions(patientNumericId, [], {
    enabled: scope === 'activeVisit' && !!patientNumericId && mode !== 'create',
    refetchOnMount: true,
  });

  const prescriptionsQuery =
    mode === 'create'
      ? patientPrescriptionsQuery
      : scope === 'activeVisit'
        ? activeVisitPrescriptionsQuery
        : facilityPrescriptionsQuery;
  const markDispensed = useMarkPrescriptionDispensed();
  const cancelPrescription = useCancelPrescription();

  const allPrescriptions = useMemo(() => {
    const rows = prescriptionsQuery.data?.data ?? [];
    if (scope !== 'activeVisit' || activeVisitId == null) return rows;
    return rows.filter((item) => item.visit_id === activeVisitId);
  }, [prescriptionsQuery.data, scope, activeVisitId]);

  const filteredByMode = useMemo(() => {
    switch (mode) {
      case 'approved':
        return allPrescriptions.filter((item) => item.status === PrescriptionStatus.FULLY_DISPENSED);
      case 'flagged':
        return allPrescriptions.filter(
          (item) =>
            item.status === PrescriptionStatus.ON_HOLD ||
            item.status === PrescriptionStatus.CANCELLED ||
            item.status === PrescriptionStatus.EXPIRED
        );
      case 'queue':
        return allPrescriptions.filter((item) => item.status === PrescriptionStatus.ACTIVE && !!item.visit_id);
      case 'review':
      case 'search':
      case 'create':
      default:
        return allPrescriptions;
    }
  }, [allPrescriptions, mode]);

  const visiblePrescriptions = useMemo(() => {
    if (!searchTerm.trim()) return filteredByMode;
    const query = searchTerm.toLowerCase();
    return filteredByMode.filter((item) => {
      const patientName = item.patient?.name ?? '';
      return (
        item.prescription_number.toLowerCase().includes(query) ||
        (item.diagnosis ?? '').toLowerCase().includes(query) ||
        patientName.toLowerCase().includes(query)
      );
    });
  }, [filteredByMode, searchTerm]);

  const selectedPrescription = useMemo(() => {
    if (selectedPrescriptionId === null) return visiblePrescriptions[0] ?? null;
    return visiblePrescriptions.find((item) => item.id === selectedPrescriptionId) ?? null;
  }, [selectedPrescriptionId, visiblePrescriptions]);

  const handleDispense = async (prescription: Prescription) => {
    await markDispensed.mutateAsync({
      id: prescription.id,
      data: {
        pharmacy_name: 'Main Pharmacy',
      },
    });
  };

  const handleCancel = async (prescription: Prescription) => {
    await cancelPrescription.mutateAsync({
      id: prescription.id,
      data: {
        cancellation_reason: CancellationReason.OUT_OF_STOCK,
        cancellation_notes: 'Cancelled from pharmacy queue',
      },
    });
  };

  if (mode !== 'create' && scope === 'facility' && !activeFacilityId) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 p-6 text-sm text-amber-700">
        Select an active facility first to open the pharmacy prescription queue.
      </div>
    );
  }

  if (mode !== 'create' && scope === 'activeVisit' && (!patientNumericId || !activeVisitId)) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 p-6 text-sm text-amber-700">
        No active visit in context. Open a patient from the pharmacy queue first.
      </div>
    );
  }

  if (mode === 'create' && !patientNumericId) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 p-6 text-sm text-amber-700">
        Select an active patient visit first to work on pharmacy prescriptions.
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold">Start New Prescription</h3>
        <p className="mt-2 text-sm text-slate-600">
          Prescription authoring is handled in clinical documentation. Pharmacy focuses on
          validation, dispensing, and fulfillment after prescriber submission.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Active patient: <span className="font-semibold">{activePatient?.name ?? 'N/A'}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">{modeTitle[mode]}</h3>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prescription number, diagnosis..."
            className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm ${
              isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white'
            }`}
          />
        </div>
      </div>

      {prescriptionsQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
          Loading prescriptions...
        </div>
      ) : visiblePrescriptions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No prescriptions found for this view.
        </div>
      ) : mode === 'review' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
            {visiblePrescriptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPrescriptionId(item.id)}
                className={`w-full rounded-lg border p-3 text-left ${
                  selectedPrescription?.id === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <p className="font-medium">{item.prescription_number}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(item.prescription_date)}</p>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            {selectedPrescription && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">{selectedPrescription.prescription_number}</p>
                  <span className={`rounded px-2 py-0.5 text-xs ${statusTone(selectedPrescription.status)}`}>
                    {selectedPrescription.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  Diagnosis: {selectedPrescription.diagnosis || 'Not documented'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Clinical notes: {selectedPrescription.clinical_notes || 'Not documented'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Prescribed on: {formatDate(selectedPrescription.prescription_date)}
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visiblePrescriptions.map((item) => {
            const canDispense = item.status === PrescriptionStatus.ACTIVE;
            const canCancel =
              item.status !== PrescriptionStatus.CANCELLED &&
              item.status !== PrescriptionStatus.FULLY_DISPENSED;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{item.prescription_number}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(item.prescription_date)} • {item.diagnosis || 'No diagnosis'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Patient: {item.patient?.name || 'Unknown'} • Visit:{' '}
                    {item.visit?.visit_uuid || item.visit_id || 'N/A'}
                  </p>
                  <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-xs ${statusTone(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPrescriptionId(item.id)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispense(item)}
                    disabled={!canDispense || !canBeDispensed(item) || markDispensed.isPending}
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Dispense
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(item)}
                    disabled={!canCancel || cancelPrescription.isPending}
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === 'flagged' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <ShieldAlert className="mr-2 inline h-4 w-4" />
          Prioritize on-hold, expired, and cancelled prescriptions for pharmacist intervention.
        </div>
      )}
    </div>
  );
};

export default PrescriptionWorkbench;
