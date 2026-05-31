import type { PatientMedicalHistoryPayload } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import type { ClinicalFormModuleId } from '../../../medical-records/ui/visit-action-center/patient-records/clinicalFormGridDefinitions';
import { formatDateTime } from '../../../medical-records/ui/visit-action-center/clinical-forms/allergies-form-components/allergiesForm.utils';

function FacilityLine({
  name,
  code,
}: {
  name?: string | null;
  code?: string | null;
}) {
  if (!name) return <span className="text-slate-500">—</span>;
  return (
    <span className="text-sm text-slate-700">
      <span className="font-medium">{name}</span>
      {code ? <span className="text-slate-500"> ({code})</span> : null}
    </span>
  );
}

export interface PatientPortalLatestVisitClinicalDetailProps {
  moduleId: ClinicalFormModuleId;
  scoped: PatientMedicalHistoryPayload;
  theme: 'light' | 'dark';
}

/**
 * Read-only clinical documentation for the patient&apos;s latest visit, sourced from
 * GET /patients/{id}/medical-history (visit-filtered payload).
 */
export function PatientPortalLatestVisitClinicalDetail({
  moduleId,
  scoped,
  theme,
}: PatientPortalLatestVisitClinicalDetailProps) {
  const isDark = theme === 'dark';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';
  const card = isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white';

  const empty = (label: string) => (
    <p className={`text-sm ${muted}`}>No {label} were recorded for this visit.</p>
  );

  switch (moduleId) {
    case 'consultations':
      if (!scoped.consultations.length) return empty('consultation records');
      return (
        <ul className="space-y-3">
          {scoped.consultations.map((c) => (
            <li key={c.id} className={`rounded-xl border p-4 ${card}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {c.consultation_type ?? 'Consultation'} · {c.request_status ?? '—'}
                </p>
                <FacilityLine name={c.facility?.name} code={c.facility?.code} />
              </div>
              {c.clinical_question ? (
                <p className={`mt-2 text-sm ${muted}`}>Question: {c.clinical_question}</p>
              ) : null}
              {c.findings ? (
                <p className={`mt-2 text-sm text-slate-800 dark:text-slate-200`}>Findings: {c.findings}</p>
              ) : null}
              {c.recommendations ? (
                <p className={`mt-2 text-sm ${muted}`}>Recommendations: {c.recommendations}</p>
              ) : null}
            </li>
          ))}
        </ul>
      );

    case 'prescriptions':
      if (!scoped.prescriptions.length) return empty('prescriptions');
      return (
        <ul className="space-y-4">
          {scoped.prescriptions.map((rx) => (
            <li key={rx.id} className={`rounded-xl border p-4 ${card}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {rx.prescription_number}
                  </p>
                  <p className={`text-xs ${muted}`}>
                    {formatDateTime(rx.occurred_at ?? rx.prescription_date ?? rx.created_at)}
                  </p>
                </div>
                <FacilityLine name={rx.facility?.name} code={rx.facility?.code} />
              </div>
              {rx.items?.length ? (
                <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                  {rx.items.map((item) => (
                    <li key={item.id} className="text-sm text-slate-800 dark:text-slate-200">
                      <span className="font-medium">{item.medication_name}</span>
                      {item.strength ? ` · ${item.strength}` : ''}{' '}
                      {item.dosage_form ? `(${item.dosage_form})` : ''}
                      {item.frequency ? ` · ${item.frequency}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-2 text-sm ${muted}`}>No line items listed.</p>
              )}
            </li>
          ))}
        </ul>
      );

    case 'lab-requests':
      if (!scoped.lab_requests.length) return empty('laboratory requests');
      return (
        <ul className="space-y-3">
          {scoped.lab_requests.map((req) => (
            <li key={req.id} className={`rounded-xl border p-4 ${card}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{req.request_uuid}</p>
                  <p className={`text-xs ${muted}`}>
                    {req.status ?? '—'} · {formatDateTime(req.occurred_at ?? req.requested_at)}
                  </p>
                </div>
                <FacilityLine name={req.facility?.name} code={req.facility?.code} />
              </div>
              {req.items?.length ? (
                <ul className={`mt-2 list-inside list-disc text-sm ${muted}`}>
                  {req.items.map((item) => (
                    <li key={item.id}>{item.test_name ?? 'Test'} · {item.status ?? '—'}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      );

    case 'lab-results':
      if (!scoped.lab_results.length) return empty('laboratory results');
      return (
        <ul className="space-y-2">
          {scoped.lab_results.map((r) => (
            <li key={r.id} className={`rounded-xl border p-3 ${card}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {r.test_name ?? 'Result'}
                    {r.field_name ? ` — ${r.field_name}` : ''}
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {r.value ?? '—'} {r.unit ?? ''}
                    {r.flag ? (
                      <span className={`ml-2 text-xs ${muted}`}>({r.flag})</span>
                    ) : null}
                  </p>
                </div>
                <FacilityLine name={r.facility?.name} code={r.facility?.code} />
              </div>
              {r.interpretation ? (
                <p className={`mt-1 text-xs ${muted}`}>{r.interpretation}</p>
              ) : null}
            </li>
          ))}
        </ul>
      );

    case 'clinical-template':
      return (
        <div className={`rounded-xl border p-4 ${card}`}>
          <p className={`text-sm ${muted}`}>
            Structured templates are recorded as part of clinical documentation. Review{' '}
            <strong className="text-slate-800 dark:text-slate-200">Clinical notes</strong> above for narrative and
            template-based entries for this visit.
          </p>
          {scoped.clinical_notes.length > 0 ? (
            <p className={`mt-3 text-sm ${muted}`}>
              This visit has {scoped.clinical_notes.length} clinical note
              {scoped.clinical_notes.length === 1 ? '' : 's'} on file.
            </p>
          ) : (
            <p className={`mt-3 text-sm ${muted}`}>No clinical notes for this visit.</p>
          )}
        </div>
      );

    default:
      return null;
  }
}
