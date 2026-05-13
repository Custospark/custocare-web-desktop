import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar } from 'lucide-react';
import type { RootState } from '../../../../app/store/rootReducer';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import { PATIENT_PORTAL_ROUTES } from '../../../../app/routes/routeConstants';
import type { FacilitySnapshot } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import { usePatientPortalLatestEncounter } from '../../hooks/usePatientPortalLatestEncounter';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { PatientPortalClinicalPreviewShell } from '../preview/PatientPortalClinicalPreviewShell';
import {
  extractAppointmentsList,
  usePatientPortalAppointmentsList,
  type PortalAppointmentRow,
} from '../../api/appointmentPortalQueries';
import {
  formatDateTime,
  formatPreviewText,
  previewClinicianLabel,
} from '../preview/patientPortalClinicalPreview.utils';

type Ctx = { theme: 'light' | 'dark' };

function bookableFacilitiesFromHistory(payload: { facilities: Record<string, FacilitySnapshot>; visits: { facility_id: number | null; facility: FacilitySnapshot | null }[] } | undefined): FacilitySnapshot[] {
  if (!payload) return [];
  const map = new Map<number, FacilitySnapshot>();
  for (const f of Object.values(payload.facilities)) {
    map.set(f.id, f);
  }
  for (const v of payload.visits) {
    if (v.facility_id != null && v.facility) {
      map.set(v.facility_id, v.facility);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function pickFeaturedAppointment(rows: PortalAppointmentRow[]): PortalAppointmentRow | null {
  if (rows.length === 0) return null;
  const now = Date.now();
  const terminal = new Set(['cancelled', 'completed', 'no_show']);
  const upcoming = rows
    .filter((a) => {
      if (!a.scheduled_start_time || terminal.has(a.status)) return false;
      return new Date(a.scheduled_start_time).getTime() > now;
    })
    .sort((a, b) => new Date(a.scheduled_start_time!).getTime() - new Date(b.scheduled_start_time!).getTime());
  if (upcoming.length > 0) return upcoming[0]!;
  return rows[0] ?? null;
}

function providerLine(a: PortalAppointmentRow): string {
  const p = a.provider;
  if (!p) return '—';
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  return previewClinicianLabel(name || null);
}

export function PatientPortalAppointmentsLatestPage() {
  const { theme } = useOutletContext<Ctx>();
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const { historyQuery, latestVisitContextQuery, headerVisit, headerFacility } = usePatientPortalLatestEncounter(numericId);

  const appointmentsQuery = usePatientPortalAppointmentsList(numericId, {
    enabled: numericId > 0,
  });

  const bookableFacilities = useMemo(
    () => bookableFacilitiesFromHistory(historyQuery.data ?? undefined),
    [historyQuery.data]
  );

  const appointmentRows = useMemo(() => extractAppointmentsList(appointmentsQuery.data), [appointmentsQuery.data]);

  const featured = useMemo(() => pickFeaturedAppointment(appointmentRows), [appointmentRows]);

  const previewFacility = featured?.facility ?? headerFacility;
  const previewVisit = headerVisit;

  if (!numericId) {
    return (
      <div className="p-6 text-sm text-gray-600 dark:text-gray-400">
        Patient record could not be loaded. Please sign in again or contact support.
      </div>
    );
  }

  const loading =
    historyQuery.isLoading || (latestVisitContextQuery.isPending && !historyQuery.data) || appointmentsQuery.isLoading;

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading your appointments…" />
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
    historyQuery.isSuccess && (latestVisitContextQuery.isSuccess || latestVisitContextQuery.isFetched);

  if (visitContextReady && !featured && bookableFacilities.length === 0) {
    return (
      <PatientPortalClinicalPreviewShell
        theme={theme}
        title="Appointments"
        subtitle="When your care team records facilities on your chart, you can request a new visit here."
        sectionLabel="Preview"
        icon={<Calendar className="h-8 w-8" />}
        headerVisit={null}
        headerFacility={null}
        fullHistoryHref={PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_FULL}
        fullHistoryLinkLabel="Medical history (full)"
      >
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          No facilities are linked to your record yet, so scheduling is not available. After you have been seen at a
          facility, refresh this page or contact the front desk to book.
        </p>
      </PatientPortalClinicalPreviewShell>
    );
  }

  const appointmentsBanner = appointmentsQuery.isError ? (
    <div className="mx-auto mb-4 max-w-4xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 print:hidden">
      {(appointmentsQuery.error as Error)?.message ?? 'Your appointment list could not be refreshed from the server.'}
    </div>
  ) : null;

  return (
    <PatientPortalClinicalPreviewShell
      theme={theme}
      title="Appointments"
      subtitle="Your next or most recent visit, plus a shortcut to request a new appointment at a facility on your chart."
      sectionLabel="Preview"
      icon={<Calendar className="h-8 w-8" />}
      headerVisit={previewVisit}
      headerFacility={previewFacility}
      fullHistoryHref={PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_FULL}
      fullHistoryLinkLabel="Medical history (full)"
      banner={appointmentsBanner}
    >
      <div className="space-y-6">
        {featured ? (
          <section className="print:break-inside-avoid">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              {featured.scheduled_start_time && new Date(featured.scheduled_start_time).getTime() > Date.now()
                ? 'Next appointment'
                : 'Latest appointment'}
            </h3>
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-gray-900/40">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {featured.scheduled_start_time_display?.trim() ||
                      (featured.scheduled_start_time ? formatDateTime(featured.scheduled_start_time) : '') ||
                      '—'}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {formatPreviewText(featured.status_display ?? featured.status)} ·{' '}
                    {formatPreviewText(featured.appointment_type_display ?? featured.appointment_type)}
                  </p>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    {providerLine(featured)} · {featured.duration_minutes != null ? `${featured.duration_minutes} min` : '—'}
                  </p>
                  {featured.reason_for_visit ? (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Reason: {featured.reason_for_visit}</p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{featured.facility?.name ?? '—'}</p>
                  {featured.facility?.type ? <p>{formatPreviewText(featured.facility.type)}</p> : null}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            No appointments on file yet. When your clinic schedules you, they will appear here.
          </p>
        )}

        {bookableFacilities.length > 0 || Boolean(featured?.facility?.id) ? (
          <div className="flex flex-col items-stretch gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <p className="text-sm text-slate-700 dark:text-slate-300">Need another visit?</p>
            <Link
              to={PATIENT_PORTAL_ROUTES.APPOINTMENTS_SCHEDULE}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              Schedule appointment
            </Link>
          </div>
        ) : null}
      </div>
    </PatientPortalClinicalPreviewShell>
  );
}
