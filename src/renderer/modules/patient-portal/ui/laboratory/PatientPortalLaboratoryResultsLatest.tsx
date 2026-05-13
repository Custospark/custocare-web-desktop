import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FlaskConical } from 'lucide-react';
import type { RootState } from '../../../../app/store/rootReducer';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import { PATIENT_PORTAL_ROUTES } from '../../../../app/routes/routeConstants';
import type { MedicalHistoryLabResult } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import { usePatientPortalLatestEncounter } from '../../hooks/usePatientPortalLatestEncounter';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { PatientPortalClinicalPreviewShell } from '../preview/PatientPortalClinicalPreviewShell';
import {
  formatDateTime,
  formatPreviewText,
  previewClinicianLabel,
  PreviewFacilityCell,
} from '../preview/patientPortalClinicalPreview.utils';

type Ctx = { theme: 'light' | 'dark' };

export function PatientPortalLaboratoryResultsLatestPage() {
  const { theme } = useOutletContext<Ctx>();
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const { historyQuery, latestVisitContextQuery, effectiveVisitId, scopedForEffective, headerVisit, headerFacility } =
    usePatientPortalLatestEncounter(numericId);

  const labResults = useMemo((): MedicalHistoryLabResult[] => {
    const rows = scopedForEffective?.lab_results ?? [];
    return [...rows].sort((a, b) => {
      const ta = new Date(a.occurred_at ?? a.recorded_at ?? 0).getTime();
      const tb = new Date(b.occurred_at ?? b.recorded_at ?? 0).getTime();
      return tb - ta;
    });
  }, [scopedForEffective?.lab_results]);

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
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading lab results for your latest visit…" />
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
        title="Laboratory results — latest visit"
        subtitle="When you have a hospital visit with lab results, a read-only preview will appear here."
        sectionLabel="Preview"
        icon={<FlaskConical className="h-8 w-8" />}
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

  return (
    <PatientPortalClinicalPreviewShell
      theme={theme}
      title="Laboratory results — latest visit"
      subtitle="Read-only preview of lab results tied to your most recent hospital visit. For all visits, orders, and context, open Medical history."
      sectionLabel="Preview"
      icon={<FlaskConical className="h-8 w-8" />}
      headerVisit={headerVisit}
      headerFacility={headerFacility}
      fullHistoryHref={PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_FULL}
      fullHistoryLinkLabel="Medical history (full)"
    >
      {labResults.length === 0 ? (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          No laboratory results were recorded for this visit. Your full history may include results under other visits —
          see Medical history.
        </p>
      ) : (
        <LabResultsPreviewTable results={labResults} />
      )}
    </PatientPortalClinicalPreviewShell>
  );
}

function LabResultsPreviewTable({ results }: { results: MedicalHistoryLabResult[] }) {
  return (
    <section className="print:break-inside-avoid">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        <FlaskConical className="h-4 w-4 text-cyan-800 dark:text-cyan-400" />
        Laboratory results
      </h3>
      <table className="w-full border-collapse border border-slate-200 text-sm dark:border-slate-700">
        <thead className="bg-slate-100 dark:bg-slate-800/80">
          <tr>
            <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
              Test
            </th>
            <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
              Result
            </th>
            <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
              Flag
            </th>
            <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
              Facility
            </th>
            <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
              Clinician / time
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((res) => (
            <tr key={res.id} className="align-top">
              <td className="border border-slate-200 px-2 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:text-slate-100">
                {res.test_name ?? 'Lab Test'}
                {res.field_name ? <div className="font-normal text-slate-700 dark:text-slate-300">{res.field_name}</div> : null}
              </td>
              <td className="border border-slate-200 px-2 py-2 text-xs text-slate-800 dark:border-slate-700 dark:text-slate-200">
                {res.value ?? '—'} {res.unit ?? ''}
                {res.reference_min || res.reference_max ? (
                  <div className="text-slate-600 dark:text-slate-400">
                    Ref: {res.reference_min ?? '—'} - {res.reference_max ?? '—'}
                  </div>
                ) : null}
              </td>
              <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">
                {formatPreviewText(res.flag) || '—'}
              </td>
              <td className="border border-slate-200 px-2 py-2 dark:border-slate-700">
                <PreviewFacilityCell facility={res.facility} />
              </td>
              <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">
                {previewClinicianLabel(res.clinician?.name)}
                <div>{formatDateTime(res.occurred_at ?? res.recorded_at)}</div>
                {res.verified_by?.name ? (
                  <div className="text-slate-600 dark:text-slate-400">
                    Verified: {previewClinicianLabel(res.verified_by?.name)}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
