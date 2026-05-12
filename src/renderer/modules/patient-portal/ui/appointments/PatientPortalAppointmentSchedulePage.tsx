import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Calendar } from 'lucide-react';
import type { RootState } from '../../../../app/store/rootReducer';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import { PATIENT_PORTAL_ROUTES } from '../../../../app/routes/routeConstants';
import type { AxiosError } from 'axios';
import {
  extractAppointmentsList,
  formatAppointmentMutationError,
  PORTAL_APPOINTMENT_TYPES,
  useCreatePortalAppointment,
  usePatientPortalAppointmentsList,
} from '../../api/appointmentPortalQueries';
import type { FacilitySnapshot } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import type { ForwardingStaff, StaffForwardingFilters } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { useGetStaffForForwardingByFacility } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { usePatientMedicalHistory } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryQueries';

type Ctx = { theme: 'light' | 'dark' };

function facilitiesFromHistoryPayload(payload: {
  facilities: Record<string, FacilitySnapshot>;
  visits: { facility_id: number | null; facility: FacilitySnapshot | null }[];
}): FacilitySnapshot[] {
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

function syntheticFacilityFromAppointmentFacility(f: { id: number; name: string; type?: string | null }): FacilitySnapshot {
  return {
    id: f.id,
    uuid: '',
    code: null,
    name: f.name,
    legal_name: null,
    type: f.type ?? null,
    tier: null,
    status: null,
    phone: null,
    email: null,
    address: {
      line1: null,
      line2: null,
      city: null,
      state: null,
      postal_code: null,
      country: null,
      formatted: '',
    },
  };
}

function forwardingStaffOptionLabel(s: ForwardingStaff): string {
  const name =
    s.full_name?.trim() ||
    [s.first_name, s.last_name].filter(Boolean).join(' ').trim() ||
    `Staff #${s.staff_id}`;
  const title = s.professional_title?.trim();
  const role = s.role_code ? s.role_code.replace(/-/g, ' ') : '';
  return [name, title, role].filter(Boolean).join(' — ');
}

const DEFAULT_DURATION_BY_TYPE: Record<string, number> = {
  followup_visit: 20,
  new_patient_consultation: 45,
  annual_physical: 60,
  telehealth: 30,
  consultation: 30,
  procedure: 60,
  diagnostic_test: 30,
  therapy_session: 50,
  vaccination: 15,
};

function toApiLocalDateTime(isoLocal: string): string {
  const d = new Date(isoLocal);
  if (!Number.isFinite(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export function PatientPortalAppointmentSchedulePage() {
  const { theme } = useOutletContext<Ctx>();
  const navigate = useNavigate();
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const historyQuery = usePatientMedicalHistory(numericId, { enabled: numericId > 0 });
  const appointmentsQuery = usePatientPortalAppointmentsList(numericId, { enabled: numericId > 0 });

  const [facilitySelection, setFacilitySelection] = useState<number | ''>('');
  const [providerStaffId, setProviderStaffId] = useState<number | ''>('');
  const [appointmentType, setAppointmentType] = useState<string>('followup_visit');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reason, setReason] = useState('');
  /** Inline message after a failed submit (e.g. 9 AM–5 PM rule); cleared when the user edits the time. */
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null);

  const forwardingFilters = useMemo<StaffForwardingFilters>(() => ({}), []);

  const mergedFacilities = useMemo(() => {
    if (!historyQuery.data) return [];
    return facilitiesFromHistoryPayload(historyQuery.data);
  }, [historyQuery.data]);

  const appointmentRows = useMemo(() => extractAppointmentsList(appointmentsQuery.data), [appointmentsQuery.data]);

  const facilityOptions = useMemo(() => {
    const map = new Map<number, FacilitySnapshot>();
    for (const f of mergedFacilities) {
      map.set(f.id, f);
    }
    for (const a of appointmentRows) {
      if (a.facility && !map.has(a.facility.id)) {
        map.set(a.facility.id, syntheticFacilityFromAppointmentFacility(a.facility));
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [mergedFacilities, appointmentRows]);

  /** Selected facility, or the only facility on file when there is exactly one option. */
  const resolvedFacilityId = useMemo((): number | null => {
    if (typeof facilitySelection === 'number' && facilitySelection > 0) {
      return facilitySelection;
    }
    if (facilityOptions.length === 1) {
      return facilityOptions[0]!.id;
    }
    return null;
  }, [facilitySelection, facilityOptions]);

  const forwardingStaffQuery = useGetStaffForForwardingByFacility(resolvedFacilityId, forwardingFilters);

  const forwardingStaffList = useMemo(() => {
    const rows = forwardingStaffQuery.data?.data?.staff ?? [];
    return [...rows].sort((a, b) =>
      (a.full_name || `${a.first_name} ${a.last_name}`).localeCompare(
        b.full_name || `${b.first_name} ${b.last_name}`,
        undefined,
        { sensitivity: 'base' }
      )
    );
  }, [forwardingStaffQuery.data]);

  const createMutation = useCreatePortalAppointment(numericId);

  const minLocal = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  if (!numericId) {
    return (
      <div className="p-6 text-sm text-gray-600 dark:text-gray-300">
        Patient record could not be loaded. Please sign in again or contact support.
      </div>
    );
  }

  if (historyQuery.isLoading || appointmentsQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading facilities…" />
      </div>
    );
  }

  if (historyQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm text-red-800 dark:text-red-200">
          {(historyQuery.error as Error)?.message ?? 'Unable to load your chart for scheduling.'}
        </p>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const shell = isDark ? 'border-gray-600 bg-gray-950' : 'border-slate-200 bg-white';
  const pageBg = isDark ? 'bg-gray-900' : 'bg-slate-50';
  const meta = isDark ? 'text-gray-300' : 'text-slate-600';
  const heading = isDark ? 'text-gray-50' : 'text-slate-900';
  const fieldLabel = isDark ? 'text-gray-100' : 'text-slate-900';
  const controlClass = isDark
    ? 'w-full cursor-pointer rounded-lg border border-gray-500 bg-gray-900 px-3 py-2 text-sm text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60'
    : 'w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleFeedback(null);
    if (resolvedFacilityId == null || typeof providerStaffId !== 'number') return;
    const scheduled_start_time = toApiLocalDateTime(scheduledLocal);
    if (!scheduled_start_time) return;
    createMutation.mutate(
      {
        facility_id: resolvedFacilityId,
        patient_id: numericId,
        provider_staff_id: providerStaffId,
        appointment_type: appointmentType,
        scheduled_start_time,
        duration_minutes: durationMinutes,
        reason_for_visit: reason.trim() || null,
      },
      {
        onSuccess: () => {
          setScheduleFeedback(null);
          navigate(PATIENT_PORTAL_ROUTES.APPOINTMENTS);
        },
        onError: (err: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
          setScheduleFeedback(formatAppointmentMutationError(err));
        },
      }
    );
  };

  const providerLoading = Boolean(resolvedFacilityId) && forwardingStaffQuery.isLoading;
  const providerFetching = Boolean(resolvedFacilityId) && forwardingStaffQuery.isFetching && !forwardingStaffQuery.isLoading;

  return (
    <div className={`min-h-full p-4 sm:p-5 lg:p-6 ${pageBg}`}>
      <div className="mx-auto w-full max-w-xl">
        <Link
          to={PATIENT_PORTAL_ROUTES.APPOINTMENTS}
          className={`mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-800 hover:text-blue-900'}`}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to appointments
        </Link>

        <div className={`rounded-xl border shadow-sm ${shell}`}>
          <div className={`flex items-start gap-3 border-b px-5 py-4 ${isDark ? 'border-gray-700' : 'border-slate-100'}`}>
            <Calendar className={`mt-0.5 h-8 w-8 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-300">Schedule</p>
              <h1 className={`mt-0.5 text-xl font-bold ${heading}`}>Request an appointment</h1>
              <p className={`mt-1 text-sm leading-relaxed ${meta}`}>
                Choose a facility from your record, then a provider at that location. Providers are loaded for the
                selected facility using the same directory as visit forwarding.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5 md:p-6">
            {facilityOptions.length === 0 ? (
              <p className={`text-sm leading-relaxed ${meta}`}>
                No facilities are available from your medical history yet. After you are seen at a clinic, return here or
                call the front desk to book.
              </p>
            ) : (
              <label className="block">
                <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${fieldLabel}`}>Facility</span>
                <select
                  required
                  value={resolvedFacilityId != null ? String(resolvedFacilityId) : ''}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setFacilitySelection(v ? Number(v) : '');
                    setProviderStaffId('');
                    setScheduleFeedback(null);
                  }}
                  className={controlClass}
                >
                  <option value="">Select facility…</option>
                  {facilityOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                      {f.code ? ` (${f.code})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${fieldLabel}`}>Provider</span>
              {providerLoading ? (
                <div
                  className={`rounded-lg border p-3 ${isDark ? 'border-gray-600 bg-gray-900/80' : 'border-slate-200 bg-slate-50'}`}
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="space-y-2">
                    <div
                      className={`h-3 w-28 animate-pulse rounded ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}
                      aria-hidden
                    />
                    <div
                      className={`h-10 w-full animate-pulse rounded-lg ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}
                      aria-hidden
                    />
                  </div>
                  <LoadingSkeleton
                    variant="minimal"
                    theme={theme}
                    message="Loading providers for this facility…"
                    className="mt-3 justify-start pl-0"
                  />
                </div>
              ) : (
              <select
                required
                disabled={!resolvedFacilityId}
                value={providerStaffId === '' ? '' : String(providerStaffId)}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setProviderStaffId(v ? Number(v) : '');
                }}
                className={controlClass}
              >
                <option value="">
                  {!resolvedFacilityId ? 'Select a facility first' : 'Select provider…'}
                </option>
                {forwardingStaffList.map((s) => (
                  <option key={s.staff_id} value={s.staff_id}>
                    {forwardingStaffOptionLabel(s)}
                  </option>
                ))}
              </select>
              )}
              {providerFetching ? (
                <p className={`mt-1.5 text-xs ${meta}`}>Refreshing provider list…</p>
              ) : null}
              {forwardingStaffQuery.isError ? (
                <p className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-300">
                  Could not load providers for this facility. Try again or contact support.
                </p>
              ) : null}
              {resolvedFacilityId && !providerLoading && !forwardingStaffQuery.isError && forwardingStaffList.length === 0 ? (
                <p className={`mt-1.5 text-xs leading-relaxed ${meta}`}>
                  No providers are listed for this facility right now. You can still try another facility or call the
                  clinic.
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${fieldLabel}`}>Visit type</span>
              <select
                required
                value={appointmentType}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setAppointmentType(v);
                  const nextDur = DEFAULT_DURATION_BY_TYPE[v];
                  if (nextDur) setDurationMinutes(nextDur);
                }}
                className={controlClass}
              >
                {PORTAL_APPOINTMENT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${fieldLabel}`}>Date & time</span>
              <input
                type="datetime-local"
                required
                min={minLocal}
                value={scheduledLocal}
                onChange={(ev) => {
                  setScheduledLocal(ev.target.value);
                  setScheduleFeedback(null);
                }}
                className={controlClass}
              />
              <p className={`mt-1.5 text-xs leading-relaxed ${meta}`}>
                Choose a time in the future. This clinic only accepts self-scheduled times between{' '}
                <span className="font-medium text-slate-800 dark:text-gray-100">9:00 AM and 5:00 PM</span> (local time).
                Your request may still need staff confirmation.
              </p>
            </label>

            {scheduleFeedback ? (
              <div
                role="alert"
                className={`rounded-lg border px-3 py-2.5 text-sm leading-relaxed ${
                  isDark
                    ? 'border-blue-700 bg-blue-950/60 text-blue-100'
                    : 'border-blue-200 bg-blue-50 text-blue-950'
                }`}
              >
                {scheduleFeedback}
              </div>
            ) : null}

            <label className="block">
              <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${fieldLabel}`}>
                Duration (minutes)
              </span>
              <input
                type="number"
                required
                min={5}
                max={480}
                value={durationMinutes}
                onChange={(ev) => setDurationMinutes(Number(ev.target.value))}
                className={controlClass}
              />
            </label>

            <label className="block">
              <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${fieldLabel}`}>
                Reason (optional)
              </span>
              <textarea
                rows={3}
                value={reason}
                onChange={(ev) => setReason(ev.target.value)}
                maxLength={1000}
                className={controlClass}
              />
            </label>

            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                facilityOptions.length === 0 ||
                resolvedFacilityId == null ||
                typeof providerStaffId !== 'number' ||
                providerLoading
              }
              className={`w-full cursor-pointer rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {createMutation.isPending ? 'Submitting…' : 'Submit request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
