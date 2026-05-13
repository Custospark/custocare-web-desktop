import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Pill } from 'lucide-react';
import type { RootState } from '../../../../app/store/rootReducer';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import { PATIENT_PORTAL_ROUTES } from '../../../../app/routes/routeConstants';
import { useGetPatientPrescriptions } from '../../../medical-records/api/prescription/PrescriptionQueries';
import type { Prescription } from '../../../medical-records/api/prescription/PrescriptionTypes';
import type { PrescriptionItem } from '../../../medical-records/api/prescription-items/PrescriptionItemsTypes';
import type {
  MedicalHistoryPrescription,
  MedicalHistoryPrescriptionItem,
} from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import { usePatientPortalLatestEncounter } from '../../hooks/usePatientPortalLatestEncounter';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { PatientPortalClinicalPreviewShell } from '../preview/PatientPortalClinicalPreviewShell';
import {
  formatDate,
  formatDateTime,
  formatPreviewText,
  previewClinicianLabel,
  PreviewFacilityCell,
} from '../preview/patientPortalClinicalPreview.utils';

type Ctx = { theme: 'light' | 'dark' };

type MergedRx =
  | { kind: 'api'; prescription: Prescription }
  | { kind: 'aggregate'; prescription: MedicalHistoryPrescription };

function mapApiItemToHistoryItem(it: PrescriptionItem): MedicalHistoryPrescriptionItem {
  return {
    id: it.id,
    medication_name: it.medication_name,
    brand_name: it.brand_name,
    strength: it.strength,
    dosage_form: String(it.dosage_form),
    dosage_quantity: it.dosage_quantity,
    dosage_unit: String(it.dosage_unit),
    frequency: it.frequency != null ? String(it.frequency) : null,
    duration_value: it.duration_value,
    duration_unit: String(it.duration_unit),
    route: it.route != null ? String(it.route) : null,
    instructions: it.instructions,
    refills: it.refills != null ? String(it.refills) : null,
  };
}

function apiPrescriptionToHistoryShape(p: Prescription): MedicalHistoryPrescription {
  return {
    id: p.id,
    visit_id: p.visit_id,
    facility_id: p.facility_id,
    facility: null,
    prescription_number: p.prescription_number,
    prescription_date: p.prescription_date,
    status: p.status,
    prescription_type: p.prescription_type,
    priority: p.priority,
    diagnosis: p.diagnosis,
    clinical_notes: p.clinical_notes,
    special_instructions: p.special_instructions,
    created_at: p.created_at,
    occurred_at: p.prescription_date,
    clinician: p.prescribed_by ? { id: p.prescribed_by.id, name: p.prescribed_by.name } : null,
    items: (p.items ?? []).map(mapApiItemToHistoryItem),
  };
}

