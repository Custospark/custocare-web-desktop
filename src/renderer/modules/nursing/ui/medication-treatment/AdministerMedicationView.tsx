import React, { useMemo, useState } from 'react';
import { FlaskConical, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import {
  useCreateNursingMedicationAdministration,
  useNursingMedicationAdministrations,
  useNursingMedicationSchedule,
} from '../../api/medication-treatment/nursingMedicationQueries';
import type {
  NursingMedicationAdministration,
  NursingMedicationAdministrationOutcome,
  NursingMedicationDose,
} from '../../api/medication-treatment/nursingMedicationTypes';

interface Props {
  theme: 'light' | 'dark';
}

function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

const OUTCOME_LABEL: Record<NursingMedicationAdministrationOutcome, string> = {
  given: 'Given',
  partial: 'Partial',
  refused: 'Refused',
  held: 'Held',
  omitted: 'Omitted',
};

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function patientNameFromDose(dose: NursingMedicationDose): string {
  const u = dose.patient?.user;
  if (u?.display_name?.trim()) return u.display_name.trim();
  const parts = [u?.first_name, u?.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : `Patient #${dose.patient_id}`;
}

const AdministerMedicationView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const { showToast } = useToast();

  const [selectedDoseId, setSelectedDoseId] = useState('');
  const [administeredAt, setAdministeredAt] = useState('');
  const [outcome, setOutcome] = useState<NursingMedicationAdministrationOutcome>('given');
  const [quantityGiven, setQuantityGiven] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);

  const scheduleQuery = useNursingMedicationSchedule({
    facilityId,
    status: 'pending',
    per_page: 100,
    enabled: facilityId > 0,
  });

  const administrationQuery = useNursingMedicationAdministrations({
    facilityId,
    page,
    per_page: 15,
    enabled: facilityId > 0,
  });

  const createMutation = useCreateNursingMedicationAdministration();

  const pendingDoses = useMemo(
    () => asArray<NursingMedicationDose>(scheduleQuery.data?.data),
    [scheduleQuery.data?.data]
  );

  const groupedPendingDoses = useMemo(() => {
    const groups = new Map<string, { patientName: string; doses: NursingMedicationDose[] }>();
    for (const dose of pendingDoses) {
      const name = patientNameFromDose(dose);
      const existing = groups.get(name);
      if (existing) {
        existing.doses.push(dose);
      } else {
        groups.set(name, { patientName: name, doses: [dose] });
      }
    }
    return [...groups.values()].sort((a, b) => a.patientName.localeCompare(b.patientName, undefined, { sensitivity: 'base' }));
  }, [pendingDoses]);

  const administrations = useMemo(
    () => asArray<NursingMedicationAdministration>(administrationQuery.data?.data),
    [administrationQuery.data?.data]
  );

  const selectedDose = useMemo(
    () => pendingDoses.find((d) => d.id === Number(selectedDoseId)) ?? null,
    [pendingDoses, selectedDoseId]
  );

  const busy = scheduleQuery.isFetching || administrationQuery.isFetching || createMutation.isPending;
  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';

  const resetForm = () => {
    setSelectedDoseId('');
    setAdministeredAt('');
    setOutcome('given');
    setQuantityGiven('');
    setQuantityUnit('');
    setNotes('');
    setReason('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !selectedDose) return;

    try {
      await createMutation.mutateAsync({
        facility_id: facilityId,
        visit_id: selectedDose.visit_id,
        prescription_item_id: selectedDose.prescription_item_id,
        nursing_medication_dose_id: selectedDose.id,
        administered_at: administeredAt ? new Date(administeredAt).toISOString() : new Date().toISOString(),
        outcome,
        quantity_given: quantityGiven ? Number(quantityGiven) : null,
        quantity_unit: quantityUnit.trim() || null,
        notes: notes.trim() || null,
        refusal_or_omission_reason: reason.trim() || null,
      });
      showToast('success', 'Administration recorded.', 3500);
      resetForm();
      setPage(1);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : '';
      showToast('error', msg || 'Could not record administration.', 5000);
    }
  };

  if (!facilityId) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
        }`}
      >
        Select an active facility to administer medication.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FlaskConical className="w-5 h-5 opacity-90" aria-hidden />
            Administer medication
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Record medication administrations for this facility.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            scheduleQuery.refetch();
            administrationQuery.refetch();
          }}
          disabled={busy}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer disabled:opacity-50 ${
            isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <form onSubmit={onSubmit} className={`rounded-xl border p-4 space-y-3 ${cardShell}`}>
        <div>
          <label htmlFor="am-dose" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Pending dose <span className="text-rose-500">*</span>
          </label>
          <select
            id="am-dose"
            value={selectedDoseId}
            onChange={(e) => setSelectedDoseId(e.target.value)}
            required
            className={`w-full rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
              isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
            }`}
            disabled={busy}
          >
            <option value="">— Select pending dose —</option>
            {groupedPendingDoses.map((group) => (
              <optgroup key={group.patientName} label={group.patientName}>
                {group.doses.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.prescriptionItem?.medication_name || `Item #${d.prescription_item_id}`} · {formatWhen(d.scheduled_for)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="am-outcome" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Outcome
            </label>
            <select
              id="am-outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as NursingMedicationAdministrationOutcome)}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={busy}
            >
              <option value="given">Given</option>
              <option value="partial">Partial</option>
              <option value="refused">Refused</option>
              <option value="held">Held</option>
              <option value="omitted">Omitted</option>
            </select>
          </div>
          <div>
            <label htmlFor="am-at" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Administered at
            </label>
            <input
              id="am-at"
              type="datetime-local"
              value={administeredAt}
              onChange={(e) => setAdministeredAt(e.target.value)}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="am-qty" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Quantity given
            </label>
            <div className="flex gap-2">
              <input
                id="am-qty"
                type="number"
                min="0"
                step="0.001"
                value={quantityGiven}
                onChange={(e) => setQuantityGiven(e.target.value)}
                className={`w-1/2 rounded-lg border px-2 py-1.5 text-sm ${
                  isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                }`}
                disabled={busy}
              />
              <input
                type="text"
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                placeholder="unit"
                className={`w-1/2 rounded-lg border px-2 py-1.5 text-sm ${
                  isDark ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                }`}
                disabled={busy}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="am-notes" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Notes
            </label>
            <textarea
              id="am-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full min-h-[80px] rounded-lg border px-2 py-1.5 text-sm ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
              }`}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="am-reason" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Refusal/omission reason
            </label>
            <textarea
              id="am-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full min-h-[80px] rounded-lg border px-2 py-1.5 text-sm ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
              }`}
              disabled={busy}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={busy || !selectedDoseId}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {createMutation.isPending ? 'Saving…' : 'Record administration'}
          </button>
          <button
            type="button"
            onClick={() => resetForm()}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm border cursor-pointer disabled:opacity-50 ${
              isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            Clear
          </button>
        </div>
      </form>

      <div className={`rounded-xl border p-4 ${cardShell}`}>
        <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent administrations</h3>

        {administrationQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <div
              className={`inline-block h-8 w-8 animate-spin rounded-full border-2 ${
                isDark ? 'border-gray-600 border-t-blue-400' : 'border-gray-200 border-t-blue-600'
              }`}
            />
          </div>
        ) : administrations.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No administrations recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {administrations.map((row) => (
              <li
                key={row.id}
                className={`rounded-lg border p-3 ${isDark ? 'border-gray-700 bg-gray-950/40' : 'border-gray-200 bg-gray-50/80'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md border ${
                      isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {OUTCOME_LABEL[row.outcome]}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{formatWhen(row.administered_at)}</span>
                </div>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {row.prescriptionItem?.medication_name || `Item #${row.prescription_item_id}`} · Visit{' '}
                  {row.visit?.visit_uuid || row.visit_id}
                </p>
                {row.notes ? <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Notes: {row.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}

        {administrationQuery.data?.meta && administrationQuery.data.meta.last_page > 1 ? (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-600/30">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Page {administrationQuery.data.meta.current_page} of {administrationQuery.data.meta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || busy}
                className={`px-3 py-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= administrationQuery.data.meta.last_page || busy}
                className={`px-3 py-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdministerMedicationView;
