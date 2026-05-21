import React, { useMemo } from 'react';
import { Pill, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisit } from '../../../../app/store/slices/visitSlice';
import { selectActiveVisitPatientId } from '../../../../app/store/slices/visitSlice';
import { useGetVisitPrescriptions } from '../../../medical-records/api/prescription/PrescriptionQueries';
import { PrescriptionStatus } from '../../../medical-records/api/prescription/PrescriptionTypes';
import type { Prescription, PrescriptionItem } from '../../../medical-records/api/prescription/PrescriptionTypes';
import { cn } from '../../../../shared/utils/classNameUtils';
import { getNursingEncounterChrome } from './nursingEncounterChrome';

interface Props {
  theme: 'light' | 'dark';
}

function formatDosage(qty: number | string | null | undefined, unit: string | null | undefined): string {
  if (qty == null) return '';
  const q = typeof qty === 'string' ? qty : String(qty);
  return unit ? `${q} ${unit}` : q;
}

const NursingEncounterMedsView: React.FC<Props> = ({ theme }) => {
  const chrome = getNursingEncounterChrome(theme);
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const activeVisit = useAppSelector(selectActiveVisit);
  const activePatientId = useAppSelector(selectActiveVisitPatientId);
  const visitId = activeVisit?.visit_id;
  const patientNumericId = activePatientId ? Number(activePatientId) : 0;

  const rxQuery = useGetVisitPrescriptions(visitId ?? 0, patientNumericId, {
    enabled: facilityId > 0 && !!visitId && patientNumericId > 0,
  });

  const activePrescriptions: Prescription[] = useMemo(() => {
    const all = rxQuery.data?.data ?? [];
    const list = Array.isArray(all) ? all : [];
    return list.filter(
      (p) => p.status === PrescriptionStatus.ACTIVE || p.status === PrescriptionStatus.PARTIALLY_DISPENSED
    );
  }, [rxQuery.data]);

  const medicationRows: { rx: Prescription; item: PrescriptionItem }[] = useMemo(() => {
    const rows: { rx: Prescription; item: PrescriptionItem }[] = [];
    for (const rx of activePrescriptions) {
      const items = rx.items ?? [];
      for (const item of items) {
        rows.push({ rx, item });
      }
    }
    return rows;
  }, [activePrescriptions]);

  const busy = rxQuery.isFetching;

  if (!facilityId) {
    return (
      <div className={chrome.emptyPanel}>
        <p className={chrome.body}>Select an active facility first.</p>
      </div>
    );
  }

  if (!visitId) {
    return (
      <div className={chrome.emptyPanel}>
        <p className={cn(chrome.body, 'leading-relaxed')}>
          Open a patient encounter to view medications for their active prescriptions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className={cn('flex items-center gap-2 text-lg font-semibold tracking-tight', chrome.heading)}>
            <Pill className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            Visit medications
          </h2>
          <p className={cn('text-sm leading-snug', chrome.subhead)}>
            Active prescription items for {activeVisit?.patient?.name?.trim() || 'this visit'}.
          </p>
        </div>
        <button type="button" onClick={() => rxQuery.refetch()} disabled={busy} className={cn(chrome.btnSecondary, 'shrink-0 cursor-pointer')}>
          <RefreshCw className={cn('h-4 w-4 shrink-0', busy ? 'animate-spin' : '')} aria-hidden />
          Refresh
        </button>
      </header>

      {rxQuery.isLoading ? (
        <p className={cn('text-sm', chrome.muted)}>Loading medications...</p>
      ) : medicationRows.length === 0 ? (
        <div className={cn('rounded-xl border p-6 text-sm leading-relaxed', chrome.card)}>
          <p className={chrome.muted}>No active prescription items for this visit.</p>
        </div>
      ) : (
        <div className={cn('rounded-xl border divide-y', chrome.card, chrome.divide)}>
          {medicationRows.map(({ rx, item }) => (
            <div key={`${rx.id}-${item.id}`} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('font-semibold leading-snug', chrome.rowTitle)}>
                    {item.medication_name}
                  </span>
                  {item.strength ? (
                    <span className={cn('text-xs', chrome.subtle)}>{item.strength}</span>
                  ) : null}
                </div>
                <div className={cn('mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-relaxed', chrome.subtle)}>
                  <span>{formatDosage(item.dosage_quantity, item.dosage_unit)}</span>
                  <span>{item.frequency}</span>
                  <span>{item.route}</span>
                  {item.duration_value ? (
                    <span>{item.duration_value} {item.duration_unit}(s)</span>
                  ) : null}
                  {item.instructions ? (
                    <span className="italic">{item.instructions}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NursingEncounterMedsView;