export function PatientPortalMedicationsLatestPage() {
  const { theme } = useOutletContext<Ctx>();
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const {
    historyQuery,
    latestVisitContextQuery,
    effectiveVisitId,
    scopedForEffective,
    headerVisit,
    headerFacility,
  } = usePatientPortalLatestEncounter(numericId);

  const prescriptionsQuery = useGetPatientPrescriptions(numericId, [], {
    enabled: numericId > 0,
    staleTime: 30_000,
  });

  const apiForVisit = useMemo(() => {
    const list = prescriptionsQuery.data?.data ?? [];
    if (effectiveVisitId == null) return [];
    return list.filter((p) => p.visit_id === effectiveVisitId);
  }, [prescriptionsQuery.data, effectiveVisitId]);

  const merged = useMemo((): MergedRx[] => {
    const aggregateList = scopedForEffective?.prescriptions ?? [];
    const apiIds = new Set(apiForVisit.map((p) => p.id));
    const fromApi: MergedRx[] = apiForVisit.map((p) => ({ kind: 'api', prescription: p }));
    const fromAgg: MergedRx[] = aggregateList
      .filter((row) => !apiIds.has(row.id))
      .map((p) => ({ kind: 'aggregate', prescription: p }));
    return [...fromApi, ...fromAgg];
  }, [apiForVisit, scopedForEffective?.prescriptions]);

  const previewPrescriptions = useMemo(
    () =>
      merged.map((row) =>
        row.kind === 'aggregate' ? row.prescription : apiPrescriptionToHistoryShape(row.prescription)
      ),
    [merged]
  );

  if (!numericId) {
    return (
      <div className="p-6 text-sm text-gray-600 dark:text-gray-400">
        Patient record could not be loaded. Please sign in again or contact support.
      </div>
    );
  }

  const loading =
    historyQuery.isLoading ||
    (latestVisitContextQuery.isPending && !historyQuery.data);

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading medications for your latest visit…" />
      </div>
    );
  }

  if (historyQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm text-red-700 dark:text-red-300">
          {(historyQuery.error as Error)?.message ?? 'Unable to load visit information.'}
        </p>
      </div>
    );
  }

  const visitContextReady =
    historyQuery.isSuccess &&
    (latestVisitContextQuery.isSuccess || latestVisitContextQuery.isFetched);

  if (visitContextReady && effectiveVisitId == null) {
    return (
      <PatientPortalClinicalPreviewShell
        theme={theme}
        title="Medications — latest visit"
        subtitle="When you have a hospital visit with prescriptions, a read-only preview will appear here."
        sectionLabel="Preview"
        icon={<Pill className="h-8 w-8" />}
        headerVisit={null}
        headerFacility={null}
        fullHistoryHref={PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_FULL}
        fullHistoryLinkLabel="Medical history (full)"
      >
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          No visit on file yet. Open Medical history for your full record when available.
        </p>
      </PatientPortalClinicalPreviewShell>
    );
  }

  const banner = prescriptionsQuery.isError ? (
    <div className="mx-auto mb-4 max-w-4xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 print:hidden">
      {(prescriptionsQuery.error as Error)?.message ??
        'Live prescriptions could not be refreshed; preview may rely on your continuity-of-care summary only.'}
    </div>
  ) : null;

  return (
    <PatientPortalClinicalPreviewShell
      theme={theme}
      title="Medications — latest visit"
      subtitle="Read-only preview of prescriptions from your most recent hospital visit. For all visits and richer context, open Medical history."
      sectionLabel="Preview"
      icon={<Pill className="h-8 w-8" />}
      headerVisit={headerVisit}
      headerFacility={headerFacility}
      fullHistoryHref={PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_FULL}
      fullHistoryLinkLabel="Medical history (full)"
      banner={banner}
    >
      {previewPrescriptions.length === 0 ? (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          No prescriptions were recorded for this visit. Your full timeline may still include medications under other
          visits — see Medical history.
        </p>
      ) : (
        <PrescriptionsPreviewBody prescriptions={previewPrescriptions} />
      )}
    </PatientPortalClinicalPreviewShell>
  );
}

function PrescriptionsPreviewBody({ prescriptions }: { prescriptions: MedicalHistoryPrescription[] }) {
  return (
    <section className="print:break-inside-avoid">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        <Pill className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
        Medications (prescriptions)
      </h3>
      <div className="space-y-4">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 dark:bg-gray-900/40 print:break-inside-avoid"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{rx.prescription_number}</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {formatDate(rx.prescription_date ?? rx.occurred_at ?? rx.created_at)} ·{' '}
                  {formatPreviewText(rx.status) || '—'} · {formatPreviewText(rx.prescription_type) || '—'}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {previewClinicianLabel(rx.clinician?.name)} · {formatDateTime(rx.occurred_at ?? rx.created_at)}
                </p>
              </div>
              <div className="text-right">
                <PreviewFacilityCell facility={rx.facility} />
              </div>
            </div>
            {rx.diagnosis ? <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">Dx context: {rx.diagnosis}</p> : null}
            {rx.items.length === 0 ? (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-500">No line items.</p>
            ) : (
              <table className="mt-3 w-full border-collapse border border-slate-200 text-xs dark:border-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800/80">
                  <tr>
                    <th className="border border-slate-200 px-2 py-1 text-left font-medium text-slate-800 dark:border-slate-700 dark:text-slate-200">
                      Medication
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left font-medium text-slate-800 dark:border-slate-700 dark:text-slate-200">
                      Sig
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left font-medium text-slate-800 dark:border-slate-700 dark:text-slate-200">
                      Route
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rx.items.map((it) => (
                    <tr key={it.id}>
                      <td className="border border-slate-200 px-2 py-1 font-medium text-slate-900 dark:border-slate-700 dark:text-slate-100">
                        {it.medication_name}
                        {it.strength ? ` · ${it.strength}` : ''} {it.dosage_form ? `(${it.dosage_form})` : ''}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                        {[it.frequency, it.duration_value != null ? `${it.duration_value} ${it.duration_unit ?? ''}` : null]
                          .filter(Boolean)
                          .map((value) => formatPreviewText(String(value)))
                          .join(' · ') || '—'}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                        {formatPreviewText(it.route) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
